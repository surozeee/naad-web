'use client';

import { useEffect } from 'react';

/**
 * Fetches XSRF token on app load so X-XSRF-TOKEN is available for all API calls (e.g. /api/master/*).
 * Stores token in sessionStorage so getXsrfToken() and fetchWithAuth can send it.
 */
export default function CsrfBootstrap() {
  useEffect(() => {
    fetch('/api/csrf-token', { credentials: 'same-origin' })
      .then((res) => res.json().catch(() => ({})))
      .then((data: { token?: string }) => {
        if (data?.token && typeof data.token === 'string') {
          try {
            sessionStorage.setItem('xsrf_token', data.token.trim());
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, []);
  return null;
}
