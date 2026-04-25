import { Router } from "express";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

export const appointmentRouter = Router();

// Only allow logged in users (like doctors/admin) to view all appointments
appointmentRouter.get("/", authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public endpoint to view booked appointments (for the Live Queue and slot filtering)
appointmentRouter.get("/public", async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId', 'name specialization')
      .sort({ time: 1 })
      .lean();
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public endpoint for patients to book
appointmentRouter.post("/", async (req, res) => {
  try {
    const { doctorId, patientName, patientAge, time, department, reason } = req.body;
    
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor selection is required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Selected doctor not found" });
    }

    // Check for double booking
    const existing = await Appointment.findOne({ doctorId, time });
    if (existing) {
      return res.status(409).json({ success: false, message: "Slot already booked for this doctor" });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientName,
      patientAge,
      time,
      department,
      reason
    });
    
    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
