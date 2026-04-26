🏗️ Project Architecture Overview

🔧 Backend (The Brain)

| File / Folder            | Responsibility                                                              |
| ------------------------ | --------------------------------------------------------------------------- |
| `server.js`              | Bootstrap — initializes everything and starts the server in proper sequence |
| `config.js`              | Stores all environment variables with fallback defaults                     |
| `app.js`                 | Express configuration — CORS, routes, static files, global error handling   |
| `socket.js`              | Socket.IO setup — enables real-time updates across all clients              |
| `constants.js`           | Centralized constants — status labels, priorities, timeline keys            |
| `routes/auth.js`         | Authentication — bcrypt password validation + JWT generation                |
| `routes/emergencies.js`  | Core emergency API — trigger, attend, complete, reset                       |
| `routes/appointments.js` | Appointment booking API — supports public + protected routes                |


⚙️ Backend Services (Core Logic Layer)

| Service                         | Responsibility                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `services/aiEngine.js`          | ⭐ AI scoring engine → calculates emergency priority using weighted formula     |
| `services/emergencyService.js`  | ⭐ Full pipeline controller → manages lifecycle from QUEUED → COMPLETED         |
| `services/resourceService.js`   | Smart allocation logic → assigns beds & doctors using scoring + atomic locking |
| `services/seedService.js`       | Seeds initial data → 15 beds, 10 doctors, 1 admin, 15 patients at startup      |
| `services/simulationService.js` | Simulates activity every 10 seconds → keeps system & logs active 


🌐 Frontend (The Face)

| Page               | User Role |Functionality                          --------------------------------------------------------------------------
| `index.html`       | Public    | Landing page — dynamically loads doctors from API                          |
| `login.html`       | Staff     | Authentication UI — Doctor/Admin toggle with JWT                           |
| `admin.html`       | Admin     | Full SPA dashboard — 8+ modules, real-time updates via Socket.IO           |
| `doctor.html`      | Doctor    | Clinical dashboard — triage queue, EMR, pharmacy, lab tools                |
| `appointment.html` | Patient   | Appointment booking — live doctor list, slot validation, no double-booking |


🌟 Star Feature — AI Emergency Pipeline

| Step                 | Description                                        |
| -------------------- | -------------------------------------------------- |
| 1. Trigger           | Emergency initiated manually or via sensor         |
| 2. AI Evaluation     | Sensor data processed → priority score generated   |
| 3. Dispatch          | Ambulance assigned automatically                   |
| 4. Bed Allocation    | Best-fit hospital bed selected using scoring logic |
| 5. Doctor Assignment | Most suitable doctor assigned dynamically          |
| 6. Live Updates      | All events broadcast via Socket.IO in real-time    |
| 7. Audit Logging     | Full timeline stored in MongoDB for traceability   |

