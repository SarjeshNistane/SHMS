import { Router } from "express";
import { Bed } from "../models/Bed.js";
import { Doctor } from "../models/Doctor.js";

export const resourceRouter = Router();

resourceRouter.get("/beds", async (_req, res, next) => {
  try {
    const beds = await Bed.find().sort({ code: 1 }).lean();
    res.json({ success: true, beds });
  } catch (error) {
    next(error);
  }
});

resourceRouter.get("/doctors", async (_req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 }).lean();
    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
});

