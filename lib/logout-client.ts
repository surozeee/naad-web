'use client';

import { signOut } from 'next-auth/react';
import { clearSessionCache } from '@/lib/auth-fetch';
import { clearAllClientStorage } from '@/lib/client-storage-wipe';
import { clearServerSessionUserCache } from '@/lib/login-client';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { clearAuthProfileFromLocalStorage } from '@/app/lib/auth-storage';
import { clearAuthAccessExpiry } from '@/app/lib/auth-session';

const LOGOUT_FLAG_KEY = 'naad_just_logged_out';
const LOGOUT_FLAG_TTL_MS = 20000;

let freshLoginRedirectInFlight = false;

export function wasJustLoggedOut(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(LOGOUT_FLAG_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || Date.now() - ts > LOGOUT_FLAG_TTL_MS) {
    sessionStorage.removeItem(LOGOUT_FLAG_KEY);
    return false;
  }
  return true;
}

export function clearJustLoggedOutFlag(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LOGOUT_FLAG_KEY);
}

export function shouldOpenLoginFromHomeUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('login') === '1';
}

async function resetAuthState(refreshToken?: string | null): Promise<void> {
  clearSessionCache();
  clearServerSessionUserCache();
  clearAuthAccessExpiry();
  clearAuthProfileFromLocalStorage();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const xsrf = getXsrfToken();
  if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
  } catch {
    /* still clear local state */
  }

  try {
    await signOut({ redirect: false });
  } catch {
    /* logout API clears HttpOnly session cookies when signOut fails */
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
}

export async function forceFreshLoginRedirect(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (freshLoginRedirectInFlight) return;
  if (shouldOpenLoginFromHomeUrl() || wasJustLoggedOut()) return;

  freshLoginRedirectInFlight = true;
  try {
    await resetAuthState();
    sessionStorage.setItem(LOGOUT_FLAG_KEY, String(Date.now()));
    window.location.replace('/?login=1');
  } finally {
    freshLoginRedirectInFlight = false;
  }
}

export async function performClientLogout(refreshToken?: string | null): Promise<void> {
  await resetAuthState(refreshToken);
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(LOGOUT_FLAG_KEY, String(Date.now()));
    window.location.replace('/');
  }
}
