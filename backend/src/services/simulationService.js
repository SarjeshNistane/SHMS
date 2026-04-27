import mongoose from "mongoose";
import { Emergency } from "../models/Emergency.js";
import { SystemEvent } from "../models/SystemEvent.js";
import { logSystemEvent } from "./logService.js";

export function startSimulation() {
  console.log("Hospital simulation engine started...");
  
  // Update vitals periodically
  setInterval(async () => {
    // Prevent simulation queries if DB is not yet ready
    if (mongoose.connection.readyState !== 1) return;

    try {
      const activeEmergencies = await Emergency.find({ status: { $ne: 'COMPLETED' } });
      
      for (const e of activeEmergencies) {
        // Slightly vary vitals in AI reasoning or internal state if we had it
        // For this demo, we'll just log a system event periodically to show activity
      }
      
      if (Math.random() > 0.6) {
        const actions = [
          "AI re-prioritizing queue based on severity...",
          "Nurse Anjali updated vitals for ward 4...",
          "Dr. Rajesh requested EMR for patient in ICU...",
          "System syncing with National Health ID (ABHA)...",
          "Ward assistant Ravi coordinated bed transfer...",
          "Monitoring oxygen supply in critical care unit...",
          "Pharmacist Sneha verified medication list..."
        ];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        await logSystemEvent("SIM_TICK", randomAction, { timestamp: new Date() });
      }
    } catch (err) {
      console.error("Simulation error:", err);
    }
  }, 10000); // Every 10 seconds
}
