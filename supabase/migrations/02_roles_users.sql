-- Idempotent enum creation: CREATE TYPE has no IF NOT EXISTS form, so the
-- canonical guard is a DO block that swallows duplicate_object.
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'SUPER_ADMIN',
        'DISASTER_MANAGEMENT_OFFICER',
        'EOC_OPERATOR',
        'RESCUE_COORDINATOR',
        'OBSERVER'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'OBSERVER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON public.users;
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Role Audit Logs
CREATE TABLE IF NOT EXISTS public.role_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id),
    old_role user_role,
    new_role user_role NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to sync user_role into auth.users raw_app_meta_data
CREATE OR REPLACE FUNCTION sync_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if role changes (or on insert)
    IF (TG_OP = 'INSERT') OR (OLD.role IS DISTINCT FROM NEW.role) THEN
        UPDATE auth.users
        SET raw_app_meta_data = 
            COALESCE(raw_app_meta_data, '{}'::jsonb) || json_build_object('role', NEW.role)::jsonb
        WHERE id = NEW.id;
        
        -- Insert into audit log
        INSERT INTO public.role_audit_logs (target_user_id, assigned_by, old_role, new_role)
        VALUES (
            NEW.id,
            NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.role ELSE NULL END,
            NEW.role
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_role_change ON public.users;
CREATE TRIGGER on_user_role_change
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE sync_role_to_jwt();
