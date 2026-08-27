-- Supabase PostgreSQL Schema for PRANSETU Voice Response System
-- Migration 20

DO $$ BEGIN
    CREATE TYPE voice_call_state AS ENUM (
        'QUEUED', 'INITIATING', 'RINGING', 'ANSWERED', 'LANGUAGE_SELECTED',
        'IN_PROGRESS', 'WAITING_FOR_RESPONSE', 'PROCESSING_RESPONSE',
        'FOLLOW_UP_REQUIRED', 'ASSESSMENT_COMPLETE', 'ESCALATION_REQUIRED',
        'COMPLETED', 'NO_ANSWER', 'BUSY', 'FAILED', 'CALL_DROPPED',
        'RETRYING', 'UNREACHABLE', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE voice_severity AS ENUM (
        'SAFE', 'NEEDS_ASSISTANCE', 'URGENT', 'CRITICAL', 'UNABLE_TO_CONFIRM_SAFETY'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE voice_campaign_mode AS ENUM (
        'NORMAL', 'DISASTER_ACTIVE', 'CRITICAL_RESPONSE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update existing voice_campaigns to support the new features
ALTER TABLE public.voice_campaigns 
ADD COLUMN IF NOT EXISTS mode voice_campaign_mode NOT NULL DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS disaster_event_id TEXT,
ADD COLUMN IF NOT EXISTS geometry_target geometry(Polygon, 4326),
ADD COLUMN IF NOT EXISTS target_radius_m FLOAT,
ADD COLUMN IF NOT EXISTS language_distribution JSONB DEFAULT '{}'::jsonb;

-- Campaign Recipients
CREATE TABLE IF NOT EXISTS public.voice_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id TEXT NOT NULL REFERENCES public.voice_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    phone_number TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    status voice_call_state NOT NULL DEFAULT 'QUEUED',
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_recipients_campaign ON public.voice_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_voice_recipients_status ON public.voice_campaign_recipients(status);

-- Calls
CREATE TABLE IF NOT EXISTS public.voice_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.voice_campaign_recipients(id) ON DELETE CASCADE,
    provider_call_id TEXT UNIQUE,
    language_used TEXT NOT NULL,
    fallback_used TEXT,
    current_state voice_call_state NOT NULL DEFAULT 'INITIATING',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON public.voice_calls(provider_call_id);

-- Call Events
CREATE TABLE IF NOT EXISTS public.voice_call_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES public.voice_calls(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_events_call ON public.voice_call_events(call_id);

-- Language Capabilities Matrix
CREATE TABLE IF NOT EXISTS public.voice_language_capabilities (
    language_code TEXT PRIMARY KEY,
    has_tts BOOLEAN NOT NULL DEFAULT FALSE,
    has_stt BOOLEAN NOT NULL DEFAULT FALSE,
    has_live_voice BOOLEAN NOT NULL DEFAULT FALSE,
    provider TEXT NOT NULL,
    voice_model TEXT,
    fallback_mode TEXT NOT NULL DEFAULT 'DTMF_ONLY',
    quality_status TEXT NOT NULL DEFAULT 'TESTING'
);

-- Voice Dialogue Nodes
CREATE TABLE IF NOT EXISTS public.voice_dialogue_nodes (
    id TEXT PRIMARY KEY,
    description TEXT,
    prompt_text JSONB NOT NULL, -- localized prompts
    expected_intents TEXT[],
    response_modes TEXT[] NOT NULL DEFAULT ARRAY['DTMF', 'SPEECH'],
    next_node_map JSONB NOT NULL, -- mapping intent to next node id
    timeout_seconds INTEGER NOT NULL DEFAULT 10
);

-- Assessments (Structured NLP Extraction)
CREATE TABLE IF NOT EXISTS public.voice_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES public.voice_calls(id) ON DELETE CASCADE,
    severity voice_severity NOT NULL DEFAULT 'UNABLE_TO_CONFIRM_SAFETY',
    extracted_entities JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_score FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalations
CREATE TABLE IF NOT EXISTS public.voice_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.voice_assessments(id) ON DELETE CASCADE,
    sos_id TEXT REFERENCES public.sos_events(id),
    rule_fired TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.voice_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_language_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_dialogue_nodes ENABLE ROW LEVEL SECURITY;

-- Operator access only (simplified policy example for auth roles)
CREATE POLICY "Allow authenticated operators read" ON public.voice_campaign_recipients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated operators all" ON public.voice_calls FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated operators all" ON public.voice_call_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated operators all" ON public.voice_assessments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated operators all" ON public.voice_escalations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow public read capabilities" ON public.voice_language_capabilities FOR SELECT USING (true);
CREATE POLICY "Allow public read dialogue" ON public.voice_dialogue_nodes FOR SELECT USING (true);

-- Enable Supabase realtime for live dashboard tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_call_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_campaign_recipients;

-- Attach triggers for Audit Trail
DROP TRIGGER IF EXISTS audit_voice_assessments ON public.voice_assessments;
CREATE TRIGGER audit_voice_assessments
AFTER INSERT OR UPDATE OR DELETE ON public.voice_assessments
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_func();

DROP TRIGGER IF EXISTS audit_voice_escalations ON public.voice_escalations;
CREATE TRIGGER audit_voice_escalations
AFTER INSERT OR UPDATE OR DELETE ON public.voice_escalations
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_func();
