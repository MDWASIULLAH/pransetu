-- 23_ivr_broadcast.sql
-- Auditable IVR Broadcast extensions using the existing voice campaign tables.

DO $$ BEGIN
    ALTER TYPE voice_call_state ADD VALUE IF NOT EXISTS 'INITIATED';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.voice_campaigns
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS emergency_type TEXT,
ADD COLUMN IF NOT EXISTS emergency_message TEXT,
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'REGISTERED_CITIZENS',
ADD COLUMN IF NOT EXISTS target_area TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'HIGH',
ADD COLUMN IF NOT EXISTS test_mode BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS created_by_role TEXT,
ADD COLUMN IF NOT EXISTS started_by TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recipient_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS retry_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ivr_options JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_campaigns_idempotency_key
ON public.voice_campaigns (idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_campaigns_status
ON public.voice_campaigns (status);

CREATE INDEX IF NOT EXISTS idx_voice_campaigns_created_at
ON public.voice_campaigns (created_at DESC);

ALTER TABLE public.voice_campaign_recipients
ADD COLUMN IF NOT EXISTS citizen_id UUID,
ADD COLUMN IF NOT EXISTS citizen_name TEXT,
ADD COLUMN IF NOT EXISTS masked_phone TEXT,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS provider_call_id TEXT,
ADD COLUMN IF NOT EXISTS call_initiated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ringing_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS final_call_status TEXT,
ADD COLUMN IF NOT EXISTS ivr_response TEXT NOT NULL DEFAULT 'NO_RESPONSE',
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS webhook_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_recipient_campaign_phone
ON public.voice_campaign_recipients (campaign_id, phone_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_recipient_campaign_citizen
ON public.voice_campaign_recipients (campaign_id, citizen_id)
WHERE citizen_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_recipients_ivr_response
ON public.voice_campaign_recipients (ivr_response);

CREATE INDEX IF NOT EXISTS idx_voice_recipients_updated_at
ON public.voice_campaign_recipients (updated_at DESC);

ALTER TABLE public.voice_calls
ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_error TEXT,
ADD COLUMN IF NOT EXISTS webhook_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.ivr_broadcast_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_call_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key TEXT UNIQUE
);

ALTER TABLE public.ivr_broadcast_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated operators read ivr webhook events"
    ON public.ivr_broadcast_webhook_events;

CREATE POLICY "Allow authenticated operators read ivr webhook events"
    ON public.ivr_broadcast_webhook_events
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_ivr_webhook_events_provider_call
ON public.ivr_broadcast_webhook_events (provider_call_id);

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ivr_broadcast_webhook_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
