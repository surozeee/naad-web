/**
 * Authenticated fetch: proactive refresh before access-token expiry, then 401 + refresh + retry.
 * If refresh fails, clear tokens and redirect to homepage (unless ignoreAuthFailure).
 * Bootstraps XSRF token from /api/csrf-token when missing (needed for gateway 403).
 */

import { clearAuthAccessExpiry, setAuthAccessExpiryFromExpiresIn, shouldProactiveRefresh } from '@/app/lib/auth-session';
import { getAuthAccessToken } from '@/app/lib/auth-guard';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { logout } from '@/app/lib/logout';
import { getStoredUiLanguage } from '@/app/lib/ui-language';

const REFRESH_API = '/api/auth/refresh';
const CSRF_TOKEN_API = '/api/csrf-token';

type RefreshJson = {
  access_token?: string;
  accessToken?: string;
  expires_in?: number;
  expiresIn?: number;
};

export interface FetchWithAuthOptions extends RequestInit {
  /** When true, 401 / failed refresh does not trigger global logout (e.g. optional profile load). */
  ignoreAuthFailure?: boolean;
}

let refreshInFlight: Promise<{ ok: boolean; bearer?: string }> | null = null;

async function doRefreshSession(xsrf: string | undefined): Promise<{ ok: boolean; bearer?: string }> {
  const refreshRes = await fetch(REFRESH_API, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
    body: JSON.stringify({}),
  });
  if (!refreshRes.ok) {
    return { ok: false };
  }
  try {
    const raw = (await refreshRes.json()) as RefreshJson;
    const newToken = raw.access_token ?? raw.accessToken ?? '';
    const exp = raw.expires_in ?? raw.expiresIn;
    if (typeof exp === 'number' && exp > 0) {
      setAuthAccessExpiryFromExpiresIn(exp);
    }
    return { ok: true, bearer: newToken ? `Bearer ${newToken}` : undefined };
  } catch {
    return { ok: true, bearer: undefined };
  }
}

function refreshSession(xsrf: string | undefined): Promise<{ ok: boolean; bearer?: string }> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefreshSession(xsrf).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function applyBearer(headers: Headers, bearer?: string | null): void {
  if (bearer) {
    headers.set('Authorization', bearer.startsWith('Bearer ') ? bearer : `Bearer ${bearer}`);
    return;
  }
  const token = getAuthAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
}

function buildHeaders(init: RequestInit | undefined, xsrf: string | undefined, bearer?: string | null): Headers {
  const headers = new Headers(init?.headers);
  if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getStoredUiLanguage());
  }
  applyBearer(headers, bearer);
  return headers;
}

/**
 * Fetch with automatic token refresh on 401.
 * - Sends Authorization Bearer from naad_auth cookie on every request.
 * - Ensures XSRF token is available (fetches from /api/csrf-token if missing).
 * - If access token is near expiry (from login/refresh `expiresIn`), refreshes before the request.
 * - If response is 401, calls refresh API, then retries once with the new token.
 * - If refresh fails, clears tokens and redirects to / (unless ignoreAuthFailure).
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: FetchWithAuthOptions
): Promise<Response> {
  const { ignoreAuthFailure = false, ...fetchInit } = init ?? {};
  let xsrf = getXsrfToken();
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  if (!xsrf && url.startsWith('/api/') && !url.startsWith(CSRF_TOKEN_API)) {
    const csrfRes = await fetch(CSRF_TOKEN_API, { credentials: 'same-origin' });
    try {
      const data = (await csrfRes.json().catch(() => ({}))) as { token?: string };
      if (data?.token && typeof data.token === 'string') {
        try {
          sessionStorage.setItem('xsrf_token', data.token.trim());
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    xsrf = getXsrfToken();
  }

  let bearer: string | undefined;
  const skipProactive =
    !url.startsWith('/api/') ||
    url.startsWith(CSRF_TOKEN_API) ||
    url.startsWith(REFRESH_API) ||
    url.includes('/api/auth/login');

  if (!skipProactive && shouldProactiveRefresh()) {
    const proactive = await refreshSession(xsrf);
    if (proactive.ok && proactive.bearer) {
      bearer = proactive.bearer;
    } else if (!proactive.ok) {
      clearAuthAccessExpiry();
    }
  }

  const headers = buildHeaders(fetchInit, xsrf, bearer);

  let res = await fetch(input, {
    ...fetchInit,
    credentials: fetchInit.credentials ?? 'same-origin',
    headers,
  });

  if (res.status !== 401) return res;

  const refreshed = await refreshSession(xsrf);
  if (!refreshed.ok) {
    if (!ignoreAuthFailure) logout('/');
    return res;
  }

  const retryHeaders = buildHeaders(fetchInit, xsrf, refreshed.bearer);

  res = await fetch(input, {
    ...fetchInit,
    credentials: fetchInit.credentials ?? 'same-origin',
    headers: retryHeaders,
  });

  if (res.status === 401 && !ignoreAuthFailure) {
    logout('/');
  }

  return res;
}
