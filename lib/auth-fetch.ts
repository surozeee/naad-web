'use client';

import { getSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { isAccessTokenExpired, parseAuthApiPayload } from '@/lib/auth-tokens';
import { AuthSessionExpiredError } from '@/lib/auth-session-expired';
import { clearAllClientStorage } from '@/lib/client-storage-wipe';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { getStoredUiLanguage } from '@/app/lib/ui-language';
import { clearAuthAccessExpiry } from '@/app/lib/auth-session';
import { clearAuthProfileFromLocalStorage } from '@/app/lib/auth-storage';

const REFRESH_ENDPOINT = '/api/auth/refresh';
const LOGOUT_ENDPOINT = '/api/auth/logout';
const CSRF_TOKEN_API = '/api/csrf-token';
const HOMEPAGE = '/';

type AuthSession = Session & {
  access_token?: string;
  refresh_token?: string;
  accessTokenExpires?: number;
  refreshTokenExpires?: number;
};

export interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
  /** When true, 401 / failed refresh does not trigger global logout. */
  ignoreAuthFailure?: boolean;
}

/** Alias options used by existing naad services. */
export type FetchWithAuthOptions = AuthFetchOptions;

let logoutRedirectInFlight: Promise<void> | null = null;
let isRefreshing = false;
let refreshPromise: Promise<{ access_token: string; refresh_token: string } | null> | null = null;

let sessionPromise: Promise<Session | null> | null = null;
const SESSION_RESULT_CACHE_MS = 3000;
let sessionResultCache: { value: Session | null; timestamp: number } | null = null;

export function getCachedSession(): Promise<Session | null> {
  const now = Date.now();
  if (sessionResultCache && now - sessionResultCache.timestamp < SESSION_RESULT_CACHE_MS) {
    return Promise.resolve(sessionResultCache.value);
  }
  if (sessionPromise) return sessionPromise;
  sessionPromise = getSession();
  sessionPromise
    .then((s) => {
      sessionResultCache = { value: s, timestamp: Date.now() };
    })
    .finally(() => {
      sessionPromise = null;
    });
  return sessionPromise;
}

export function clearSessionCache(): void {
  sessionPromise = null;
  sessionResultCache = null;
}

async function doRefresh(
  refresh_token: string,
  currentUser: { id?: string; email?: string | null; name?: string | null }
): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const xsrf = getXsrfToken();
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;
    const uid = String(currentUser.id ?? '').trim();
    const uemail = String(currentUser.email ?? '').trim();
    const res = await fetch(REFRESH_ENDPOINT, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        refreshToken: refresh_token,
        id: uid || uemail,
        email: uemail || uid,
        name: currentUser.name ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const parsed = parseAuthApiPayload(data);
    if (!parsed?.access_token) return null;
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token || refresh_token,
    };
  } catch {
    return null;
  }
}

async function logoutAndRedirect(refreshToken?: string | null): Promise<void> {
  if (logoutRedirectInFlight) {
    await logoutRedirectInFlight;
    return;
  }

  logoutRedirectInFlight = (async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const xsrf = getXsrfToken();
      if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;
      await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
    } catch {
      /* continue */
    }
    clearSessionCache();
    clearAuthAccessExpiry();
    clearAuthProfileFromLocalStorage();
    try {
      await signOut({ redirect: false });
    } catch {
      /* ignore */
    }
    let theme: string | null = null;
    let language: string | null = null;
    try {
      theme = localStorage.getItem('theme');
      language = localStorage.getItem('uiLanguage');
    } catch {
      /* ignore */
    }
    clearAllClientStorage({ theme, language });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('naad_just_logged_out', String(Date.now()));
      const path = window.location.pathname || '/';
      if (path === '/' || path === '') return;
      window.location.replace(HOMEPAGE);
    }
  })();

  try {
    await logoutRedirectInFlight;
  } finally {
    logoutRedirectInFlight = null;
  }
}

async function finalizeAuthFailure(refreshToken?: string | null): Promise<never> {
  await logoutAndRedirect(refreshToken);
  throw new AuthSessionExpiredError();
}

async function refreshAndUpdateSession(
  refresh_token: string,
  currentUser: { id?: string; email?: string | null; name?: string | null }
): Promise<{ access_token: string; refresh_token: string } | null> {
  const tokens = await doRefresh(refresh_token, currentUser);
  if (!tokens?.access_token) return null;
  clearSessionCache();
  await getSession();
  return tokens;
}

async function ensureFreshAccessToken(session: AuthSession | null): Promise<AuthSession | null> {
  if (!session?.refresh_token) return session;
  if (session.accessTokenExpires == null) return session;
  if (!isAccessTokenExpired(session.accessTokenExpires)) return session;

  if (isRefreshing && refreshPromise) {
    const tokens = await refreshPromise;
    if (!tokens) return null;
    clearSessionCache();
    return (await getSession()) as AuthSession | null;
  }

  isRefreshing = true;
  refreshPromise = refreshAndUpdateSession(session.refresh_token, session.user ?? {});
  const tokens = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;

  if (!tokens) return null;
  return (await getSession()) as AuthSession | null;
}

export async function tryRecoverAuthSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  clearSessionCache();
  const session = (await getSession()) as AuthSession | null;
  const refresh_token = session?.refresh_token?.trim();
  if (!refresh_token) return false;

  if (isRefreshing && refreshPromise) {
    const tokens = await refreshPromise;
    if (!tokens?.access_token) return false;
    clearSessionCache();
    const recovered = (await getSession()) as AuthSession | null;
    return Boolean(recovered?.user);
  }

  isRefreshing = true;
  refreshPromise = refreshAndUpdateSession(refresh_token, session?.user ?? {});
  const tokens = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;

  if (!tokens?.access_token) return false;
  clearSessionCache();
  const recovered = (await getSession()) as AuthSession | null;
  return Boolean(recovered?.user);
}

/**
 * Authenticated fetch: Bearer from NextAuth session; refresh on expiry/401.
 * Refresh failure → clear cookies/session and logout immediately.
 */
export async function authFetch(
  input: RequestInfo | URL,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, skipRefresh = false, ignoreAuthFailure = false, ...init } = options;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  let xsrf = getXsrfToken();
  if (!xsrf && url.startsWith('/api/') && !url.startsWith(CSRF_TOKEN_API)) {
    try {
      const csrfRes = await fetch(CSRF_TOKEN_API, { credentials: 'same-origin' });
      const data = (await csrfRes.json().catch(() => ({}))) as { token?: string };
      if (data?.token && typeof data.token === 'string') {
        try {
          sessionStorage.setItem('xsrf_token', data.token.trim());
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
    xsrf = getXsrfToken();
  }

  let session: AuthSession | null = skipAuth ? null : ((await getCachedSession()) as AuthSession | null);
  const isRefreshEndpoint = url.includes(REFRESH_ENDPOINT);

  if (!skipAuth && !skipRefresh && !isRefreshEndpoint && session) {
    const fresh = await ensureFreshAccessToken(session);
    if (fresh === null) {
      if (!ignoreAuthFailure) await finalizeAuthFailure(session.refresh_token);
      return new Response(JSON.stringify({ message: 'Session expired' }), { status: 401 });
    }
    session = fresh;
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', '*/*');
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getStoredUiLanguage());
  }
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (session?.access_token && !skipAuth) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);

  let res = await fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  });

  if (res.status !== 401 || skipAuth || skipRefresh || isRefreshEndpoint || ignoreAuthFailure) {
    return res;
  }

  const refresh_token = session?.refresh_token;
  if (!refresh_token) {
    await finalizeAuthFailure(null);
  }

  if (isRefreshing && refreshPromise) {
    const tokens = await refreshPromise;
    if (!tokens) await finalizeAuthFailure(refresh_token);
  } else {
    isRefreshing = true;
    refreshPromise = refreshAndUpdateSession(refresh_token!, session?.user ?? {});
    const tokens = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;
    if (!tokens) await finalizeAuthFailure(refresh_token);
  }

  const freshSession = (await getCachedSession()) as AuthSession | null;
  const retryHeaders = new Headers(init.headers);
  if (!retryHeaders.has('Accept')) retryHeaders.set('Accept', '*/*');
  if (!retryHeaders.has('Accept-Language')) {
    retryHeaders.set('Accept-Language', getStoredUiLanguage());
  }
  if (!retryHeaders.has('Content-Type') && !(init.body instanceof FormData)) {
    retryHeaders.set('Content-Type', 'application/json');
  }
  if (freshSession?.access_token) {
    retryHeaders.set('Authorization', `Bearer ${freshSession.access_token}`);
  }
  if (xsrf) retryHeaders.set('X-XSRF-TOKEN', xsrf);

  res = await fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers: retryHeaders,
  });

  if (res.status === 401 && !ignoreAuthFailure) {
    await finalizeAuthFailure(freshSession?.refresh_token);
  }

  return res;
}

/** Backward-compatible alias used across naad services. */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: FetchWithAuthOptions
): Promise<Response> {
  return authFetch(input, init ?? {});
}
