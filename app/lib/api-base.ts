/**
 * Backend API base URL for Next.js server routes and proxies.
 * Default: https://api-naad.jojolapatech.com
 */
export const DEFAULT_API_BASE = 'https://api-naad.jojolapatech.com';

const BACKEND_FETCH_TIMEOUT_MS = Number(process.env.BACKEND_FETCH_TIMEOUT_MS ?? 30_000);

function normalizeApiBase(raw: string): string {
  return raw
    .trim()
    .replace(/\/api\/v2\/?$/i, '')
    .replace(/\/api\/?$/i, '')
    .replace(/\/+$/, '');
}

export function getApiBase(): string {
  const raw = (
    process.env.BACKEND_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    ''
  ).trim();

  if (raw) {
    return normalizeApiBase(raw);
  }

  return DEFAULT_API_BASE;
}

/** Resolved once at module load (after Next.js loads env). */
export const API_BASE = getApiBase();

export function backendUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p.startsWith('/api') ? p : `/api/v2${p}`}`;
}

export function isBackendNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const cause = error.cause as { code?: string; name?: string } | undefined;
  return (
    error.message === 'fetch failed' ||
    error.name === 'AbortError' ||
    error.name === 'TimeoutError' ||
    cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    cause?.name === 'ConnectTimeoutError' ||
    cause?.code === 'ECONNREFUSED' ||
    cause?.code === 'ENOTFOUND'
  );
}

export function getBackendNetworkErrorMessage(error: unknown, apiBase = API_BASE): string {
  if (!isBackendNetworkError(error)) {
    return 'Something went wrong. Please try again later.';
  }
  return `Cannot reach the NAAD API at ${apiBase}. Check your network connection.`;
}

export function getBackendHttpErrorMessage(status: number, backendUrl: string, backendMessage?: string): string {
  if (backendMessage && backendMessage.trim()) {
    return backendMessage.trim();
  }
  if (status === 404) {
    return `Login API not found at ${backendUrl}. Expected NAAD API base: ${DEFAULT_API_BASE}`;
  }
  if (status === 401 || status === 403) {
    return 'Invalid email or password.';
  }
  if (status >= 500) {
    return 'Authentication service is unavailable. Please try again shortly.';
  }
  return 'Login failed. Please check your credentials and try again.';
}

/** Server-side fetch to the Java API with a longer connect timeout than the default 10s. */
export function backendFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS),
  });
}
