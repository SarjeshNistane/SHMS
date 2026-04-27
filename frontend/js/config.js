/**
 * Smart Health Management System - Frontend Configuration
 * 
 * Logic to automatically determine the API URL:
 * 1. If running locally (localhost), use the local backend.
 * 2. If running on the cloud (Vercel), use the Render production backend.
 */

window.SHMS_CONFIG = {
  apiUrl: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname)
    ? "http://localhost:4000"
    : "https://shms-29iy.onrender.com"
};

console.log("SHMS API Base configured as:", window.SHMS_CONFIG.apiUrl);
