'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  clearSessionCache,
  getCachedSession,
  tryRecoverAuthSession,
} from '@/lib/auth-fetch';
import {
  getAuthProfileFromLocalStorage,
  syncAuthProfileFromSession,
} from '@/app/lib/auth-storage';
import { waitForAuthenticatedSession } from '@/lib/login-client';
import {
  clearJustLoggedOutFlag,
  performClientLogout,
  wasJustLoggedOut,
} from '@/lib/logout-client';
import { getLoginRedirectPath } from '@/app/lib/auth-guard';

type AuthGateState = 'loading' | 'allowed' | 'redirecting';

/**
 * Protects dashboard/app routes (mounted inside DashboardLayout).
 * Public homepage never mounts this guard.
 */
export function SessionAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [gate, setGate] = useState<AuthGateState>('loading');
  const [bootstrapReady, setBootstrapReady] = useState(false);
  const redirectingRef = useRef(false);
  const recoveryStartedRef = useRef(false);
  const authOpGenerationRef = useRef(0);

  useEffect(() => {
    authOpGenerationRef.current += 1;
    recoveryStartedRef.current = false;
    redirectingRef.current = false;
    setBootstrapReady(false);
    const timer = window.setTimeout(() => setBootstrapReady(true), 1200);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (redirectingRef.current) return;

    const generation = authOpGenerationRef.current;
    const isStale = () => authOpGenerationRef.current !== generation;

    const allowAccess = () => {
      if (redirectingRef.current) return;
      clearJustLoggedOutFlag();
      recoveryStartedRef.current = false;
      redirectingRef.current = false;
      setGate('allowed');
    };

    const redirectToLogin = async () => {
      if (isStale() || redirectingRef.current) return;
      if (await waitForAuthenticatedSession(1500)) {
        allowAccess();
        return;
      }
      if (isStale() || redirectingRef.current) return;
      redirectingRef.current = true;
      setGate('redirecting');
      clearSessionCache();
      router.replace(getLoginRedirectPath(pathname));
    };

    const refreshFailed =
      (session as { error?: string } | null)?.error === 'RefreshAccessTokenError';

    if (refreshFailed) {
      redirectingRef.current = true;
      setGate('redirecting');
      const refreshToken =
        (session as { refresh_token?: string } | null)?.refresh_token ?? null;
      void performClientLogout(refreshToken);
      return;
    }

    if (status === 'loading') {
      setGate('loading');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      authOpGenerationRef.current += 1;
      allowAccess();
      return;
    }

    if (wasJustLoggedOut()) {
      void redirectToLogin();
      return;
    }

    if (status === 'unauthenticated') {
      if (!bootstrapReady) {
        setGate('loading');
        return;
      }

      if (recoveryStartedRef.current) {
        setGate('loading');
        return;
      }

      recoveryStartedRef.current = true;
      setGate('loading');

      void (async () => {
        try {
          const quickSession = await getCachedSession();
          if (quickSession?.user) {
            if (!isStale()) allowAccess();
            return;
          }

          if (getAuthProfileFromLocalStorage()) {
            clearSessionCache();
            const recovered = await getCachedSession();
            if (recovered?.user) {
              if (!isStale()) allowAccess();
              return;
            }
          }

          const refreshed = await tryRecoverAuthSession();
          if (refreshed) {
            if (!isStale()) allowAccess();
            return;
          }

          if (await waitForAuthenticatedSession(4000)) {
            if (!isStale()) allowAccess();
            return;
          }

          if (isStale()) return;
          redirectingRef.current = true;
          setGate('redirecting');
          await performClientLogout(null);
        } finally {
          if (isStale()) {
            recoveryStartedRef.current = false;
          }
        }
      })();
      return;
    }

    setGate('loading');
  }, [bootstrapReady, pathname, router, session, status]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      syncAuthProfileFromSession(session);
    }
  }, [session, status]);

  if (gate !== 'allowed') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700 dark:border-slate-600 dark:border-t-slate-200"
          aria-hidden
        />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {gate === 'redirecting' ? 'Redirecting…' : 'Checking session…'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
