import { ActionLog } from "../models/ActionLog.js";
import { SystemEvent } from "../models/SystemEvent.js";

export async function logAction(emergencyId, type, status, details = {}) {
  return ActionLog.create({ emergencyId, type, status, details });
}

export async function logSystemEvent(type, message, payload = {}) {
  return SystemEvent.create({ type, message, payload });
}

