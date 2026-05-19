import { API_BASE, DEFAULT_API_BASE, backendUrl } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

export { API_BASE, DEFAULT_API_BASE, backendUrl };

const AUTH_COOKIE = 'naad_auth';
const XSRF_COOKIE = 'XSRF-TOKEN';

function getCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const escaped = name.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
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
  const accessToken = getCookieFromHeader(cookie, AUTH_COOKIE) ?? request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) headers['Cookie'] = cookie;
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
