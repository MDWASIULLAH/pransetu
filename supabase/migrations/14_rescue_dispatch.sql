-- 14_rescue_dispatch.sql
-- Rescue Dispatch Lifecycle & Immutable Audit Trail
--
-- NOTE ON HISTORY: this file previously tried to establish both tables with
-- `CREATE TABLE IF NOT EXISTS`. Both already exist by this point in the sequence
-- (public.rescue_assignments from 04_incidents_resources.sql, and
-- public.resource_audit_logs from 11_resource_management.sql), so those blocks
-- were silent no-ops and the columns they declared were never created — while
-- app/api/resources.py writes to rescue_assignments.updated_at (:463) and
-- resource_audit_logs.assignment_id (:401, :488). ALTER ... ADD COLUMN IF NOT
-- EXISTS is used instead so the columns actually land.

-- 1. Columns the dispatch lifecycle needs on public.rescue_assignments.
--    (dispatch_time / arrival_time / completion_time were added by migration 11;
--     status was converted from the resource_status enum to TEXT there too,
--     which is what makes the lifecycle constraint below possible.)
ALTER TABLE public.rescue_assignments
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill dispatch_time for any pre-existing rows so ORDER BY dispatch_time
-- (resources.py:523) does not sort NULLs to the top of the active-ops list.
UPDATE public.rescue_assignments
   SET dispatch_time = COALESCE(dispatch_time, assigned_at, created_at)
 WHERE dispatch_time IS NULL;

DROP TRIGGER IF EXISTS update_rescue_assignments_modtime ON public.rescue_assignments;
CREATE TRIGGER update_rescue_assignments_modtime
BEFORE UPDATE ON public.rescue_assignments
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 2. Lifecycle Status Constraint
--    Matches valid_statuses in resources.py:448 exactly.
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

-- 3. Link audit rows back to the assignment that caused them.
--    Deliberately NOT a foreign key: the audit trail must survive deletion of
--    the assignment it describes.
ALTER TABLE public.resource_audit_logs
    ADD COLUMN IF NOT EXISTS assignment_id UUID;

CREATE INDEX IF NOT EXISTS idx_resource_audit_logs_res ON public.resource_audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_audit_logs_inc ON public.resource_audit_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_resource_audit_logs_assign ON public.resource_audit_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_rescue_assignments_inc ON public.rescue_assignments(incident_id);
CREATE INDEX IF NOT EXISTS idx_rescue_assignments_status ON public.rescue_assignments(status);
