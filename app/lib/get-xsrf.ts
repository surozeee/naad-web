/**
 * Static XSRF token sent as X-XSRF-TOKEN on every API request.
 * Override with NEXTAUTH_XSRF_TOKEN, NEXT_AUTH_XSRF_TOKEN (server) or NEXT_PUBLIC_XSRF_TOKEN (client).
 */
const STATIC_XSRF_TOKEN = 'BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=';

/** Normalize XSRF token: trim only. Gateway expects AES-encrypted Base64 exactly. */
function normalizeXsrfToken(value: string | null | undefined): string | null {
  if (value == null || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/** Server-side: env or static token. Always returns a value so X-XSRF-TOKEN is always sent. */
export function getServerXsrfToken(): string {
  const v =
    process.env.NEXTAUTH_XSRF_TOKEN ??
    process.env.NEXT_AUTH_XSRF_TOKEN;
  return normalizeXsrfToken(v ?? null) ?? STATIC_XSRF_TOKEN;
}

/** Client/server: token for X-XSRF-TOKEN header. Uses env, cookie/sessionStorage, then static token. */
export function getXsrfToken(): string {
  const fromEnv = (
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_XSRF_TOKEN ?? process.env.NEXTAUTH_XSRF_TOKEN ?? process.env.NEXT_AUTH_XSRF_TOKEN) ?? null
      : (process.env.NEXTAUTH_XSRF_TOKEN ?? process.env.NEXT_AUTH_XSRF_TOKEN ?? process.env.NEXT_PUBLIC_XSRF_TOKEN) ?? null
  ) as string | undefined;
  const envToken = normalizeXsrfToken(fromEnv ?? null);
  if (envToken) return envToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('xsrf_token');
      if (stored) return normalizeXsrfToken(stored) ?? STATIC_XSRF_TOKEN;
    } catch {
      /* ignore */
    }
    const match = document.cookie.match(/(?:^|;)\s*XSRF-TOKEN=([^;]+)/);
    if (match) {
      try {
        const t = normalizeXsrfToken(decodeURIComponent(match[1].trim()));
        if (t) return t;
      } catch {
        const t = normalizeXsrfToken(match[1].trim());
        if (t) return t;
      }
    }
    const alt = document.cookie.match(/(?:^|;)\s*X-XSRF-TOKEN=([^;]+)/);
    if (alt) {
      try {
        const t = normalizeXsrfToken(decodeURIComponent(alt[1].trim()));
        if (t) return t;
      } catch {
        const t = normalizeXsrfToken(alt[1].trim());
        if (t) return t;
      }
    }
  }
  return STATIC_XSRF_TOKEN;
}
