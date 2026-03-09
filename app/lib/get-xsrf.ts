/** Normalize XSRF token: trim only. Gateway expects AES-encrypted Base64 exactly (decodeURIComponent for cookie is ok). */
function normalizeXsrfToken(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/** Server-side: get XSRF token from env. Supports NEXTAUTH_XSRF_TOKEN or NEXT_AUTH_XSRF_TOKEN. */
export function getServerXsrfToken(): string | null {
  const v =
    process.env.NEXTAUTH_XSRF_TOKEN ??
    process.env.NEXT_AUTH_XSRF_TOKEN;
  return normalizeXsrfToken(v ?? null);
}

/** Get XSRF token from env or cookie. Must be the gateway's AES-encrypted (Base64) value to avoid 403. */
export function getXsrfToken(): string | null {
  const fromEnv = (
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_XSRF_TOKEN ?? process.env.NEXTAUTH_XSRF_TOKEN ?? process.env.NEXT_AUTH_XSRF_TOKEN) ?? null
      : (process.env.NEXTAUTH_XSRF_TOKEN ?? process.env.NEXT_AUTH_XSRF_TOKEN ?? process.env.NEXT_PUBLIC_XSRF_TOKEN) ?? null
  ) as string | undefined;
  const envToken = normalizeXsrfToken(fromEnv ?? null);
  if (envToken) return envToken;
  if (typeof window !== 'undefined') {
    const match = document.cookie.match(/(?:^|;)\s*XSRF-TOKEN=([^;]+)/);
    if (match) {
      try {
        return normalizeXsrfToken(decodeURIComponent(match[1].trim()));
      } catch {
        return normalizeXsrfToken(match[1].trim());
      }
    }
    const alt = document.cookie.match(/(?:^|;)\s*X-XSRF-TOKEN=([^;]+)/);
    if (alt) {
      try {
        return normalizeXsrfToken(decodeURIComponent(alt[1].trim()));
      } catch {
        return normalizeXsrfToken(alt[1].trim());
      }
    }
  }
  return null;
}
