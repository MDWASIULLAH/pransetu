-- 18_schema_repair.sql
--
-- Repairs three defects where the application code writes or reads a column the
-- schema never created, plus one function left broken by an earlier rename, plus
-- four tables that were never placed under row-level security.
--
-- Every item below was confirmed by reading both the migration that should have
-- created it and the line of application code that depends on it. Re-runnable.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. public.resources.notes
--
--    register_resource (app/api/resources.py:77) puts a "notes" key in the
--    insert payload. public.resources has no such column: the four `notes`
--    columns in the migration history belong to sos_events (03), rescue_assignments
--    (04), resource_audit_logs (11) and disaster_alerts (15) — none to resources.
--    PostgREST rejects the whole insert with PGRST204, so resource registration
--    fails outright rather than partially.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.resources
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. public.sos_events.escalated_by
--
--    escalate_sos (app/api/sos.py:122) writes escalated_by. The column appears in
--    no migration. Same failure mode as above: the escalation update is rejected.
--
--    Not a foreign key to public.users. Escalation must remain recorded even if
--    the operator profile is later removed, and the audit trail is the record of
--    record either way.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.sos_events
    ADD COLUMN IF NOT EXISTS escalated_by UUID,
    ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS sos_events_escalated_idx
    ON public.sos_events (escalated_at) WHERE escalated_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. get_incident_priority_context() references a column that no longer exists
--
--    10_priority_rpc.sql:38 filters on `(s.capacity - s.occupied) > 0`, but
--    13_shelter_management.sql:17 renamed shelters.occupied to current_occupancy.
--    The function body is only parsed when it runs, so this is not a migration
--    error — it is a runtime `column s.occupied does not exist` on every call to
--    the priority RPC.
--
--    Recreated verbatim apart from that predicate.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_incident_priority_context(p_incident_id TEXT)
RETURNS TABLE (
    medical_count INTEGER,
    critical_count INTEGER,
    affected_people INTEGER,
    sos_count INTEGER,
    latest_activity TIMESTAMPTZ,
    nearest_resource_km FLOAT,
    nearest_shelter_km FLOAT
) AS $$
DECLARE
    inc_loc geometry(Point, 4326);
BEGIN
    -- Fetch the incident location
    SELECT location INTO inc_loc
    FROM public.incidents
    WHERE id = p_incident_id;

    RETURN QUERY
    SELECT
        i.medical_count,
        i.critical_count,
        i.affected_people,
        i.sos_count,
        i.latest_activity,
        (
            -- NOTE: this counts any AVAILABLE resource regardless of
            -- verification_status. Restricting it to VERIFIED is part of the
            -- resource-verification work, not this repair, because it changes
            -- returned values rather than fixing an error.
            SELECT (ST_Distance(r.location::geography, inc_loc::geography) / 1000.0)::FLOAT
            FROM public.resources r
            WHERE r.status = 'AVAILABLE'
            ORDER BY r.location <-> inc_loc
            LIMIT 1
        ) as nearest_resource_km,
        (
            SELECT (ST_Distance(s.location::geography, inc_loc::geography) / 1000.0)::FLOAT
            FROM public.shelters s
            WHERE s.status = 'OPERATIONAL' AND (s.capacity - s.current_occupancy) > 0
            ORDER BY s.location <-> inc_loc
            LIMIT 1
        ) as nearest_shelter_km
    FROM public.incidents i
    WHERE i.id = p_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row-level security on the four tables that never got it
--
--    07_rls_policies.sql enabled RLS on 12 tables. Four more have been added
--    since and were missed — and they are the audit and alert tables, i.e. the
--    ones holding the accountability record and the citizen-facing alert history.
--    Without RLS, anyone holding the anon key can read them directly.
--
--    RLS enabled with no permissive policy denies every anon and authenticated
--    request. The backend reaches these tables with the service_role key, which
--    bypasses RLS by design — that is the intended access path: audit data is
--    read through an authorized API endpoint, never straight from the client.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.resource_audit_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disaster_alerts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_audit_logs   ENABLE ROW LEVEL SECURITY;

-- Live alerts are the one genuinely public read here: a citizen-facing alert feed
-- has no reason to require a session. disaster_alerts.status is constrained to
-- ACTIVE | CANCELLED | EXPIRED (15_disaster_alerts.sql:19) and every row is
-- created ACTIVE, so the filter is status plus a live-window check — a cancelled
-- or lapsed alert must not keep being served as current guidance.
DROP POLICY IF EXISTS "Allow public read of active alerts" ON public.disaster_alerts;
CREATE POLICY "Allow public read of active alerts"
ON public.disaster_alerts FOR SELECT
USING (status = 'ACTIVE' AND expires_at > NOW());
