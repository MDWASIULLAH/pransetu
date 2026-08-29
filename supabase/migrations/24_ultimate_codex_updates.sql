-- PRANSETU Ultimate Master Codex (Phases 26-50)
-- Schema modifications for strict simulation isolation and AI explainability.

-- 1. Simulation Flags for Strict Isolation (Phase 35, 37, 39, 40)
ALTER TABLE public.sos_events 
    ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.incidents 
    ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Deduplication and AI Explainability (Phase 30)
-- duplicate_status can be: 'UNIQUE', 'PROBABLE_DUPLICATE', 'CONFIRMED_DUPLICATE'
ALTER TABLE public.sos_events 
    ADD COLUMN IF NOT EXISTS duplicate_status VARCHAR(50) NOT NULL DEFAULT 'UNIQUE',
    ADD COLUMN IF NOT EXISTS ai_explanation JSONB DEFAULT '{}'::jsonb;

-- 3. Incident Lifecycle Tracking (Phase 26)
-- Update incident_status enum if needed (it already has ACTIVE, RESCUE_DISPATCHED, RESOLVED)
-- Add a closure or threshold event flag
ALTER TABLE public.incidents 
    ADD COLUMN IF NOT EXISTS threshold_reached BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. Weather Storage for Auditing (Phase 28, Phase 29)
-- We store the weather conditions validated at the time the incident was clustered
ALTER TABLE public.incidents 
    ADD COLUMN IF NOT EXISTS verified_weather JSONB;

-- 5. Indexes for fast simulation filtering (Phase 41)
CREATE INDEX IF NOT EXISTS sos_events_simulated_idx ON public.sos_events(is_simulated);
CREATE INDEX IF NOT EXISTS incidents_simulated_idx ON public.incidents(is_simulated);
