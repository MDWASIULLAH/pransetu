CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES public.users(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id::text, TG_OP, row_to_json(OLD)::jsonb, current_setting('request.jwt.claim.sub', true)::uuid);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, current_setting('request.jwt.claim.sub', true)::uuid);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id::text, TG_OP, row_to_json(NEW)::jsonb, current_setting('request.jwt.claim.sub', true)::uuid);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to critical tables
DROP TRIGGER IF EXISTS audit_sos_events ON public.sos_events;
CREATE TRIGGER audit_sos_events
AFTER INSERT OR UPDATE OR DELETE ON public.sos_events
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_func();

DROP TRIGGER IF EXISTS audit_incidents ON public.incidents;
CREATE TRIGGER audit_incidents
AFTER INSERT OR UPDATE OR DELETE ON public.incidents
FOR EACH ROW EXECUTE PROCEDURE audit_trigger_func();
