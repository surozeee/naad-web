/**
 * Auth guard helpers. Session lives in HttpOnly NextAuth JWT cookie —
 * client cannot read the access token from document.cookie.
 */

import { getCachedSession } from '@/lib/auth-fetch';

/**
 * Get the redirect URL path for login (with ?login=1&redirect=...).
 */
export function getLoginRedirectPath(pathname: string | null): string {
  const path = pathname && pathname !== '/' ? pathname : '/dashboard';
  const params = new URLSearchParams();
  params.set('login', '1');
  params.set('redirect', path);
  return `/?${params.toString()}`;
}

/**
 * @deprecated Access tokens are HttpOnly — use getSession() / authFetch instead.
 * Kept for transitional callers; always returns null.
 */
export function getAuthAccessToken(): string | null {
  return null;
}

/** Client-side: whether a NextAuth session cookie appears present (non-HttpOnly check is unreliable). Prefer useSession. */
export function hasAuthToken(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)(?:__Secure-)?next-auth\.session-token/.test(document.cookie);
}

/**
 * Require auth via session poll. Prefer SessionAuthGuard in layouts.
 */
export function requireAuth(pathname: string | null, router: { replace: (url: string) => void }): boolean {
  if (typeof window === 'undefined') return false;
  if (hasAuthToken()) return true;
  void getCachedSession().then((session) => {
    if (!session?.user) {
      router.replace(getLoginRedirectPath(pathname));
    }
  });
  router.replace(getLoginRedirectPath(pathname));
  return false;
}
