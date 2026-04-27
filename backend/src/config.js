import dotenv from "dotenv";

dotenv.config();

// Support multiple allowed origins via comma-separated CLIENT_ORIGIN env var.
// e.g. CLIENT_ORIGIN="https://shms.vercel.app,http://localhost:4000"
const rawOrigins = process.env.CLIENT_ORIGIN || "https://shms-delta.vercel.app,https://shms-n6hbqoqcr-sarjeshnistanes-projects.vercel.app,http://localhost:4000,http://localhost:5173";
export const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

const rawUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-smart-hospital";
export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: allowedOrigins,
  mongoUri: rawUri.trim().replace(/^['"]|['"]$/g, ""), // Remove any quotes or spaces
  averageTreatmentTime: Number(process.env.AVERAGE_TREATMENT_TIME || 15),
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 500),
  deviceDedupWindowMs: Number(process.env.DEVICE_DEDUP_WINDOW_MS || 5000)
};
