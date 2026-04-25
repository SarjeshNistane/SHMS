import mongoose from "mongoose";

const systemEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const SystemEvent = mongoose.model("SystemEvent", systemEventSchema);

