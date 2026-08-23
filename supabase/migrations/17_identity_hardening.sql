-- 17_identity_hardening.sql
--
-- Establishes the real operator profile model, the account-status lifecycle, and
-- server-side session tracking that authentication and RBAC depend on.
--
-- Before this migration public.users held six columns (id, name, email, role,
-- created_at, updated_at) — no status, no badge, no lockout state, no session
-- record — so there was nothing for a login to check and nothing to revoke.
--
-- Everything here is additive and re-runnable. `name` is deliberately NOT
-- renamed to full_name: six call sites already read `name`. full_name is added
-- as a generated mirror instead, so both spellings resolve to one value.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Account status lifecycle
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'LOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE access_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUESTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Decouple the profile primary key from the identity provider
--
--    public.users.id was `REFERENCES auth.users(id)`, which made the profile PK
--    the Supabase Auth user id. Two problems: a profile could not exist before
--    an auth user did (so PENDING access requests and offline seeding were
--    impossible), and re-provisioning an auth account would cascade-delete the
--    profile — taking every accountability reference with it
--    (resources.verified_by, rescue_assignments.assigned_by,
--    resource_audit_logs.changed_by, sos_events.acknowledged_by).
--
--    The link becomes an explicit nullable auth_user_id instead. `id` stays the
--    primary key, so every existing foreign key keeps working untouched.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    SELECT conname INTO v_constraint_name
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public'
       AND t.relname = 'users'
       AND c.contype = 'f'
       AND pg_get_constraintdef(c.oid) LIKE '%auth.users(id)%'
     LIMIT 1;

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', v_constraint_name);
    END IF;
END $$;

ALTER TABLE public.users
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_user_id          UUID,
    ADD COLUMN IF NOT EXISTS username              TEXT,
    ADD COLUMN IF NOT EXISTS badge_id              TEXT,
    ADD COLUMN IF NOT EXISTS phone                 TEXT,
    ADD COLUMN IF NOT EXISTS phone_reference       TEXT,
    ADD COLUMN IF NOT EXISTS organization          TEXT,
    ADD COLUMN IF NOT EXISTS department            TEXT,
    ADD COLUMN IF NOT EXISTS designation           TEXT,
    ADD COLUMN IF NOT EXISTS status                user_status NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS last_login_at         TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until          TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_by            UUID,
    ADD COLUMN IF NOT EXISTS approved_by           UUID,
    ADD COLUMN IF NOT EXISTS approved_at           TIMESTAMPTZ;

-- full_name as a read-only mirror of the existing `name` column, so the profile
-- model can be queried with the documented field name without a rename.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.users
            ADD COLUMN full_name TEXT GENERATED ALWAYS AS (name) STORED;
    END IF;
END $$;

-- Any row that predates the split was keyed on its auth user id.
UPDATE public.users SET auth_user_id = id WHERE auth_user_id IS NULL;

-- Self-referencing accountability columns. Added after the columns exist so a
-- fresh database and an already-populated one take the same path.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_fkey') THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_created_by_fkey
            FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_approved_by_fkey') THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_approved_by_fkey
            FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- badge_id is what operators type at the login prompt, so it must resolve to at
-- most one account. Partial index: NULL badges (a PENDING request has none yet)
-- are allowed to coexist.
CREATE UNIQUE INDEX IF NOT EXISTS users_badge_id_key
    ON public.users (badge_id) WHERE badge_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_key
    ON public.users (username) WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key
    ON public.users (auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_status_idx ON public.users (status);
CREATE INDEX IF NOT EXISTS users_role_idx   ON public.users (role);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. sync_role_to_jwt() must follow auth_user_id now, not id
--
--    The original updated auth.users WHERE id = NEW.id. After the split that
--    either matches nothing or — worse, once profile ids and auth ids diverge —
--    stamps a role onto an unrelated auth account.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.role IS DISTINCT FROM NEW.role) THEN
        IF NEW.auth_user_id IS NOT NULL THEN
            UPDATE auth.users
               SET raw_app_meta_data =
                   COALESCE(raw_app_meta_data, '{}'::jsonb) || json_build_object('role', NEW.role)::jsonb
             WHERE id = NEW.auth_user_id;
        END IF;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Server-side sessions
--
--    Supabase-issued JWTs cannot be revoked before they expire. The backend
--    therefore mints its own short-lived token carrying a session id (sid), and
--    every authenticated request checks that sid against this table. Revoking a
--    row is what makes "sign out", "sign out everywhere", and administrative
--    session termination actually take effect.
--
--    Refresh tokens are stored as a SHA-256 hash: a dump of this table must not
--    hand an attacker usable credentials.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
    sid                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    refresh_token_hash  TEXT,
    refresh_expires_at  TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    revoked_reason      TEXT,
    user_agent          TEXT,
    ip_address          TEXT
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx  ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_active_idx   ON public.user_sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS user_sessions_refresh_idx  ON public.user_sessions (refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Access requests
--
--    Self-registration creates a request, never an account. An administrator
--    approves it, and only then does a profile become ACTIVE.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_requests (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name      TEXT NOT NULL,
    badge_id       TEXT NOT NULL,
    email          TEXT NOT NULL,
    phone          TEXT,
    organization   TEXT,
    department     TEXT,
    designation    TEXT,
    requested_role user_role NOT NULL DEFAULT 'OBSERVER',
    justification  TEXT,
    status         access_request_status NOT NULL DEFAULT 'PENDING',
    reviewed_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at    TIMESTAMPTZ,
    decision_note  TEXT,
    created_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS access_requests_status_idx ON public.access_requests (status);

-- One open request per badge. A rejected request may be re-submitted.
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_open_badge_key
    ON public.access_requests (badge_id) WHERE status IN ('PENDING', 'INFO_REQUESTED');

DROP TRIGGER IF EXISTS update_access_requests_modtime ON public.access_requests;
CREATE TRIGGER update_access_requests_modtime
BEFORE UPDATE ON public.access_requests
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Nobody reaches these tables except the service_role backend.
--
--    RLS on with no permissive policy denies every anon/authenticated request
--    outright; the service_role key bypasses RLS by design, which is exactly the
--    access pattern we want for session and access-request data.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Any profile that already existed predates the status column and was, by
--    definition, in use. Default 'PENDING' would have locked those accounts out.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.users SET status = 'ACTIVE' WHERE status = 'PENDING' AND created_at < NOW();
