/**
 * Tracks access-token expiry for proactive refresh (OAuth access tokens are short-lived;
 * refresh tokens are long-lived — see backend client token_settings).
 */
const EXPIRY_MS_KEY = 'naad_access_expires_at_ms';

/** Schedule refresh ~1 minute before access token expiry. */
export function setAuthAccessExpiryFromExpiresIn(expiresInSeconds?: number | null): void {
  if (expiresInSeconds == null || expiresInSeconds < 120) return;
  try {
    const refreshAt = Date.now() + expiresInSeconds * 1000 - 60_000;
    sessionStorage.setItem(EXPIRY_MS_KEY, String(refreshAt));
  } catch {
    /* ignore */
  }
}

export function clearAuthAccessExpiry(): void {
  try {
    sessionStorage.removeItem(EXPIRY_MS_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldProactiveRefresh(): boolean {
  try {
    const v = sessionStorage.getItem(EXPIRY_MS_KEY);
    if (!v) return false;
    return Date.now() >= parseInt(v, 10);
  } catch {
    return false;
  }
}
