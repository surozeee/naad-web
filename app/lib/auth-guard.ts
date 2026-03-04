/**
 * Auth guard (erp-web style): prevent access without login.
 * Tokens are maintained in cookies (naad_auth, naad_refresh) by the login API.
 */

const AUTH_COOKIE = 'naad_auth';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[\-.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get the redirect URL path for login (with ?login=1&redirect=...).
 * Use with router.replace() so user returns here after login.
 */
export function getLoginRedirectPath(pathname: string | null): string {
  const path = (pathname && pathname !== '/') ? pathname : '/dashboard';
  const params = new URLSearchParams();
  params.set('login', '1');
  params.set('redirect', path);
  return `/?${params.toString()}`;
}

/**
 * Check if user has auth token (client-side).
 * Reads access_token from cookie set by login API.
 */
export function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !!getCookie(AUTH_COOKIE);
  } catch {
    return false;
  }
}

/**
 * Require auth: if no token, redirect to login with return URL.
 * Returns true if allowed, false if redirect was triggered.
 * Use in a useEffect in protected layouts.
 */
export function requireAuth(pathname: string | null, router: { replace: (url: string) => void }): boolean {
  if (typeof window === 'undefined') return false;
  if (hasAuthToken()) return true;
  router.replace(getLoginRedirectPath(pathname));
  return false;
}
