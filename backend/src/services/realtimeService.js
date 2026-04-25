let broadcastHandler = async () => {};

export function registerBroadcaster(handler) {
  broadcastHandler = handler;
}

export async function notifyDashboardUpdate() {
  await broadcastHandler();
}

