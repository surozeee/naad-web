'use client';

import {
  authProfileFromLoginUser,
  authProfileFromUserApi,
  saveAuthProfileToLocalStorage,
} from '@/app/lib/auth-storage';
import { resolvePostLoginRedirect } from '@/app/lib/login-redirect';
import { getProfile } from '@/app/lib/profile.service';
import { parseLoginResponse, waitForAuthenticatedSession } from '@/lib/login-client';
import { clearSessionCache } from '@/lib/auth-fetch';

export async function completeAuthSessionAndRedirect(
  loginResultData: unknown,
  redirectAfterLogin = '/dashboard'
): Promise<string | null> {
  const parsed = parseLoginResponse(loginResultData);
  if (!parsed?.accessToken) return 'Login failed';

  clearSessionCache();
  const sessionVisible =
    parsed.sessionReady || (await waitForAuthenticatedSession(5000));
  if (!sessionVisible) return 'Session could not be established. Please try again.';

  let authProfile = authProfileFromLoginUser(parsed.user);
  try {
    const apiProfile = await getProfile();
    if (apiProfile) authProfile = authProfileFromUserApi(apiProfile);
  } catch {
    /* keep login payload */
  }

  saveAuthProfileToLocalStorage(authProfile);
  window.location.assign(
    resolvePostLoginRedirect(authProfile.userType, authProfile.role, redirectAfterLogin)
  );
  return null;
}
