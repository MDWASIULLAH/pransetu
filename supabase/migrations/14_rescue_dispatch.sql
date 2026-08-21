-- 14_rescue_dispatch.sql
-- Rescue Dispatch Lifecycle & Immutable Audit Trail

-- 1. Ensure Table Structure for Rescue Assignments
CREATE TABLE IF NOT EXISTS public.rescue_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id TEXT NOT NULL,
    resource_id TEXT NOT NULL REFERENCES public.resources(id),
    assigned_by UUID,
    status TEXT NOT NULL DEFAULT 'DISPATCHED',
    dispatch_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    arrival_time TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Lifecycle Status Constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_assignment_lifecycle_status'
    ) THEN
        ALTER TABLE public.rescue_assignments
        ADD CONSTRAINT chk_assignment_lifecycle_status
        CHECK (status IN ('DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESCUING', 'COMPLETED', 'CANCELLED'));
    END IF;
END $$;

-- 3. Comprehensive Audit Trail Table
CREATE TABLE IF NOT EXISTS public.resource_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id TEXT NOT NULL,
    incident_id TEXT,
    assignment_id UUID,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_resource_audit_logs_res ON public.resource_audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_audit_logs_inc ON public.resource_audit_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_rescue_assignments_inc ON public.rescue_assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_rescue_assignments_status ON public.rescue_assignments(status);
