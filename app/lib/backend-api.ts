import { API_BASE, DEFAULT_API_BASE, backendUrl } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

export { API_BASE, DEFAULT_API_BASE, backendUrl };

const AUTH_COOKIE = 'naad_auth';
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

/** Strip app session cookies before forwarding to backend (use Authorization Bearer instead). */
function sanitizeForwardCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const kept = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const name = part.split('=')[0]?.trim().toLowerCase() ?? '';
      return name !== AUTH_COOKIE.toLowerCase() && name !== 'naad_refresh';
    });
  return kept.length > 0 ? kept.join('; ') : null;
}

/** Get XSRF cookie value; try decode so = and + are correct when browser sends encoded. */
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

/** Build headers for backend request: Authorization Bearer, Cookie, X-XSRF-TOKEN (required by many backends to avoid 403). */
export function backendHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };
  const cookie = request.headers.get('cookie');
  const authHeader = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  const accessToken = authHeader || getCookieFromHeader(cookie, AUTH_COOKIE);
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const forwardCookie = sanitizeForwardCookie(cookie);
  if (forwardCookie) headers['Cookie'] = forwardCookie;
  // XSRF: gateway expects X-XSRF-TOKEN header. Use NEXTAUTH_XSRF_TOKEN or NEXT_AUTH_XSRF_TOKEN from env.
  const serverXsrf = getServerXsrfToken();
  const xsrfHeader = request.headers.get('X-XSRF-TOKEN')?.trim();
  const xsrfFromCookie = getXsrfCookieRaw(cookie) ?? getCookieFromHeader(cookie, XSRF_COOKIE);
  const xsrf = (serverXsrf || xsrfHeader || xsrfFromCookie || '').trim();
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
    if (!headers['Cookie']) headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    else if (!cookie?.includes('XSRF-TOKEN=')) headers['Cookie'] = headers['Cookie'] + `; XSRF-TOKEN=${xsrf}`;
  }
  return headers;
}
