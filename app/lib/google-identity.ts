'use client';

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, unknown>
      ) => void;
      cancel: () => void;
    };
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: { access_token?: string; error?: string }) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
      }) => { requestAccessToken: (overrideConfig?: { prompt?: string }) => void };
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

let gsiPromise: Promise<void> | null = null;

export function getGoogleClientId(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim();
}

export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity is browser-only'));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gsiPromise) return gsiPromise;

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Identity script failed')));
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return gsiPromise;
}

/** Opens Google OAuth token popup and returns an access token for backend social-login. */
export async function requestGoogleAccessToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google sign-in is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID).');
  }
  await loadGoogleIdentityServices();
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services failed to initialize.');
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Google sign-in was cancelled.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error?.message || 'Google sign-in failed.'));
      },
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
}
