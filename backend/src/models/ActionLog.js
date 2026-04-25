import mongoose from "mongoose";

const actionLogSchema = new mongoose.Schema(
  {
    emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Emergency", index: true },
    type: { type: String, required: true },
    status: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const ActionLog = mongoose.model("ActionLog", actionLogSchema);

