import { getToken } from 'next-auth/jwt';
import { API_BASE, DEFAULT_API_BASE, backendUrl } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';
import { authOptions } from '@/lib/auth';

export { API_BASE, DEFAULT_API_BASE, backendUrl };

const XSRF_COOKIE = 'XSRF-TOKEN';

function readCookieRawValue(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.includes('%')) return trimmed;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function getCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const escaped = name.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
  if (!match) return null;
  return readCookieRawValue(match[1]);
}

/** Strip NextAuth + legacy session cookies before forwarding to backend. */
function sanitizeForwardCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const kept = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const name = part.split('=')[0]?.trim().toLowerCase() ?? '';
      return (
        name !== 'naad_auth' &&
        name !== 'naad_refresh' &&
        !name.startsWith('next-auth.session-token') &&
        !name.startsWith('__secure-next-auth.session-token')
      );
    });
  return kept.length > 0 ? kept.join('; ') : null;
}

function getXsrfCookieRaw(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/i);
  if (!match) return null;
  const raw = match[1].trim();
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Resolve Bearer access token from Authorization header or NextAuth JWT session cookie. */
export async function resolveAccessTokenFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (authHeader) return authHeader;

  const secret = authOptions.secret;
  if (!secret) return null;
  try {
    const token = await getToken({
      req: request as Parameters<typeof getToken>[0]['req'],
      secret,
    });
    const access = (token as { access_token?: string } | null)?.access_token;
    return access?.trim() || null;
  } catch {
    return null;
  }
}

/** Build headers for backend request: Authorization Bearer, Cookie, X-XSRF-TOKEN. */
export function backendHeaders(
  request: Request,
  options?: { includeJsonContentType?: boolean; accessToken?: string | null }
): Record<string, string> {
  const headers: Record<string, string> = {
    accept: '*/*',
  };
  if (options?.includeJsonContentType !== false) {
    headers['Content-Type'] = 'application/json';
  }
  const cookie = request.headers.get('cookie');
  const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  const accessToken = options?.accessToken ?? authHeader ?? getCookieFromHeader(cookie, 'naad_auth');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const forwardCookie = sanitizeForwardCookie(cookie);
  if (forwardCookie) headers['Cookie'] = forwardCookie;
  const serverXsrf = getServerXsrfToken();
  const xsrfHeader = request.headers.get('X-XSRF-TOKEN')?.trim();
  const xsrfFromCookie = getXsrfCookieRaw(cookie) ?? getCookieFromHeader(cookie, XSRF_COOKIE);
  const xsrf = (serverXsrf || xsrfHeader || xsrfFromCookie || '').trim();
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
    if (!headers['Cookie']) headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    else if (!cookie?.includes('XSRF-TOKEN=')) headers['Cookie'] = headers['Cookie'] + `; XSRF-TOKEN=${xsrf}`;
  }
  const acceptLanguage = request.headers.get('accept-language')?.trim();
  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage;
  }
  return headers;
}

/** Async variant that reads access_token from NextAuth session JWT when no Bearer is sent. */
export async function backendHeadersFromSession(
  request: Request,
  options?: { includeJsonContentType?: boolean }
): Promise<Record<string, string>> {
  const accessToken = await resolveAccessTokenFromRequest(request);
  return backendHeaders(request, { ...options, accessToken });
}
