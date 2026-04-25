import { config } from "../config.js";

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computePriority(confidence, anomalyFlag) {
  if (confidence >= 0.8 || anomalyFlag) {
    return "HIGH";
  }
  if (confidence >= 0.55) {
    return "MEDIUM";
  }
  return "LOW";
}

function buildReasoning(snapshot) {
  const reasons = [];
  if (snapshot.impact >= 0.8) reasons.push("impact spike");
  if (snapshot.motion >= 0.65) reasons.push("abnormal motion");
  if (snapshot.inactivity >= 0.7) reasons.push("inactivity pattern");
  if (snapshot.locationRisk >= 0.6) reasons.push("high-risk location");
  return reasons.length
    ? `${reasons.join(" + ")} matches accident profile`
    : "Moderate signal pattern suggests emergency condition";
}

function deriveDynamicThreshold(snapshot, historicalFactor) {
  return clamp(0.55 + historicalFactor * 0.1 + (snapshot.locationRisk || 0) * 0.05);
}

export async function evaluateEmergency(snapshot, history = {}) {
  const startedAt = Date.now();
  const processingDelay = Number(snapshot.simulatedProcessingMs || 120);

  const evaluationPromise = (async () => {
    await sleep(processingDelay);

    const motion = clamp(snapshot.motion || 0);
    const impact = clamp(snapshot.impact || 0);
    const inactivity = clamp(snapshot.inactivity || 0);
    const locationRisk = clamp(snapshot.locationRisk || 0);
    const historicalFactor = clamp(history.recentEmergencyRate || 0.4);

    const confidence = clamp(
      motion * 0.3 + impact * 0.3 + inactivity * 0.2 + locationRisk * 0.2
    );
    const threshold = deriveDynamicThreshold(snapshot, historicalFactor);
    const anomalyFlag = confidence >= threshold && (impact > 0.75 || inactivity > 0.75);
    const priority = computePriority(confidence, anomalyFlag);

    return {
      action: confidence >= threshold ? "DISPATCH_AMBULANCE" : "OBSERVE_AND_ALERT",
      confidence: Number(confidence.toFixed(2)),
      priority,
      reasoning: buildReasoning({ motion, impact, inactivity, locationRisk }),
      anomalyFlag,
      metrics: {
        motion,
        impact,
        inactivity,
        locationRisk,
        threshold: Number(threshold.toFixed(2))
      },
      durationMs: Date.now() - startedAt
    };
  })();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("AI_TIMEOUT")), config.aiTimeoutMs);
  });

  return Promise.race([evaluationPromise, timeoutPromise]);
}

export function fallbackDecision(snapshot = {}) {
  const impact = clamp(snapshot.impact || 0);
  const inactivity = clamp(snapshot.inactivity || 0);
  const motion = clamp(snapshot.motion || 0);
  const confidence = clamp(0.6 + impact * 0.2 + inactivity * 0.1 + motion * 0.1);

  return {
    action: "DISPATCH_AMBULANCE",
    confidence: Number(confidence.toFixed(2)),
    priority: confidence >= 0.82 ? "HIGH" : "MEDIUM",
    reasoning: "Rule fallback triggered due to AI timeout or failure",
    anomalyFlag: impact >= 0.8 || inactivity >= 0.75,
    usedFallback: true,
    metrics: {
      motion,
      impact,
      inactivity,
      locationRisk: clamp(snapshot.locationRisk || 0),
      threshold: 0.6
    },
    durationMs: config.aiTimeoutMs
  };
}

