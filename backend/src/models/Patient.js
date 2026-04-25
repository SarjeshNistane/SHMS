import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    bloodGroup: String,
    riskLevel: { type: Number, default: 1 },
    primaryCondition: String
  },
  { timestamps: true }
);

export const Patient = mongoose.model("Patient", patientSchema);

