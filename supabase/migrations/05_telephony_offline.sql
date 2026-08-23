DO $$ BEGIN
    CREATE TYPE safe_verify_state AS ENUM ('SAFE', 'ASSISTANCE', 'TRAPPED', 'MEDICAL', 'UNACCOUNTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.voice_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_districts TEXT[],
    status TEXT NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_calls INTEGER NOT NULL DEFAULT 0,
    safe_count INTEGER NOT NULL DEFAULT 0,
    assistance_count INTEGER NOT NULL DEFAULT 0,
    medical_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.safety_records (
    id TEXT PRIMARY KEY,
    citizen_phone TEXT NOT NULL,
    campaign_id TEXT NOT NULL REFERENCES public.voice_campaigns(id),
    state safe_verify_state NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    call_id TEXT NOT NULL,
    district TEXT
);

CREATE TABLE IF NOT EXISTS public.relay_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_id TEXT NOT NULL REFERENCES public.sos_events(id),
    node_id TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snr FLOAT,
    rssi FLOAT,
    battery_level FLOAT
);
CREATE INDEX IF NOT EXISTS relay_events_sos_idx ON public.relay_events(sos_id);
