import { config } from "../config.js";
import { Bed } from "../models/Bed.js";
import { Doctor } from "../models/Doctor.js";

function bedScore(emergency, waitingTime = 0) {
  const emergencyWeight = emergency.priority === "HIGH" ? 3 : emergency.priority === "MEDIUM" ? 2 : 1;
  const severity = emergency.aiDecision?.confidence || 0.5;
  return emergencyWeight * 5 + severity * 3 + waitingTime;
}

function doctorScore(doctor, emergency) {
  const specializationMatch =
    doctor.specialization === "Emergency Medicine" || emergency.priority === "HIGH" ? 5 : 2;
  const loadWeight = 1.5;
  return doctor.availability - doctor.currentLoad * loadWeight + specializationMatch;
}

export async function allocateBed(emergency) {
  const candidates = await Bed.find({ available: true }).sort({ updatedAt: 1 }).lean();
  if (!candidates.length) {
    return { bed: null, etaMinutes: await estimateEta(emergency.priority) };
  }

  const chosen = candidates
    .map((bed) => ({ bed, score: bedScore(emergency, 0) }))
    .sort((a, b) => b.score - a.score)[0]?.bed;

  const bed = await Bed.findOneAndUpdate(
    { _id: chosen._id, available: true },
    { $set: { available: false, currentEmergencyId: emergency._id } },
    { new: true }
  );

  if (!bed) {
    return { bed: null, etaMinutes: await estimateEta(emergency.priority) };
  }

  return { bed, etaMinutes: 0 };
}

export async function allocateDoctor(emergency) {
  const candidates = await Doctor.find({ available: true }).lean();
  if (!candidates.length) {
    return { doctor: null, etaMinutes: await estimateEta(emergency.priority) };
  }

  const chosen = candidates
    .map((doctor) => ({ doctor, score: doctorScore(doctor, emergency) }))
    .sort((a, b) => b.score - a.score)[0]?.doctor;

  const doctor = await Doctor.findOneAndUpdate(
    { _id: chosen._id, available: true },
    {
      $set: { available: false, currentEmergencyId: emergency._id },
      $inc: { currentLoad: 1 }
    },
    { new: true }
  );

  if (!doctor) {
    return { doctor: null, etaMinutes: await estimateEta(emergency.priority) };
  }

  return { doctor, etaMinutes: 0 };
}

export async function estimateEta(priority) {
  const queuePosition = await estimateQueuePosition(priority);
  return config.averageTreatmentTime * queuePosition;
}

async function estimateQueuePosition(priority) {
  const pendingPriorityWeight = priority === "HIGH" ? 3 : priority === "MEDIUM" ? 2 : 1;
  const activeLoad = await Doctor.countDocuments({ available: false });
  return Math.max(1, activeLoad + (4 - pendingPriorityWeight));
}

export async function releaseResources(emergencyId) {
  const [bed, doctor] = await Promise.all([
    Bed.findOneAndUpdate(
      { currentEmergencyId: emergencyId },
      { $set: { available: true, currentEmergencyId: null } }
    ),
    Doctor.findOneAndUpdate(
      { currentEmergencyId: emergencyId },
      { $set: { available: true, currentEmergencyId: null }, $inc: { currentLoad: -1 } }
    )
  ]);
  return { bed, doctor };
}

