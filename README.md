# AI Smart Hospital System

Light-themed MERN + Socket.IO hackathon MVP focused on one primary flow:

`Accident Trigger -> AI Decision -> Ambulance Dispatch -> Bed Allocation -> Doctor Assignment -> Live Dashboard Update`

## Structure

- `backend/` Express + Socket.IO + MongoDB backend
- `frontend/` Vanilla JS + HTML static dashboard
- `backend/src/scripts/` Seed and backup demo utilities

## Quick start

1. Install dependencies:
   - `npm run install:all`
2. Copy `backend/.env.example` to `backend/.env` and update values if needed.
3. Start local MongoDB:
   - `npm run mongo:local`
4. Start system:
   - `npm run dev`

## Demo helpers

- Seed demo data on backend startup
- Manual complete-pipeline endpoint
- Instant demo script:
  - `npm run demo:instant`
- Backup demo script:
  - `npm run demo:backup`

## Local MongoDB helpers

- Start local MongoDB:
  - `npm run mongo:local`
- Check local MongoDB status:
  - `npm run mongo:status`
- Stop local MongoDB:
  - `npm run mongo:stop`

The helper stores MongoDB files inside `backend/.mongodb-data/` and writes logs to `backend/mongodb.log`.
If `mongod.exe` is not globally installed, the project can also use a local ZIP-based MongoDB binary extracted under `backend/.mongodb-bin/`.
