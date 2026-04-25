import { config } from "../config.js";
import { emergencyStatuses, priorities, systemIndicators, timelineTypes } from "../constants.js";
import { Emergency } from "../models/Emergency.js";
import { Patient } from "../models/Patient.js";
import { SystemEvent } from "../models/SystemEvent.js";
import { allocateBed, allocateDoctor, estimateEta, releaseResources } from "./resourceService.js";
import { evaluateEmergency, fallbackDecision } from "./aiEngine.js";
import { logAction, logSystemEvent } from "./logService.js";
import { notifyDashboardUpdate } from "./realtimeService.js";
import { resetDemoData } from "./seedService.js";

let sequenceCounter = 0;
const queue = [];
let workerRunning = false;
const recentDeviceWindows = new Map();
const terminalStatuses = new Set([
  emergencyStatuses.WAITING,
  emergencyStatuses.PARTIAL,
  emergencyStatuses.COMPLETED
]);

function nowIso() {
  return new Date().toISOString();
}

function getPriorityScore(priority) {
  return priorities[priority] || priorities.LOW;
}

function sortQueue() {
  queue.sort((a, b) => {
    const priorityDiff = getPriorityScore(b.priority) - getPriorityScore(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.queueSequence - b.queueSequence;
  });
}

async function persistTimeline(emergencyId, entry) {
  await Emergency.findByIdAndUpdate(emergencyId, { $push: { timeline: entry } });
}

async function markPartial(emergency, reason, retryableStep) {
  await Emergency.findByIdAndUpdate(emergency._id, {
    $set: { status: emergencyStatuses.PARTIAL },
    $push: {
      timeline: {
        type: timelineTypes.PARTIAL,
        status: emergencyStatuses.PARTIAL,
        message: reason,
        meta: { retryableStep },
        createdAt: new Date()
      }
    }
  });
  await logAction(emergency._id, "PARTIAL", emergencyStatuses.PARTIAL, { reason, retryableStep });
  await notifyDashboardUpdate();
}

async function scheduleRetry(emergencyId, step, reason) {
  await logAction(emergencyId, "RETRY_SCHEDULED", "PENDING", { step, reason });
  await logSystemEvent("RETRY_SCHEDULED", `Scheduled retry for ${step}`, { emergencyId, reason });
}

function buildHistorySignals() {
  return {
    recentEmergencyRate: 0.45
  };
}

function isDuplicateTrigger(deviceId, eventTimestamp) {
  const timestamp = new Date(eventTimestamp || Date.now()).getTime();
  const lastSeen = recentDeviceWindows.get(deviceId);
  if (lastSeen && timestamp - lastSeen < config.deviceDedupWindowMs) {
    return true;
  }
  recentDeviceWindows.set(deviceId, timestamp);
  return false;
}

export async function createEmergencyTrigger(payload = {}) {
  const patient = payload.patientId
    ? await Patient.findById(payload.patientId)
    : await Patient.findOne().sort({ createdAt: 1 });

  if (!payload.deviceId) {
    throw new Error("deviceId is required");
  }

  if (isDuplicateTrigger(payload.deviceId, payload.eventTimestamp)) {
    throw new Error("Duplicate emergency trigger ignored");
  }

  sequenceCounter += 1;
  const initialPriority = payload.priority || "HIGH";

  const emergency = await Emergency.create({
    deviceId: payload.deviceId,
    patientId: patient?._id,
    scenarioId: payload.scenarioId || "default-accident",
    sensorSnapshot: payload.sensorSnapshot || {},
    status: emergencyStatuses.QUEUED,
    priority: initialPriority,
    queueSequence: sequenceCounter,
    timeline: [
      {
        type: timelineTypes.TRIGGERED,
        status: emergencyStatuses.QUEUED,
        message: "Emergency accepted and queued",
        meta: { acceptedAt: nowIso() }
      }
    ]
  });

  queue.push({
    emergencyId: emergency._id.toString(),
    priority: initialPriority,
    queueSequence: emergency.queueSequence
  });
  sortQueue();

  await logAction(emergency._id, "EMERGENCY_ACCEPTED", emergencyStatuses.QUEUED, {
    deviceId: payload.deviceId,
    scenarioId: emergency.scenarioId
  });
  await logSystemEvent("QUEUE_ENQUEUED", "Emergency added to sequential worker queue", {
    emergencyId: emergency._id,
    priority: initialPriority
  });
  await notifyDashboardUpdate();

  void runWorker();

  return await getEmergencyById(emergency._id);
}

async function dispatchAmbulance(emergency) {
  await Emergency.findByIdAndUpdate(emergency._id, {
    $set: { status: emergencyStatuses.DISPATCHED },
    $push: {
      timeline: {
        type: timelineTypes.DISPATCH,
        status: emergencyStatuses.DISPATCHED,
        message: "Ambulance dispatch initiated",
        createdAt: new Date()
      }
    }
  });
  await logAction(emergency._id, "AMBULANCE_DISPATCH", emergencyStatuses.DISPATCHED, {});
  await notifyDashboardUpdate();
}

async function processEmergencyJob(job) {
  let emergency = await Emergency.findById(job.emergencyId);
  if (!emergency) return;

  try {
    await Emergency.findByIdAndUpdate(emergency._id, {
      $set: { status: emergencyStatuses.TRIGGERED },
      $push: {
        timeline: {
          type: timelineTypes.TRIGGERED,
          status: emergencyStatuses.TRIGGERED,
          message: "Sequential worker started processing",
          createdAt: new Date()
        }
      }
    });

    emergency = await Emergency.findById(emergency._id);

    let decision;
    try {
      decision = await evaluateEmergency(emergency.sensorSnapshot, buildHistorySignals());
      await logAction(emergency._id, "AI_DECISION", "SUCCESS", decision);
    } catch (error) {
      decision = fallbackDecision(emergency.sensorSnapshot);
      await logAction(emergency._id, "AI_DECISION", "FAILED", { error: error.message });
      await logSystemEvent(systemIndicators.AI_FALLBACK, "AI fallback triggered for emergency", {
        emergencyId: emergency._id,
        reason: error.message
      });
      await persistTimeline(emergency._id, {
        type: timelineTypes.FALLBACK,
        status: emergencyStatuses.TRIGGERED,
        message: "AI timeout/failure caused rule fallback",
        meta: { reason: error.message },
        createdAt: new Date()
      });
    }

    await Emergency.findByIdAndUpdate(emergency._id, {
      $set: {
        priority: decision.priority,
        aiDecision: decision
      },
      $push: {
        timeline: {
          type: timelineTypes.AI_DECISION,
          status: emergencyStatuses.TRIGGERED,
          message: decision.reasoning,
          meta: decision.metrics,
          createdAt: new Date()
        }
      }
    });
    await notifyDashboardUpdate();

    await dispatchAmbulance(emergency);

    const refreshedForResources = await Emergency.findById(emergency._id);
    const bedResult = await allocateBed(refreshedForResources);
    if (!bedResult.bed) {
      const etaMinutes = bedResult.etaMinutes || (await estimateEta(refreshedForResources.priority));
      await Emergency.findByIdAndUpdate(emergency._id, {
        $set: { status: emergencyStatuses.WAITING, etaMinutes },
        $push: {
          timeline: {
            type: timelineTypes.WAITING,
            status: emergencyStatuses.WAITING,
            message: "No bed available. Emergency moved to waiting state",
            meta: { etaMinutes },
            createdAt: new Date()
          }
        }
      });
      await logAction(emergency._id, "BED_ASSIGNMENT", emergencyStatuses.WAITING, { etaMinutes });
      await notifyDashboardUpdate();
      return;
    }

    await Emergency.findByIdAndUpdate(emergency._id, {
      $set: { assignedBed: bedResult.bed._id },
      $push: {
        timeline: {
          type: timelineTypes.BED_ASSIGNED,
          status: emergencyStatuses.DISPATCHED,
          message: `Assigned bed ${bedResult.bed.code}`,
          createdAt: new Date()
        }
      }
    });
    await logAction(emergency._id, "BED_ASSIGNMENT", "SUCCESS", { bedId: bedResult.bed._id });
    await notifyDashboardUpdate();

    const doctorResult = await allocateDoctor(await Emergency.findById(emergency._id));
    if (!doctorResult.doctor) {
      const etaMinutes = doctorResult.etaMinutes || (await estimateEta(refreshedForResources.priority));
      await Emergency.findByIdAndUpdate(emergency._id, {
        $set: { status: emergencyStatuses.WAITING, etaMinutes },
        $push: {
          timeline: {
            type: timelineTypes.WAITING,
            status: emergencyStatuses.WAITING,
            message: "No doctor available. Emergency moved to waiting state",
            meta: { etaMinutes },
            createdAt: new Date()
          }
        }
      });
      await logAction(emergency._id, "DOCTOR_ASSIGNMENT", emergencyStatuses.WAITING, { etaMinutes });
      await notifyDashboardUpdate();
      return;
    }

    await Emergency.findByIdAndUpdate(emergency._id, {
      $set: {
        assignedDoctor: doctorResult.doctor._id,
        status: emergencyStatuses.COMPLETED,
        etaMinutes: 0
      },
      $push: {
        timeline: {
          type: timelineTypes.DOCTOR_ASSIGNED,
          status: emergencyStatuses.COMPLETED,
          message: `Assigned doctor ${doctorResult.doctor.name}`,
          createdAt: new Date()
        }
      }
    });
    await persistTimeline(emergency._id, {
      type: timelineTypes.COMPLETED,
      status: emergencyStatuses.COMPLETED,
      message: "Emergency pipeline completed",
      createdAt: new Date()
    });
    await logAction(emergency._id, "DOCTOR_ASSIGNMENT", "SUCCESS", {
      doctorId: doctorResult.doctor._id
    });
    await notifyDashboardUpdate();
  } catch (error) {
    await markPartial(emergency, error.message, "PROCESS_PIPELINE");
    await scheduleRetry(emergency._id, "PROCESS_PIPELINE", error.message);
  }
}

export async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;

  while (queue.length) {
    const job = queue.shift();
    await processEmergencyJob(job);
  }

  workerRunning = false;
}

export async function resetDemoState() {
  queue.length = 0;
  workerRunning = false;
  recentDeviceWindows.clear();
  sequenceCounter = 0;
  await resetDemoData();
  await notifyDashboardUpdate();
}

export async function getActiveEmergencies() {
  const emergencies = await Emergency.find()
    .sort({ createdAt: -1 })
    .populate("assignedBed")
    .populate("assignedDoctor")
    .populate("patientId")
    .lean();
  const systemEvents = await SystemEvent.find().sort({ createdAt: -1 }).limit(5).lean();

  return {
    emergencies,
    systemIndicators: {
      healthy: true,
      deviceDelayed: false,
      aiFallbackTriggered: systemEvents.some(
        (event) => event.type === systemIndicators.AI_FALLBACK
      )
    },
    debug: {
      lastEvents: systemEvents
    }
  };
}

export async function getEmergencyById(id) {
  return Emergency.findById(id)
    .populate("assignedBed")
    .populate("assignedDoctor")
    .populate("patientId")
    .lean();
}

async function waitForSettledEmergency(id, timeoutMs = 3000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const emergency = await getEmergencyById(id);
    if (emergency && terminalStatuses.has(emergency.status)) {
      return emergency;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return getEmergencyById(id);
}

export async function forceCompleteEmergency(payload = {}) {
  const emergency = await createEmergencyTrigger({
    deviceId: payload.deviceId || `manual-${Date.now()}`,
    scenarioId: "manual-complete",
    sensorSnapshot: {
      motion: 0.9,
      impact: 0.92,
      inactivity: 0.87,
      locationRisk: 0.7,
      simulatedProcessingMs: 50
    },
    priority: "HIGH"
  });

  await runWorker();
  return waitForSettledEmergency(emergency._id);
}

export async function getAllPatients() {
  return Patient.find().sort({ name: 1 }).lean();
}

export async function attendEmergency(emergencyId) {
  const emergency = await Emergency.findByIdAndUpdate(
    emergencyId,
    {
      $set: { status: "ATTENDING" },
      $push: {
        timeline: {
          type: "DOCTOR_ATTENTION",
          status: "ATTENDING",
          message: "Doctor has started attending the patient",
          createdAt: new Date()
        }
      }
    },
    { new: true }
  );
  await notifyDashboardUpdate();
  return emergency;
}

export async function completeEmergency(emergencyId) {
  const emergency = await Emergency.findByIdAndUpdate(
    emergencyId,
    {
      $set: { status: emergencyStatuses.COMPLETED },
      $push: {
        timeline: {
          type: timelineTypes.COMPLETED,
          status: emergencyStatuses.COMPLETED,
          message: "Doctor marked treatment as complete",
          createdAt: new Date()
        }
      }
    },
    { new: true }
  );
  await releaseResources(emergencyId);
  await notifyDashboardUpdate();
  return emergency;
}
