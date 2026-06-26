/**
 * Tracks access-token expiry for proactive refresh (OAuth access tokens are short-lived;
 * refresh tokens are long-lived — see backend client token_settings).
 */
const EXPIRY_MS_KEY = 'naad_access_expires_at_ms';

/** Schedule proactive refresh before access token expiry (backend may return ~60s tokens). */
export function setAuthAccessExpiryFromExpiresIn(expiresInSeconds?: number | null): void {
  if (expiresInSeconds == null || expiresInSeconds <= 0) return;
  try {
    const leadMs =
      expiresInSeconds < 120
        ? Math.max(5_000, Math.floor(expiresInSeconds * 500))
        : 60_000;
    const refreshAt = Date.now() + expiresInSeconds * 1000 - leadMs;
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
