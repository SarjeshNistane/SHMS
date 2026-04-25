import mongoose from "mongoose";

const bedSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    ward: { type: String, required: true },
    available: { type: Boolean, default: true, index: true },
    currentEmergencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Emergency" }
  },
  { timestamps: true }
);

export const Bed = mongoose.model("Bed", bedSchema);

