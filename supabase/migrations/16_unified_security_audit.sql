-- 16_unified_security_audit.sql
-- Unified Security Audit Logging System

CREATE TABLE IF NOT EXISTS public.unified_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_or_device_metadata JSONB DEFAULT '{}'::jsonb,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexing for rapid audit trail investigation and compliance query
CREATE INDEX IF NOT EXISTS idx_unified_audit_actor ON public.unified_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_unified_audit_action ON public.unified_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_unified_audit_entity ON public.unified_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_unified_audit_ts ON public.unified_audit_logs(timestamp DESC);
