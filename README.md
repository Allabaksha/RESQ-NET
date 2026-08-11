# RESQ-NET — Disaster Management & Emergency Response Network
### SIH260086 · Ministry of Home Affairs · Disaster Management Software

RESQ-NET is a real-time disaster-management coordination platform that registers rescue relief agencies, tracks live operational availability and locations using **MongoDB native 2dsphere geospatial indexing**, processes citizen incident reports with **local AI incident classification (Ollama / Heuristic fallback)**, enforces human officer review before dispatches, and updates all command dashboards in real-time via **Socket.IO**.

---

## Tech Stack
- **Database**: MongoDB Atlas / local MongoDB with native `2dsphere` geospatial indexing (`$near` queries for nearest agency lookup within configurable radius).
- **Backend**: Node.js, Express, Mongoose, Socket.IO, JWT, BcryptJS.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Leaflet.js (OpenStreetMap tiles), Lucide Icons, Socket.IO Client.
- **AI Pipeline**: Ollama API (`llama3` model) for zero-shot disaster classification + automated heuristic NLP fallback.

---

## Quick Start & Setup Instructions

### 1. Backend Setup
```bash
cd server
npm install
npm run seed     # Seeds demo users, agency 2dsphere points & sample disaster incidents
npm start        # Runs Express API & Socket.IO server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Runs Vite React dev server on http://localhost:3000
```

---

## Pre-Seeded Quick Login Credentials
- **Disaster Officer**: `officer@resq.net` / `password123`
- **System Admin**: `admin@resq.net` / `password123`
- **Citizen Reporter**: `citizen@resq.net` / `password123`
- **NDRF Agency Rep**: `agency@resq.net` / `password123`

---

## Core Features Implemented

1. **MongoDB Geospatial Search (`2dsphere` Indexing)**
   - Queries `$near` using spherical geometry for nearest matching available rescue agencies (NDRF, SDRF, Fire & Rescue, Ambulance, Police, Civil Defence, NGO).
2. **AI Incident Analysis & Officer Review**
   - Natural language classification returns incident type, severity (`Critical`, `High`, `Moderate`, `Low`), qualitative victim estimates, and suggested agency resource types.
   - Enforces SIH **Human-in-the-Loop Protocol**: AI suggests, Officer reviews/edits/approves.
3. **Live Command Center Map (Leaflet.js)**
   - Real-time interactive map showing color-coded incident severities and live agency availability markers.
   - Interactive click-to-pin coordinate picker for incident reporting.
4. **Real-Time Synchronization (Socket.IO)**
   - Broadcasts status updates (`Available`, `Busy`, `Unavailable`), location shifts, new incident alerts, and timeline logs across all connected clients instantly.
5. **Role-Based Access Control (RBAC)**
   - `citizen`: Report incidents via interactive map pin.
   - `agency`: Self-report live location & status, accept/reject dispatches.
   - `officer`: Review AI classifications, run geospatial dispatches, assign agencies, update incident timeline.
   - `admin`: Verify agency registrations and manage system configuration.
