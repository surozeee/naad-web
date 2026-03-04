/**
 * Authenticated fetch: on 401, try refresh token once, then retry.
 * If refresh fails, clear tokens and redirect to homepage.
 */

import { getXsrfToken } from '@/app/lib/get-xsrf';
import { logout } from '@/app/lib/logout';

const REFRESH_API = '/api/auth/refresh';

/**
 * Fetch with automatic token refresh on 401.
 * - First request uses cookies (access_token in naad_auth).
 * - If response is 401, calls refresh API (sends naad_refresh cookie).
 * - If refresh succeeds, retries the original request once.
 * - If refresh fails, clears access_token and refresh_token and redirects to /.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const xsrf = getXsrfToken();
  const headers = new Headers(init?.headers);
  if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

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

  const retryHeaders = new Headers(init?.headers);
  if (xsrf) retryHeaders.set('X-XSRF-TOKEN', xsrf);
  if (!retryHeaders.has('Content-Type')) retryHeaders.set('Content-Type', 'application/json');

  res = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'same-origin',
    headers: retryHeaders,
  });
  return res;
}
