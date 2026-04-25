import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { seedDemoData } from "../services/seedService.js";
import { forceCompleteEmergency } from "../services/emergencyService.js";

async function run() {
  await connectDatabase();
  await seedDemoData();
  const emergency = await forceCompleteEmergency({
    deviceId: `backup-script-${Date.now()}`
  });
  console.log(`Backup demo triggered for emergency ${emergency._id}`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

