'use client';

type FacebookAuthResponse = {
  accessToken?: string;
  userID?: string;
};

type FacebookLoginResponse = {
  status: string;
  authResponse?: FacebookAuthResponse | null;
};

type FacebookSdk = {
  init: (config: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope?: string; return_scopes?: boolean }
  ) => void;
  getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
};

declare global {
  interface Window {
    FB?: FacebookSdk;
    fbAsyncInit?: () => void;
  }
}

let fbPromise: Promise<void> | null = null;

export function getFacebookAppId(): string {
  return (process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '').trim();
}

export function loadFacebookSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Facebook SDK is browser-only'));
  }
  const appId = getFacebookAppId();
  if (!appId) {
    return Promise.reject(new Error('Facebook sign-in is not configured (NEXT_PUBLIC_FACEBOOK_APP_ID).'));
  }
  if (window.FB) return Promise.resolve();
  if (fbPromise) return fbPromise;

  fbPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      try {
        window.FB?.init({
          appId,
          cookie: true,
          xfbml: false,
          version: 'v18.0',
        });
        resolve();
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Facebook SDK init failed'));
      }
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) {
      if (window.FB) resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.body.appendChild(script);
  });

  return fbPromise;
}

export async function requestFacebookAccessToken(): Promise<string> {
  await loadFacebookSdk();
  if (!window.FB) {
    throw new Error('Facebook SDK failed to initialize.');
  }

  return new Promise((resolve, reject) => {
    window.FB!.login(
      (response) => {
        const token = response.authResponse?.accessToken;
        if (response.status === 'connected' && token) {
          resolve(token);
          return;
        }
        reject(new Error('Facebook sign-in was cancelled or denied.'));
      },
      { scope: 'email,public_profile', return_scopes: true }
    );
  });
}
