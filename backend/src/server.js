import http from "http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import { initSocket } from "./socket.js";
import { seedDemoData } from "./services/seedService.js";
import { broadcastDashboardUpdate } from "./socket.js";
import { registerBroadcaster } from "./services/realtimeService.js";
import { startSimulation } from "./services/simulationService.js";

const app = createApp();
const server = http.createServer(app);
initSocket(server);

async function start() {
  await connectDatabase();
  await seedDemoData();
  registerBroadcaster(broadcastDashboardUpdate);
  startSimulation();

  server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start().catch(async (error) => {
  console.error("Failed to start server", error);
  await mongoose.disconnect();
  process.exit(1);
});
