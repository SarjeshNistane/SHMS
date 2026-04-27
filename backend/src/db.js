import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDatabase() {
  try {
    mongoose.set("strictQuery", true);
    mongoose.set("bufferCommands", true); // Ensure queries buffer while connecting
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("CRITICAL: MongoDB Connection Failed!");
    console.error(error.message);
    if (config.mongoUri.includes("127.0.0.1") || config.mongoUri.includes("localhost")) {
      console.warn("HINT: You are trying to connect to a local database in a cloud environment. Make sure MONGODB_URI is set in your environment variables.");
    }
    // Don't rethrow, let the server start so we can see health status
  }
}
