import { Router } from "express";
import { evaluateEmergency, fallbackDecision } from "../services/aiEngine.js";

export const aiRouter = Router();

aiRouter.post("/evaluate", async (req, res) => {
  try {
    const decision = await evaluateEmergency(req.body.sensorSnapshot || {}, {
      recentEmergencyRate: 0.45
    });
    res.json({ success: true, decision });
  } catch (_error) {
    res.json({
      success: true,
      decision: fallbackDecision(req.body.sensorSnapshot || {})
    });
  }
});

