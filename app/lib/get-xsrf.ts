/** Normalize XSRF token: trim and remove trailing typo chars. Backend expects exact value. (From erp-web auth-fetch.) */
function normalizeXsrfToken(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/[~\s]+$/, '').trim();
  return trimmed || null;
}

/** Get XSRF token from env (NEXT_PUBLIC_XSRF_TOKEN / NEXTAUTH_XSRF_TOKEN) or cookie. Sent as X-XSRF-TOKEN on API calls. (From erp-web auth-fetch.) */
export function getXsrfToken(): string | null {
  const fromEnv =
    (typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_XSRF_TOKEN ?? process.env.NEXTAUTH_XSRF_TOKEN) ?? null
      : (process.env.NEXTAUTH_XSRF_TOKEN ?? process.env.NEXT_PUBLIC_XSRF_TOKEN) ?? null) as string | undefined;
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
