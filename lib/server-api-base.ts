/**
 * Backend origin for Node-only routes (no trailing /api).
 * Prefer BACKEND_URL / API_INTERNAL_URL when the process must reach the API on a
 * different host than the browser; falls back to NEXT_PUBLIC_* then NAAD default.
 */

import { DEFAULT_API_BASE, getApiBase } from '@/app/lib/api-base';

function normalizeApiOrigin(raw: string): string {
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

export function getServerApiBase(): string {
  if (typeof process === 'undefined') {
    return '';
  }
  const raw =
    process.env.API_INTERNAL_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_AUTH_API_URL?.trim() ||
    '';
  if (raw) return normalizeApiOrigin(raw);
  try {
    return getApiBase();
  } catch {
    return DEFAULT_API_BASE;
  }
}

/** Full URL for a backend path (e.g. `/api/v2/public/user/login`). */
export function buildServerApiUrl(apiPath: string): string | null {
  const base = getServerApiBase();
  if (!base) return null;
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  return `${base}${path}`;
}

export function getServerAuthApiBase(): string {
  const raw =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_AUTH_API_URL?.trim() ||
        process.env.API_INTERNAL_URL?.trim() ||
        process.env.BACKEND_URL?.trim() ||
        process.env.NEXT_PUBLIC_API_URL?.trim() ||
        DEFAULT_API_BASE)) ||
    '';
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

export type BackendFetchFailure = 'timeout' | 'unreachable' | 'unknown';

/** Classify `fetch failed` from Node/undici (connection refused, DNS, connect timeout, …). */
export function classifyBackendFetchError(error: unknown): BackendFetchFailure | null {
  if (!(error instanceof TypeError) || error.message !== 'fetch failed') {
    return null;
  }
  const walk = (c: unknown): BackendFetchFailure | null => {
    if (!c || typeof c !== 'object') return null;
    const o = c as { code?: string; name?: string; errors?: unknown };
    if (o.code === 'UND_ERR_CONNECT_TIMEOUT' || o.name === 'ConnectTimeoutError') return 'timeout';
    if (o.code === 'UND_ERR_HEADERS_TIMEOUT' || o.code === 'UND_ERR_BODY_TIMEOUT') return 'timeout';
    if (o.code === 'ECONNREFUSED' || o.code === 'ENOTFOUND') return 'unreachable';
    if (Array.isArray(o.errors)) {
      for (const e of o.errors) {
        const r = walk(e);
        if (r) return r;
      }
    }
    return walk((o as { cause?: unknown }).cause);
  };
  return walk((error as { cause?: unknown }).cause) ?? 'unknown';
}

export function isUnreachableBackendError(error: unknown): boolean {
  return classifyBackendFetchError(error) !== null;
}
