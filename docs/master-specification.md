# PRANSETU MASTER SPECIFICATION

## Project Identity
PRANSETU is a disaster-management and emergency-response platform designed initially for Odisha and scalable across all of India. It is a complete disaster communication, emergency response, intelligence, coordination, and public-safety ecosystem.

## Core Vision
A person should be able to trigger an emergency SOS even when their phone has no cellular or internet connectivity. The SOS is transferred from one device to another using peer-to-peer technologies (Bluetooth LE, Wi-Fi Direct, Nearby Connections, LoRa Mesh).
This is a **STORE-AND-FORWARD / MULTI-HOP** emergency communication system.

## Key Subsystems
1. **Android Citizen App**: Offline SOS persistence, hold-to-activate trigger, store-and-forward multi-hop mesh, multilingual UX (English, Odia, Hindi).
2. **Backend & Ingestion Gateway**: FastAPI, Supabase / PostGIS, idempotent packet deduplication, cryptographic acknowledgements.
3. **24/7 Web Command Center (PRANSETU S)**: Live tactical GIS map, automated AI triage & priority engine, IVR voice campaign broadcast, shelter & fleet logistics, global weather telemetry.
4. **AI & PRANSETU Intelligence**: Hydrodynamic Digital Elevation Model (DEM) routing, Disaster Domino Effect cascading risk modelling, situation summaries.
5. **Security & Privacy**: Zero API keys in source code, least-privilege access, data minimization, cryptographic message integrity.
