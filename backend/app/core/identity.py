"""Identity provider — password verification and auth-account provisioning.

Supabase Auth owns credentials: PRANSETU never stores or compares a password
hash. This module is the only place that talks to it, behind a small interface so
the whole login path stays testable without a network or a database
(`app.dependency_overrides[get_identity_provider]`, matching how
`get_supabase_client` is already overridden in the existing suite).

Two details of supabase-py shape this file:

* `sign_in_with_password()` mutates the session state of whichever client it is
  called on. Calling it on the shared service_role client would leave a
  process-wide, row-level-security-bypassing client carrying some operator's
  session. Sign-in therefore uses a separate client built from the anon key.

* There is no local JWKS verification available, only `auth.get_user(token)` —
  a network round trip. That is why the Supabase access token is used once, at
  the moment of sign-in, and never again: the backend immediately exchanges it
  for its own session token (see `app/core/sessions.py`).
"""

from dataclasses import dataclass
from typing import Any, Dict, Optional, Protocol

from supabase import create_client

from app.core.config import settings


@dataclass
class IdentityResult:
    """Outcome of a password check.

    `reason` is for logs and audit records only. It is never returned to the
    caller of /login, because distinguishing "no such account" from "wrong
    password" turns the login form into a way to discover valid badge IDs.
    """

    ok: bool
    auth_user_id: Optional[str] = None
    email: Optional[str] = None
    reason: Optional[str] = None


class IdentityProvider(Protocol):
    def verify_password(self, email: str, password: str) -> IdentityResult: ...

    def create_auth_user(self, email: str, password: str, *, email_confirm: bool = True) -> IdentityResult: ...

    def set_password(self, auth_user_id: str, password: str) -> IdentityResult: ...

    def delete_auth_user(self, auth_user_id: str) -> IdentityResult: ...


class SupabaseIdentityProvider:
    """Real provider, backed by Supabase Auth."""

    def _anon_client(self):
        # Built per call rather than cached. Sign-in leaves a session on the
        # client it is invoked on, so a long-lived shared instance would carry
        # the previous operator's session into the next request.
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

    def _admin_client(self):
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    def verify_password(self, email: str, password: str) -> IdentityResult:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            return IdentityResult(ok=False, reason="identity_provider_not_configured")

        client = self._anon_client()
        try:
            response = client.auth.sign_in_with_password({"email": email, "password": password})
        except Exception as exc:  # supabase raises AuthApiError for bad credentials
            return IdentityResult(ok=False, reason=f"{type(exc).__name__}: {exc}")

        user = getattr(response, "user", None)
        if user is None or not getattr(user, "id", None):
            return IdentityResult(ok=False, reason="no_user_in_auth_response")

        # Discard the Supabase session immediately — it is not used for anything
        # beyond proving the password was correct.
        try:
            client.auth.sign_out()
        except Exception:
            # A failed sign-out on a throwaway client has no consequence: the
            # client is discarded when this function returns.
            pass

        return IdentityResult(ok=True, auth_user_id=str(user.id), email=getattr(user, "email", email))

    def create_auth_user(self, email: str, password: str, *, email_confirm: bool = True) -> IdentityResult:
        if not settings.supabase_configured:
            return IdentityResult(ok=False, reason="identity_provider_not_configured")
        try:
            response = self._admin_client().auth.admin.create_user(
                {"email": email, "password": password, "email_confirm": email_confirm}
            )
        except Exception as exc:
            return IdentityResult(ok=False, reason=f"{type(exc).__name__}: {exc}")

        user = getattr(response, "user", None)
        if user is None or not getattr(user, "id", None):
            return IdentityResult(ok=False, reason="no_user_in_admin_response")
        return IdentityResult(ok=True, auth_user_id=str(user.id), email=getattr(user, "email", email))

    def set_password(self, auth_user_id: str, password: str) -> IdentityResult:
        if not settings.supabase_configured:
            return IdentityResult(ok=False, reason="identity_provider_not_configured")
        try:
            self._admin_client().auth.admin.update_user_by_id(auth_user_id, {"password": password})
        except Exception as exc:
            return IdentityResult(ok=False, reason=f"{type(exc).__name__}: {exc}")
        return IdentityResult(ok=True, auth_user_id=auth_user_id)

    def delete_auth_user(self, auth_user_id: str) -> IdentityResult:
        if not settings.supabase_configured:
            return IdentityResult(ok=False, reason="identity_provider_not_configured")
        try:
            self._admin_client().auth.admin.delete_user(auth_user_id)
        except Exception as exc:
            return IdentityResult(ok=False, reason=f"{type(exc).__name__}: {exc}")
        return IdentityResult(ok=True, auth_user_id=auth_user_id)


_provider = SupabaseIdentityProvider()


def get_identity_provider() -> IdentityProvider:
    """FastAPI dependency. Overridden in tests to avoid any network call."""
    return _provider
