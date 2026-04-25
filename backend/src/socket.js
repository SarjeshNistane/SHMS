import { Server } from "socket.io";
import { config } from "./config.js";
import { getActiveEmergencies } from "./services/emergencyService.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: config.clientOrigin
    }
  });

  io.on("connection", async (socket) => {
    const snapshot = await getActiveEmergencies();
    socket.emit("dashboard:snapshot", snapshot);
  });

  return io;
}

export async function broadcastDashboardUpdate() {
  if (!io) return;
  const snapshot = await getActiveEmergencies();
  io.emit("dashboard:update", snapshot);
}

