import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { emergencyRouter } from "./routes/emergencies.js";
import { aiRouter } from "./routes/ai.js";
import { resourceRouter } from "./routes/resources.js";
import { authRouter } from "./routes/auth.js";
import { appointmentRouter } from "./routes/appointments.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
  });

  app.use("/emergencies", emergencyRouter);
  app.use("/ai", aiRouter);
  app.use("/resources", resourceRouter);
  app.use("/auth", authRouter);
  app.use("/appointments", appointmentRouter);

  // Serve static frontend
  app.use(express.static("../frontend"));

  // Global error handler
  app.use((error, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url} - ${error.message}`);
    console.error(error.stack);
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    });
  });

  return app;
}

