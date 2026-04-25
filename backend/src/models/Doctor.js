import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['doctor', 'admin'], default: 'doctor' },
    specialization: { type: String, required: true },
    availability: { type: Number, required: true, default: 10 },
    currentLoad: { type: Number, required: true, default: 0 },
    available: { type: Boolean, default: true, index: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    currentEmergencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Emergency" }
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);

