# PRANSETU Implementation Roadmap

## Phase 0 - Foundation
- Repository rules & architecture
- Documentation & canonical protocol schemas
- Localization architecture (English, Odia, Hindi)
- CI/CD baseline & Vercel deployment

## Phase 1 - Android Foundation
- Kotlin/Compose app
- Navigation & Material 3 theme
- English/Odia/Hindi localization
- Home/SOS UI & diagnostics

## Phase 2 - Real Location
- Granular permissions
- Current GPS location vs last-known location
- Timestamp & accuracy telemetry metadata

## Phase 3 - Offline SOS Engine
- Room database local persistence
- Canonical SOS packet model
- Local store-and-forward queue
- Lifecycle state machine & process restart recovery

## Phase 4 - Online Synchronization
- FastAPI backend & Supabase / PostGIS
- Authenticated government API
- Idempotent packet ingestion & acknowledgements

## Phase 5 - Nearby Relay
- BLE & Wi-Fi Direct peer discovery
- A -> B packet transfer
- Deduplication by `sos_id`
- TTL / hop limit enforcement & local ack

## Phase 6 - Multi-hop Gateway
- Multi-hop chain (A -> B -> C -> Gateway)
- Internet synchronization upon connectivity return
- Partition recovery & bounded retries

## Phase 7 - Voice/IVR
- Telephony API integration (Twilio / Exotel / Asterisk)
- Multilingual IVR broadcast (English, Odia, Hindi)
- DTMF keypress response triage (Safe, Need Aid, Medical Critical)
- Secure webhook ingestion & EOC real-time updates

## Phase 8 - EOC Web Command Center
- 24/7 Web Command Center (PRANSETU S)
- Live interactive GIS topography & flood inundation polygons
- Incident triage & automated AI priority scoring
- Shelters, inventory fleet & resource dispatching
- Global atmospheric weather & cyclone telemetry

## Phase 9 - PRANSETU Intelligence
- Hydrodynamic Digital Elevation Model (DEM) AI routing
- Incident classification & clustering
- Multi-hazard cascading risk (Disaster Domino Effect)
- Real-time operational situation summaries

## Phase 10 - Odisha to Pan-India
- Scalable multi-state disaster profiles
- Integration with NDMA & SDMA national protocols
- Expanded regional language support
