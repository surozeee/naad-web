'use client';

import { getSession } from 'next-auth/react';
import { clearSessionCache } from '@/lib/auth-fetch';
import { parseAuthApiPayload } from '@/lib/auth-tokens';

function isHtmlBlob(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('/_next/static')
  );
}

function sanitizeMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isHtmlBlob(trimmed)) return null;
  return trimmed;
}

export function extractLoginErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message = record.message ?? record.error;
    if (typeof message === 'string') {
      const clean = sanitizeMessage(message);
      if (clean) {
        // Next.js / Turbopack crash surfaces as generic 500 text — give a usable hint.
        if (
          status >= 500 &&
          (/^internal server error$/i.test(clean) || /^an error occurred/i.test(clean))
        ) {
          return (
            'Login service crashed (HTTP 500). Restart the Next.js app after running npm run clean ' +
            '(Turbopack cache under .next is often corrupted).'
          );
        }
        return clean;
      }
    }
    const hint = record.hint;
    if (typeof hint === 'string') {
      const clean = sanitizeMessage(hint);
      if (clean) return clean;
    }
    const nested = record.data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const inner = (nested as Record<string, unknown>).message;
      if (typeof inner === 'string') {
        const clean = sanitizeMessage(inner);
        if (clean) return clean;
      }
    }
    if (status === 502) {
      const code = typeof record.code === 'string' ? record.code : '';
      if (code === 'API_NOT_CONFIGURED') {
        return 'Server API URL is not configured. Contact your administrator.';
      }
      if (code === 'API_PROXY_FAILED') {
        return 'Could not reach the API from the web server. Check API_INTERNAL_URL.';
      }
      return 'API gateway error (502). The web server could not reach the login service.';
    }
    if (status === 503) {
      return 'Login service is temporarily unavailable. Please try again in a moment.';
    }
    if (status === 500) {
      const code = typeof record.code === 'string' ? record.code : '';
      if (code === 'SESSION_COOKIE_FAILED') {
        return 'Could not create login session. Ensure NEXTAUTH_SECRET is set, then restart the app.';
      }
    }
  }
  if (status === 404) {
    return 'Login API route was not found on this server. Restart the Next.js app (try npm run clean && npm run dev).';
  }
  if (status === 502) {
    return 'API gateway error (502). The web server could not reach the login service.';
  }
  if (status === 500) {
    return (
      'Login failed (HTTP 500). Run npm run clean, restart the server, and confirm NEXTAUTH_SECRET is set.'
    );
  }
  if (status === 401) {
    return 'Invalid email or password.';
  }
  return `Login failed (HTTP ${status}). Check the browser Network tab for details.`;
}

export function parseLoginResponse(data: unknown): {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
  sessionReady: boolean;
} | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const parsed = parseAuthApiPayload(data);
  const bag =
    record.data != null && typeof record.data === 'object' && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : record;
  const user =
    bag.user != null && typeof bag.user === 'object' && !Array.isArray(bag.user)
      ? (bag.user as Record<string, unknown>)
      : record.user != null && typeof record.user === 'object' && !Array.isArray(record.user)
        ? (record.user as Record<string, unknown>)
        : {};
  const accessToken = parsed?.access_token ?? '';
  const refreshToken = parsed?.refresh_token ?? '';
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken,
    user,
    sessionReady: record.sessionReady === true,
  };
}

/** Normalize app paths so `/Dashboard` and similar variants resolve correctly. */
export function normalizeAppCallbackPath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return trimmed;
  const queryIndex = trimmed.indexOf('?');
  const pathname = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  const search = queryIndex >= 0 ? trimmed.slice(queryIndex) : '';
  if (pathname.toLowerCase() === '/dashboard') {
    return `/dashboard${search}`;
  }
  return trimmed;
}

export function isProtectedAppPath(href: string): boolean {
  const path = href.split('?')[0].split('#')[0].trim();
  if (!path || path === '/') return false;
  if (path.startsWith('/public')) return false;
  if (path.startsWith('/api')) return false;
  return true;
}

export function resolveSafeCallbackUrl(raw?: string | null): string {
  const fallback = '/dashboard';
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  return normalizeAppCallbackPath(trimmed);
}

export function setLoginCallbackOnHomepage(targetPath: string): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  params.set('callbackUrl', normalizeAppCallbackPath(targetPath));
  const next = `/?${params.toString()}`;
  window.history.replaceState(null, '', next);
}

export function clearLoginCallbackFromHomepage(): void {
  if (typeof window === 'undefined') return;
  if (!readCallbackUrlFromLocation()) return;
  window.history.replaceState(null, '', '/');
}

/** HttpOnly session cookies are not visible in document.cookie — prefer session API polling. */
export function hasNextAuthSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)next-auth\.session-token(?:\.|$)/.test(document.cookie);
}

let serverSessionUserInFlight: Promise<boolean> | null = null;
let serverSessionUserCache: { value: boolean; timestamp: number } | null = null;
const SERVER_SESSION_USER_CACHE_MS = 3000;

export function clearServerSessionUserCache(): void {
  serverSessionUserInFlight = null;
  serverSessionUserCache = null;
}

export async function fetchServerSessionUser(): Promise<boolean> {
  const now = Date.now();
  if (serverSessionUserCache && now - serverSessionUserCache.timestamp < SERVER_SESSION_USER_CACHE_MS) {
    return serverSessionUserCache.value;
  }
  if (serverSessionUserInFlight) return serverSessionUserInFlight;

  serverSessionUserInFlight = (async () => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return false;
      const data = (await res.json().catch(() => null)) as { user?: unknown } | null;
      return Boolean(data?.user);
    } catch {
      return false;
    }
  })()
    .then((value) => {
      serverSessionUserCache = { value, timestamp: Date.now() };
      return value;
    })
    .finally(() => {
      serverSessionUserInFlight = null;
    });

  return serverSessionUserInFlight;
}

export async function refreshClientSession(): Promise<boolean> {
  clearSessionCache();
  clearServerSessionUserCache();
  if (await fetchServerSessionUser()) {
    const session = await getSession();
    return Boolean(session?.user);
  }
  const session = await getSession();
  return Boolean(session?.user);
}

export async function hasAuthenticatedSession(): Promise<boolean> {
  if (await fetchServerSessionUser()) return true;
  clearSessionCache();
  const session = await getSession();
  return Boolean(session?.user);
}

export async function waitForAuthenticatedSession(maxMs = 5000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (await hasAuthenticatedSession()) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

export function readCallbackUrlFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('callbackUrl');
}
