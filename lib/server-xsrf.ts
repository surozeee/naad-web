import { serverFetch } from '@/lib/server-fetch';

function parseSetCookies(response: Response): { cookieHeader: string; xsrfToken: string } {
  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie')!]
        : [];

  const cookiePairs: string[] = [];
  let xsrfToken = '';

  for (const raw of setCookies) {
    const eq = raw.indexOf('=');
    if (eq === -1) continue;
    const name = raw.slice(0, eq).trim();
    const valuePart = raw.slice(eq + 1);
    const semicolon = valuePart.indexOf(';');
    const value = (semicolon === -1 ? valuePart : valuePart.slice(0, semicolon)).trim();
    cookiePairs.push(`${name}=${value}`);
    if (/^[Xx][Ss][Rr][Ff]/i.test(name) && value) {
      xsrfToken = value;
    }
  }

  return {
    cookieHeader: cookiePairs.join('; '),
    xsrfToken,
  };
}

/** Resolve XSRF token + Cookie header for server-side backend POSTs (login, register, …). */
export async function resolveServerXsrfHeaders(
  apiBase: string,
  /** Public GET path that sets XSRF cookie (must support GET — do not use /login). */
  publicPath = '/api/v2/public'
): Promise<{ headers: Record<string, string>; xsrf: string | undefined }> {
  const probeUrl = `${apiBase}${publicPath.startsWith('/') ? publicPath : `/${publicPath}`}`;
  let cookieHeader = '';
  let xsrfToken = '';

  try {
    const pre = await serverFetch(probeUrl, { method: 'GET', redirect: 'manual' });
    const parsed = parseSetCookies(pre);
    cookieHeader = parsed.cookieHeader;
    xsrfToken = parsed.xsrfToken;
  } catch {
    // preflight is best-effort; env token may still work
  }

  const envXsrf = process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
  const xsrf = envXsrf || xsrfToken || undefined;

  const headers: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };

  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
    const xsrfCookie = `XSRF-TOKEN=${xsrf}`;
    headers.Cookie = cookieHeader ? `${cookieHeader}; ${xsrfCookie}` : xsrfCookie;
  } else if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return { headers, xsrf };
}
