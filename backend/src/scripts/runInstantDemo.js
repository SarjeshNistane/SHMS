import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { seedDemoData } from "../services/seedService.js";
import { forceCompleteEmergency } from "../services/emergencyService.js";

try {
  await connectDatabase();
  await seedDemoData();
  const emergency = await forceCompleteEmergency({
    deviceId: `backup-demo-${Date.now()}`
  });
  console.log(`Instant demo triggered for emergency ${emergency._id}`);
} finally {
  await mongoose.disconnect();
}

