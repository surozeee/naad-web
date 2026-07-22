import { backendFetch, backendUrl } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

/** Optional server-only bearer for public marketing reads when backend has no public route yet. */
function publicBearer(): string | undefined {
  const raw =
    process.env.PUBLIC_API_BEARER?.trim() ||
    process.env.BACKEND_PUBLIC_BEARER?.trim() ||
    process.env.PUBLIC_HOROSCOPE_TOKEN?.trim() ||
    '';
  return raw || undefined;
}

export function publicBackendHeaders(options?: { json?: boolean }): Record<string, string> {
  const headers: Record<string, string> = { accept: '*/*' };
  if (options?.json !== false) {
    headers['Content-Type'] = 'application/json';
  }
  const xsrf = getServerXsrfToken();
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
    headers.Cookie = `XSRF-TOKEN=${xsrf}`;
  }
  const bearer = publicBearer();
  if (bearer) {
    headers.Authorization = bearer.startsWith('Bearer ') ? bearer : `Bearer ${bearer}`;
  }
  return headers;
}

/**
 * Try candidates in order. Continue on auth failure; also continue on 404 so a missing
 * public route can fall through to the secured master path when a bearer is configured.
 */
export async function publicBackendRequest(
  candidates: string[],
  init?: RequestInit
): Promise<Response> {
  const headers = {
    ...publicBackendHeaders({
      json: Boolean(init?.body) || String(init?.method ?? 'GET').toUpperCase() === 'POST',
    }),
    ...(init?.headers as Record<string, string> | undefined),
  };

  let last: Response | null = null;
  for (const path of candidates) {
    try {
      const res = await backendFetch(backendUrl(path), { ...init, headers });
      last = res;
      if (res.ok) {
        return res;
      }
      // Try next candidate for auth gaps or undeployed public routes.
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        continue;
      }
      // For 5xx on a public path, still try the next candidate before giving up.
      if (res.status >= 500 && candidates.indexOf(path) < candidates.length - 1) {
        continue;
      }
      return res;
    } catch {
      continue;
    }
  }
  return last ?? new Response(JSON.stringify({ message: 'Upstream unavailable' }), { status: 503 });
}

export function emptyPublishedListPayload() {
  return {
    status: 'SUCCESS',
    data: {
      result: [],
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageNo: 0,
      pageSize: 50,
    },
    result: [],
    content: [],
    totalElements: 0,
  };
}
