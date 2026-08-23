DO $$ BEGIN
    CREATE TYPE sos_severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE delivery_state AS ENUM ('CREATED', 'STORED', 'RELAYING', 'RELAYED', 'GATEWAY_RECEIVED', 'SERVER_DELIVERED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE sos_source AS ENUM ('ANDROID', 'IVR', 'EXTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sos_events (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    source sos_source NOT NULL,
    location geometry(Point, 4326) NOT NULL,
    accuracy_m FLOAT,
    location_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    people_count INTEGER NOT NULL DEFAULT 1,
    medical_required BOOLEAN NOT NULL DEFAULT FALSE,
    severity sos_severity NOT NULL DEFAULT 'MEDIUM',
    hop_count INTEGER NOT NULL DEFAULT 0,
    ttl INTEGER,
    delivery_state delivery_state NOT NULL DEFAULT 'SERVER_DELIVERED',
    incident_id TEXT,
    relay_trail TEXT[],
    acknowledged_by UUID REFERENCES public.users(id),
    notes TEXT,
    citizen_phone TEXT,
    
    -- Ensure idempotency for identical distress packets from the same device at the same time
    CONSTRAINT uq_sos_idempotency UNIQUE(device_id, source, location_timestamp)
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS sos_events_location_idx ON public.sos_events USING GIST (location);
CREATE INDEX IF NOT EXISTS sos_events_created_at_idx ON public.sos_events(created_at);
