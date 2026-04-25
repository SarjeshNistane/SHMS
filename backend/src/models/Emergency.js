import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const aiDecisionSchema = new mongoose.Schema(
  {
    action: String,
    confidence: Number,
    priority: String,
    reasoning: String,
    anomalyFlag: Boolean,
    usedFallback: { type: Boolean, default: false }
  },
  { _id: false }
);

const emergencySchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    scenarioId: String,
    sensorSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, required: true, index: true },
    priority: { type: String, required: true, index: true },
    queueSequence: { type: Number, required: true },
    etaMinutes: Number,
    aiDecision: aiDecisionSchema,
    assignedBed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed" },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    timeline: { type: [timelineEntrySchema], default: [] }
  },
  { timestamps: true }
);

export const Emergency = mongoose.model("Emergency", emergencySchema);

