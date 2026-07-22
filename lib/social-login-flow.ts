'use client';

import { extractLoginErrorMessage, parseLoginResponse } from '@/lib/login-client';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { requestGoogleAccessToken, getGoogleClientId } from '@/app/lib/google-identity';
import { requestFacebookAccessToken, getFacebookAppId } from '@/app/lib/facebook-sdk';
import type { LoginFlowResult } from '@/lib/login-flow';

const SOCIAL_LOGIN_API = '/api/auth/social-login';

export type SocialProvider = 'GOOGLE' | 'FACEBOOK';

export function isGoogleSocialConfigured(): boolean {
  return Boolean(getGoogleClientId());
}

export function isFacebookSocialConfigured(): boolean {
  return Boolean(getFacebookAppId());
}

async function postSocialLogin(body: {
  provider: SocialProvider;
  idToken?: string;
  accessToken?: string;
  name?: string;
}): Promise<LoginFlowResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const xsrf = getXsrfToken();
  if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

  const res = await fetch(SOCIAL_LOGIN_API, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { message: text.slice(0, 300) };
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: extractLoginErrorMessage(data, res.status),
    };
  }

  const parsed = parseLoginResponse(data);
  if (!parsed?.accessToken) {
    return {
      ok: false,
      status: 502,
      message: 'Social login succeeded but no access token was returned.',
    };
  }

  return { ok: true, data };
}

export async function runGoogleSocialLogin(): Promise<LoginFlowResult> {
  try {
    const accessToken = await requestGoogleAccessToken();
    return postSocialLogin({ provider: 'GOOGLE', accessToken });
  } catch (err) {
    return {
      ok: false,
      status: 400,
      message: err instanceof Error ? err.message : 'Google sign-in failed.',
    };
  }
}

export async function runFacebookSocialLogin(): Promise<LoginFlowResult> {
  try {
    const accessToken = await requestFacebookAccessToken();
    return postSocialLogin({ provider: 'FACEBOOK', accessToken });
  } catch (err) {
    return {
      ok: false,
      status: 400,
      message: err instanceof Error ? err.message : 'Facebook sign-in failed.',
    };
  }
}
