-- 15_disaster_alerts.sql
-- Disaster Alert Management & Immutable Audit Trail

CREATE TABLE IF NOT EXISTS public.disaster_alerts (
    alert_id TEXT PRIMARY KEY,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'WEATHER', 'FLOOD', 'CYCLONE', 'EVACUATION',
        'ROAD_BLOCKAGE', 'SHELTER', 'MEDICAL', 'OTHER_AUTHORIZED_ALERT'
    )),
    severity TEXT NOT NULL CHECK (severity IN (
        'RED_CRITICAL', 'ORANGE_WARNING', 'YELLOW_WATCH'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    affected_area TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')),
    source TEXT NOT NULL,
    is_official_govt_source BOOLEAN NOT NULL DEFAULT FALSE,
    source_verification_ref TEXT,
    audit_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.alert_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id TEXT NOT NULL REFERENCES public.disaster_alerts(alert_id),
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_disaster_alerts_status ON public.disaster_alerts(status);
CREATE INDEX IF NOT EXISTS idx_disaster_alerts_severity ON public.disaster_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_disaster_alerts_type ON public.disaster_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alert_audit_logs_alert_id ON public.alert_audit_logs(alert_id);
