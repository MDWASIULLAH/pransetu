-- 11_resource_management.sql

-- 1. Convert Enum columns to TEXT for polymorphic flexibility
ALTER TABLE public.resources
ALTER COLUMN type TYPE TEXT USING type::text,
ALTER COLUMN status TYPE TEXT USING status::text;

ALTER TABLE public.rescue_assignments
ALTER COLUMN status TYPE TEXT USING status::text;

-- 2. Expand Resources Table for Polymorphism and Multi-Capacity
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS contact_reference TEXT,
ADD COLUMN IF NOT EXISTS is_multi_capacity BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- 3. Enhance Assignments for strict tracking
ALTER TABLE public.rescue_assignments
ADD COLUMN IF NOT EXISTS dispatch_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_time TIMESTAMPTZ;

-- 4. Create Audit Trail for strict dispatch tracking
CREATE TABLE IF NOT EXISTS public.resource_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id TEXT NOT NULL REFERENCES public.resources(id),
    incident_id TEXT REFERENCES public.incidents(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX resource_audit_logs_resource_id_idx ON public.resource_audit_logs(resource_id);

-- Optional: Clean up old enums if they aren't used elsewhere
-- DROP TYPE IF EXISTS resource_type CASCADE;
-- DROP TYPE IF EXISTS resource_status CASCADE;
