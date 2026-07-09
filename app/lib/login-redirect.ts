/** Safe in-app redirect path (blocks open redirects). */
export function resolveSafeRedirectPath(path?: string | null, fallback = '/dashboard'): string {
  const trimmed = String(path ?? '').trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  return trimmed;
}

/**
 * Default landing page after login (erp-web style).
 * All roles land on /dashboard; the page renders role-specific home content.
 * Explicit ?redirect= wins when provided by the login modal.
 */
export function resolvePostLoginRedirect(
  _userType?: string | null,
  _roleName?: string | null,
  requestedRedirect?: string | null
): string {
  const safeRequested = requestedRedirect ? resolveSafeRedirectPath(requestedRedirect, '') : '';
  if (safeRequested) {
    return safeRequested;
  }
  return '/dashboard';
}
