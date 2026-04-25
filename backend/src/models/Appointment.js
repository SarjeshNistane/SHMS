import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    patientAge: { type: Number },
    patientEmail: { type: String },
    patientPhone: { type: String },
    department: { type: String, required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    time: { type: String, required: true },
    reason: { type: String },
    status: { type: String, default: "Scheduled" }
  },
  { timestamps: true }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
