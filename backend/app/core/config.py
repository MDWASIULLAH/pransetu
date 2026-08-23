import secrets
from functools import cached_property
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env — resolved from this file, not from the process working directory.
#
# The previous `env_file = ".env"` was relative to wherever the process happened
# to be started, so launching uvicorn from the repository root silently loaded no
# configuration at all and the failure surfaced later as an auth error.
_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_DIR / ".env"

# Fallback signing keys, generated once per process when none are configured.
#
# A hard-coded default would be worse than no default: it would ship a publicly
# known signing key that anyone could use to forge an administrator session. A
# per-process random value cannot be forged, keeps `import app.main` working with
# no .env present (so the test suite is collectable offline), and invalidates
# every session on restart — a visible symptom that pushes a real deployment to
# configure the key properly rather than letting it pass unnoticed.
_EPHEMERAL_SESSION_SECRET = secrets.token_urlsafe(64)
_EPHEMERAL_LEGACY_SECRET = secrets.token_urlsafe(64)


class Settings(BaseSettings):
    PROJECT_NAME: str = "PRANSETU Backend"
    API_V1_STR: str = "/api/v1"

    # development | demo | production
    #
    # Governs whether demonstration data is served and whether unconfigured
    # credentials are tolerated at startup.
    ENVIRONMENT: str = "development"

    # ── Supabase ──────────────────────────────────────────────────────────────
    # Deliberately defaulted rather than required. Requiring them made importing
    # the application impossible without a .env file, which took all 11 test
    # modules down at collection time — the entire offline test suite was
    # unrunnable. Absent credentials are now reported by validate_runtime_config()
    # at startup and fail at the point of use, not at import.
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""       # service_role — bypasses row-level security
    SUPABASE_ANON_KEY: str = ""  # anon/publishable — used only for sign-in

    # ── Session tokens ────────────────────────────────────────────────────────
    # PRANSETU signs its own session tokens rather than passing Supabase tokens
    # through, because a Supabase-issued JWT cannot be revoked before it expires.
    # Each token carries a session id checked against public.user_sessions, which
    # is what makes sign-out and session revocation take effect immediately.
    PRANSETU_JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "pransetu-eoc"
    JWT_AUDIENCE: str = "pransetu-console"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_HOURS: int = 8
    # Warn the operator this long before the access token lapses.
    SESSION_WARNING_MINUTES: int = 5
    # Sign out an idle session even while its token is still valid.
    INACTIVITY_TIMEOUT_MINUTES: int = 25

    # ── Account lockout ───────────────────────────────────────────────────────
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated origins. Declared as a string, not List[str], because
    # pydantic-settings parses list-typed fields as JSON and would reject
    # "a,b" with a JSONDecodeError before the application ever started.
    CORS_ORIGINS: str = "http://localhost:5190,http://127.0.0.1:5190"

    # ── Legacy / optional ─────────────────────────────────────────────────────
    # Supabase's own HS256 secret. No longer used to sign or verify session
    # tokens. Newer projects sign with ES256/RS256 and may not expose an HS256
    # secret at all, so depending on it would be fragile.
    SUPABASE_JWT_SECRET: str = ""

    TWILIO_AUTH_TOKEN: str = ""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=True,
        # A dotenv file is parsed with extra='forbid' by default, so one unrelated
        # key — a database URL kept alongside the app settings, say — aborted
        # startup with `Extra inputs are not permitted`. Unknown keys are now
        # ignored, matching how the real process environment already behaved.
        extra="ignore",
    )

    @cached_property
    def session_secret(self) -> str:
        """Signing key for session tokens; per-process random if unconfigured."""
        return self.PRANSETU_JWT_SECRET or _EPHEMERAL_SESSION_SECRET

    @cached_property
    def legacy_supabase_secret(self) -> str:
        """Supabase HS256 secret; per-process random if unconfigured."""
        return self.SUPABASE_JWT_SECRET or _EPHEMERAL_LEGACY_SECRET

    @cached_property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def demo_data_enabled(self) -> bool:
        return self.ENVIRONMENT.lower() in ("development", "demo")

    @property
    def supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)


settings = Settings()


def validate_runtime_config() -> List[str]:
    """Report configuration that is missing or unsafe.

    Returns a list of human-readable problems. Called at startup so an
    unconfigured deployment announces itself instead of failing later with an
    opaque authentication error.
    """
    problems: List[str] = []

    if not settings.SUPABASE_URL:
        problems.append("SUPABASE_URL is not set — no database or identity provider is reachable.")
    if not settings.SUPABASE_KEY:
        problems.append("SUPABASE_KEY (service_role) is not set — all database access will fail.")
    if not settings.SUPABASE_ANON_KEY:
        problems.append("SUPABASE_ANON_KEY is not set — password verification cannot run, so no one can sign in.")
    if not settings.PRANSETU_JWT_SECRET:
        problems.append(
            "PRANSETU_JWT_SECRET is not set — using a per-process random key, so every "
            "session is invalidated when this process restarts."
        )
    if settings.is_production and "localhost" in settings.CORS_ORIGINS:
        problems.append(
            f"CORS_ORIGINS still contains localhost in production ({settings.CORS_ORIGINS}) — "
            "the deployed frontend origin will be blocked."
        )
    if not settings.TWILIO_AUTH_TOKEN:
        problems.append(
            "TWILIO_AUTH_TOKEN is not set — the IVR webhook cannot verify request "
            "signatures and will accept unsigned requests."
        )

    return problems
