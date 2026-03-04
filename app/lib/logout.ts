const AUTH_COOKIE = 'naad_auth';
const REFRESH_COOKIE = 'naad_refresh';

/**
 * Clear auth cookies and call logout API, then redirect.
 */
export function logout(redirectTo: string = '/'): void {
  if (typeof window === 'undefined') return;
  try {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`;
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  } catch {
    // ignore
  }
  window.location.href = redirectTo;
}
