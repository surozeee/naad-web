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
 * Try public backend paths first, then the secured path (with optional PUBLIC_API_BEARER).
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
      // Prefer a successful or non-auth response from a public path.
      if (res.ok || (res.status !== 401 && res.status !== 403)) {
        return res;
      }
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
