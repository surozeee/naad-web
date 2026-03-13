/**
 * Authenticated fetch: on 401, try refresh token once, then retry.
 * If refresh fails, clear tokens and redirect to homepage.
 * Bootstraps XSRF token from /api/csrf-token when missing (needed for gateway 403).
 */

import { getXsrfToken } from '@/app/lib/get-xsrf';
import { logout } from '@/app/lib/logout';

const REFRESH_API = '/api/auth/refresh';
const CSRF_TOKEN_API = '/api/csrf-token';

/**
 * Fetch with automatic token refresh on 401.
 * - Ensures XSRF token is available (fetches from /api/csrf-token if missing).
 * - First request uses cookies (access_token in naad_auth).
 * - If response is 401, calls refresh API, then retries once.
 * - If refresh fails, clears tokens and redirects to /.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
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
  const headers = new Headers(init?.headers);
  if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let res = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'same-origin',
    headers,
  });

  if (res.status !== 401) return res;

  const refreshRes = await fetch(REFRESH_API, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
    body: JSON.stringify({}), // server reads refresh token from cookie
  });

  if (!refreshRes.ok) {
    logout('/');
    return res;
  }

  // Use the new access token from refresh response body for the retry, so we don't rely on
  // the cookie being updated before the retry (avoids retry still sending old token and getting 401 → logout).
  let retryHeaders = new Headers(init?.headers);
  try {
    const refreshData = (await refreshRes.clone().json().catch(() => ({}))) as { access_token?: string; accessToken?: string };
    const newToken = refreshData?.access_token ?? refreshData?.accessToken ?? '';
    if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
  } catch {
    // ignore; retry will use cookie
  }
  if (xsrf) retryHeaders.set('X-XSRF-TOKEN', xsrf);
  if (!retryHeaders.has('Content-Type') && !(init?.body instanceof FormData)) retryHeaders.set('Content-Type', 'application/json');

  res = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'same-origin',
    headers: retryHeaders,
  });
  if (res.status === 401) {
    logout('/');
  }
  return res;
}
