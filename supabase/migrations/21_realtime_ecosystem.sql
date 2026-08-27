-- PRANSETU Migration 21: Unified Real-Time Ecosystem & Event Bus
-- Creates the central realtime_events table, auto-triggers, and Supabase Realtime publication

-- 1. Create realtime_events table for central event model
CREATE TABLE IF NOT EXISTS public.realtime_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_version INT NOT NULL DEFAULT 1,
    occurred_at TIMESTAMPTZ NOT NULL,
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT,
    device_id TEXT,
    session_id TEXT,
    sos_id TEXT,
    incident_id TEXT,
    campaign_id TEXT,
    source VARCHAR(50) NOT NULL,
    sequence BIGSERIAL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for high-performance subscriptions and timeline queries
CREATE INDEX IF NOT EXISTS idx_realtime_events_type ON public.realtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_events_sos_id ON public.realtime_events(sos_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_occurred_at ON public.realtime_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_events_sequence ON public.realtime_events(sequence DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON public.realtime_events(created_at DESC);

-- 2. Add Missing Columns to sos_events for Full Cross-Platform Parity
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS "acknowledgedBy" TEXT;
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS "acknowledgedAt" BIGINT;
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS "incidentId" TEXT;
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS "relayTrail" TEXT;
ALTER TABLE public.sos_events ADD COLUMN IF NOT EXISTS "batteryPercent" INT;

-- 3. Automatic Trigger: Emit Realtime Event on SOS Ingestion or State Change
CREATE OR REPLACE FUNCTION fn_emit_sos_realtime_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.realtime_events (
            event_type,
            occurred_at,
            user_id,
            device_id,
            sos_id,
            source,
            payload
        ) VALUES (
            'SOS_BACKEND_RECEIVED',
            NOW(),
            NEW."userEmail",
            NEW."deviceIdentifier",
            NEW."sosId"::text,
            COALESCE(NEW.source, 'android'),
            jsonb_build_object(
                'latitude', NEW.latitude,
                'longitude', NEW.longitude,
                'severity', NEW."severityCode",
                'people_count', NEW."peopleCount",
                'medical_required', NEW."medicalRequired",
                'user_name', NEW."userName",
                'user_phone', NEW."userPhone",
                'message', NEW.message
            )
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD."deliveryState" IS DISTINCT FROM NEW."deliveryState") THEN
            INSERT INTO public.realtime_events (
                event_type,
                occurred_at,
                user_id,
                device_id,
                sos_id,
                source,
                payload
            ) VALUES (
                CASE 
                    WHEN NEW."deliveryState" = 'ACKNOWLEDGED' THEN 'SOS_OPERATOR_ACKNOWLEDGED'
                    WHEN NEW."deliveryState" = 'DISPATCHED' THEN 'SOS_DISPATCHED'
                    WHEN NEW."deliveryState" = 'CLOSED' THEN 'SOS_RESOLVED'
                    ELSE 'SOS_STATUS_CHANGED'
                END,
                NOW(),
                NEW."userEmail",
                NEW."deviceIdentifier",
                NEW."sosId"::text,
                'web_eoc',
                jsonb_build_object(
                    'old_state', OLD."deliveryState",
                    'new_state', NEW."deliveryState",
                    'acknowledged_by', NEW."acknowledgedBy",
                    'acknowledged_at', NEW."acknowledgedAt"
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sos_emit_realtime ON public.sos_events;
CREATE TRIGGER trg_sos_emit_realtime
AFTER INSERT OR UPDATE ON public.sos_events
FOR EACH ROW
EXECUTE FUNCTION fn_emit_sos_realtime_event();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.realtime_events ENABLE ROW LEVEL SECURITY;

-- Allow public insertion from Android client & backend
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'realtime_events' AND policyname = 'Allow public insert realtime_events'
    ) THEN
        CREATE POLICY "Allow public insert realtime_events" ON public.realtime_events FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Allow read access for Realtime listeners
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'realtime_events' AND policyname = 'Allow read realtime_events'
    ) THEN
        CREATE POLICY "Allow read realtime_events" ON public.realtime_events FOR SELECT USING (true);
    END IF;
END $$;

-- 5. Enable Supabase Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.realtime_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_events;
