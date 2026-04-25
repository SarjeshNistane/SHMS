import mongoose from "mongoose";
import { connectDatabase } from "../db.js";
import { seedDemoData } from "../services/seedService.js";

try {
  await connectDatabase();
  await seedDemoData();
  console.log("Demo data seeded.");
} finally {
  await mongoose.disconnect();
}

