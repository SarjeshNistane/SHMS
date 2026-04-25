/**
 * SHMS_API - Centralized API handler for Smart Health Management System
 */
const SHMS_API_BASE = window.location.protocol === 'file:' ? "http://localhost:4000" : window.location.origin;

window.SHMS_API = {
  // Authentication
  async login(role, name, password) {
    const res = await fetch(`${SHMS_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, name, password })
    });
    return await res.json();
  },

  // Dashboard & Emergencies
  async getDashboardState() {
    const res = await fetch(`${SHMS_API_BASE}/emergencies/active`);
    return await res.json();
  },

  async triggerEmergency(payload) {
    const res = await fetch(`${SHMS_API_BASE}/emergencies/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async attendEmergency(id) {
    const res = await fetch(`${SHMS_API_BASE}/emergencies/${id}/attend`, {
      method: "POST",
      headers: this._getAuthHeaders()
    });
    return await res.json();
  },

  async completeEmergency(id) {
    const res = await fetch(`${SHMS_API_BASE}/emergencies/${id}/complete`, {
      method: "POST",
      headers: this._getAuthHeaders()
    });
    return await res.json();
  },

  // Resources
  async getDoctors() {
    const res = await fetch(`${SHMS_API_BASE}/resources/doctors`);
    return await res.json();
  },

  async getBeds() {
    const res = await fetch(`${SHMS_API_BASE}/resources/beds`);
    return await res.json();
  },

  async getPatients() {
    const res = await fetch(`${SHMS_API_BASE}/emergencies/patients`);
    return await res.json();
  },

  // Appointments
  async getPublicAppointments() {
    const res = await fetch(`${SHMS_API_BASE}/appointments/public`);
    return await res.json();
  },

  async bookAppointment(payload) {
    const res = await fetch(`${SHMS_API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // Helper for Auth Headers
  _getAuthHeaders() {
    const token = localStorage.getItem('jwt_token');
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` })
    };
  }
};

/**
 * setupRealtime - Connects to Socket.io and listens for updates
 * @param {Function} callback - Function to run on data update
 */
window.setupRealtime = function(callback) {
  if (typeof io === 'undefined') {
    console.warn("Socket.io not loaded yet, retrying in 500ms...");
    setTimeout(() => setupRealtime(callback), 500);
    return;
  }
  
  const socket = io(SHMS_API_BASE);
  
  socket.on("connect", () => {
    console.log("Connected to SHMS Realtime Engine");
  });

  socket.on("dashboard:snapshot", (data) => {
    console.log("Initial snapshot received", data);
    callback(data);
  });

  socket.on("dashboard:update", (data) => {
    console.log("Realtime update received", data);
    callback(data);
  });

  return socket;
};
