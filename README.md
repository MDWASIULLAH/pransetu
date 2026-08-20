# PRANSETU S - Web EOC (Emergency Operations Center)

**PRANSETU S** is a next-generation, offline-first Disaster Emergency Operations Center (EOC) platform designed for real-time disaster coordination, automated citizen check-ins, multi-hop LoRa mesh telemetry, GIS flood hazard monitoring, and tactical resource management.

---

## 🌟 Key Features

### 1. 🗺️ Real-Time Interactive GIS Mission Map
- **Dual Basemaps**: Instant switching between **Tactical Dark Matter** and **Esri High-Resolution Satellite GIS**.
- **Live Vector Layers**: Coastal flood surge polygons, evacuation corridors (NH-316 & Marine Drive), cyclone shelters, and active rescue units.
- **Pulsating SOS Distress Beacons**: Real-time triage with click-to-deploy incident popups.
- **Continuous Live GPS Tracker HUD**: Live cursor and incident coordinate telemetry.

### 2. 🚨 AI Priority Engine & SOS Audit Stream
- Automated distress signal prioritization based on victim counts, medical urgency, water level depth, and hop latency.
- Multi-channel ingestion (Android App, Offline LoRa Mesh, IVR Telephony, Direct VHF Radio).
- Multi-hop packet routing inspection with SNR and signal strength audit logs.
- One-click CSV audit trail export.

### 3. 📞 Automated Voice Campaigns & IVR Citizen Check-In
- Priority IVR broadcasting to coastal districts (Puri, Ganjam, Balasore, Cuttack).
- Real-time DTMF keypad response collection:
  - `Press 1`: Confirmed Safe.
  - `Press 2`: Logistical Aid Needed (Food / Water).
  - `Press 3`: **Critical Medical Emergency** (immediately injects emergency beacon to command map).
- Live campaign controls: Launch, Pause, Resume, Abort.

### 4. 🏥 Shelter Network & Fleet Logistics
- Real-time tracking of 42 cyclone shelters across coastal Odisha.
- Dynamic medical tier categorization, drinking water reserves, and emergency generator telemetry.
- Resource dispatch modal for Inflatable Rescue Boats (IRBs), ALS Ambulances, and 5000L Water Tankers.

### 5. 📢 Statewide Siren & Emergency Broadcast System
- Multi-severity state alerts (`RED CRITICAL`, `ORANGE WARNING`, `YELLOW WATCH`).
- Real-time tactical Web Audio siren pings and synchronized emergency banner.

### 6. 🛡️ Support, Diagnostics & Operational SOPs
- 24x7 emergency contacts directory (OSDMA, NDRF, ODRAF, Indian Coast Guard, IMD).
- Live hardware telemetry for coastal LoRa repeater nodes (ping latency, battery %, SNR).
- Field incident support ticketing system.
- Standard Operating Procedure (SOP) playbooks.

---

## 🛠️ Technology Stack

- **Framework**: React 19, TypeScript, Vite
- **Mapping & GIS**: Leaflet, React-Leaflet, CartoDB, Esri World Imagery
- **Audio Engine**: Web Audio API Tactical Synthesizer
- **Styling**: Tailwind CSS v4, Material Symbols, JetBrains Mono
- **Deployment**: Vercel & GitHub Actions

---

## 🚀 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/MDWASIULLAH/pransetu.git
cd pransetu

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

---

## 📜 License
Developed for Smart India Hackathon (SIH 2026) Disaster Management Initiative.
