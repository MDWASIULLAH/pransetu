-- PRANSETU Ultimate Master Codex (Anti-Abuse & Fraud Prevention)
-- Schema modifications for idempotency, cancellation, and risk scoring.

-- 1. Remove naive idempotency constraint that drops duplicated signals silently.
ALTER TABLE public.sos_events DROP CONSTRAINT IF EXISTS uq_sos_idempotency;

-- 2. Add client_incident_id to link multiple rapid SOS events to the same logical session
ALTER TABLE public.sos_events 
    ADD COLUMN IF NOT EXISTS client_incident_id TEXT,
    ADD COLUMN IF NOT EXISTS is_cancellation BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0;

-- 3. Index for quickly querying events belonging to the same client incident session
CREATE INDEX IF NOT EXISTS sos_events_client_incident_idx ON public.sos_events(client_incident_id);
