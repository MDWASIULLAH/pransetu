-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disaster_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;

-- Base Policies using custom JWT claims
CREATE POLICY "Allow users to read their own profile"
ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow SUPER_ADMIN to read all users"
ON public.users FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN');

CREATE POLICY "Allow read SOS events for authorized roles"
ON public.sos_events FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'OBSERVER'));

CREATE POLICY "Allow read incidents for authorized roles"
ON public.incidents FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'RESCUE_COORDINATOR', 'OBSERVER'));

CREATE POLICY "Allow read resources for authorized roles"
ON public.resources FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'RESCUE_COORDINATOR'));

CREATE POLICY "Allow read shelters for authorized roles"
ON public.shelters FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'RESCUE_COORDINATOR'));

-- Service Role (FastAPI Backend) bypasses RLS automatically by design in Supabase.
