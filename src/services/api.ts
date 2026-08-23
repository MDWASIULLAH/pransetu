/**
 * Single source of truth for the EOC backend origin.
 *
 * Previously every module hardcoded `http://localhost:8000`, which meant the
 * deployed build (HTTPS on Vercel) had every call blocked as mixed content.
 * Override per environment with VITE_API_BASE_URL.
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

export const API_BASE = RAW_BASE.replace(/\/+$/, '');

export const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${localStorage.getItem('access_token') || 'dummy-token'}`
});

/**
 * Circuit breaker for the polling widgets.
 *
 * The dashboard polls several endpoints on a timer. With no backend running
 * that produced a connection error every few seconds forever, which buried
 * genuine errors in the console. After a few consecutive transport failures we
 * treat the backend as down and short-circuit until the cooldown expires.
 */
const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 60_000;

let consecutiveFailures = 0;
let offlineUntil = 0;

export const isBackendOffline = () => Date.now() < offlineUntil;

export class BackendUnreachableError extends Error {
  constructor() {
    super('EOC backend unreachable');
    this.name = 'BackendUnreachableError';
  }
}

/**
 * fetch() against the API with auth, a request timeout, and the breaker above.
 * Throws BackendUnreachableError while the breaker is open so callers can fall
 * back to cached/seed data without issuing a doomed request.
 */
export async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  if (isBackendOffline()) throw new BackendUnreachableError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: { ...authHeaders(), ...(init.headers as Record<string, string> | undefined) }
    });
    consecutiveFailures = 0;
    return res;
  } catch (err) {
    // Only transport failures count toward the breaker; a 4xx/5xx still resolves.
    consecutiveFailures += 1;
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      offlineUntil = Date.now() + COOLDOWN_MS;
      consecutiveFailures = 0;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
