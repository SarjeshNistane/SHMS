import { Router } from "express";
import {
  createEmergencyTrigger,
  resetDemoState,
  getAllPatients,
  attendEmergency,
  completeEmergency,
  getActiveEmergencies,
  forceCompleteEmergency,
  getEmergencyById
} from "../services/emergencyService.js";

export const emergencyRouter = Router();

emergencyRouter.post("/trigger", async (req, res, next) => {
  try {
    const emergency = await createEmergencyTrigger(req.body);
    res.status(202).json({ success: true, emergency });
  } catch (error) {
    next(error);
  }
});

emergencyRouter.post("/demo/complete", async (req, res, next) => {
  try {
    const emergency = await forceCompleteEmergency(req.body);
    res.status(202).json({ success: true, emergency });
  } catch (error) {
    next(error);
  }
});

emergencyRouter.post("/demo/reset", async (_req, res, next) => {
  try {
    await resetDemoState();
    const data = await getActiveEmergencies();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
});

emergencyRouter.get("/active", async (_req, res, next) => {
  try {
    const data = await getActiveEmergencies();
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
});

emergencyRouter.get("/patients", async (_req, res, next) => {
  try {
    const patients = await getAllPatients();
    res.json({ success: true, patients });
  } catch (error) {
    next(error);
  }
});

emergencyRouter.post("/:id/attend", async (req, res, next) => {
  try {
    const emergency = await attendEmergency(req.params.id);
    res.json({ success: true, emergency });
  } catch (error) {
    next(error);
  }
});

emergencyRouter.post("/:id/complete", async (req, res, next) => {
  try {
    const emergency = await completeEmergency(req.params.id);
    res.json({ success: true, emergency });
  } catch (error) {
    next(error);
  }
});
