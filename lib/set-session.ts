/**
 * Create NextAuth session cookie(s) without going through the CSRF flow.
 * Used by /api/auth/login and /api/auth/refresh to set the session so the
 * client never needs to call getCsrfToken() or signIn() for credentials.
 */

import { encode } from 'next-auth/jwt';
import {
  authOptions,
  sessionTokenCookieName,
  sessionTokenCookieSecure,
} from '@/lib/auth';
import { effectiveSessionMaxSeconds } from '@/lib/auth-tokens';

const CHUNK_SIZE = 4096 - 163; // same as NextAuth SessionStore

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  userType?: string | null;
  roleType?: string | null;
  role?: string | null;
  roles?: string[];
  /** Omit from JWT cookie — full list is stored in localStorage after login. */
  permissions?: string[];
  companyId?: string | null;
  branchId?: string | null;
  companyName?: string | null;
  branchName?: string | null;
  employeeId?: string | null;
  tenantId?: string | null;
  access_token: string;
  refresh_token: string;
  /** Session cookie max-age from API refreshExpiresIn / sessionMaxSeconds. */
  sessionMaxAgeSeconds?: number;
  /** Wall-clock ms — access token expiry (from API expiresIn). */
  accessTokenExpires?: number;
  /** Wall-clock ms — refresh token expiry (from API refreshExpiresIn). */
  refreshTokenExpires?: number;
}

function resolveCookieMaxAgeSeconds(user: SessionUser): number {
  if (
    typeof user.sessionMaxAgeSeconds === 'number' &&
    Number.isFinite(user.sessionMaxAgeSeconds) &&
    user.sessionMaxAgeSeconds > 0
  ) {
    return Math.floor(user.sessionMaxAgeSeconds);
  }
  if (
    typeof user.refreshTokenExpires === 'number' &&
    Number.isFinite(user.refreshTokenExpires)
  ) {
    const remaining = Math.floor((user.refreshTokenExpires - Date.now()) / 1000);
    if (remaining > 0) return remaining;
  }
  return effectiveSessionMaxSeconds();
}

/** Keep HttpOnly session JWT under browser cookie limits (~4KB per chunk). */
export function compactUserForSessionCookie(user: SessionUser): SessionUser {
  return {
    ...user,
    permissions: undefined,
    roles: undefined,
  };
}

export async function createSessionCookieHeaders(user: SessionUser): Promise<string[]> {
  const secret = authOptions.secret;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required to create session');
  }
  const cookieUser = compactUserForSessionCookie(user);
  const sessionMaxAge = resolveCookieMaxAgeSeconds(cookieUser);
  const secure = sessionTokenCookieSecure();
  const cookieConfig = authOptions.cookies?.sessionToken ?? {
    name: sessionTokenCookieName(),
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure,
      maxAge: sessionMaxAge,
    },
  };

  const defaultToken = {
    name: cookieUser.name ?? cookieUser.email,
    email: cookieUser.email,
    picture: null,
    sub: String(cookieUser.id),
  };
  const account = {
    providerAccountId: cookieUser.id,
    type: 'credentials' as const,
    provider: 'credentials',
  };
  const token = await authOptions.callbacks?.jwt?.({
    token: defaultToken,
    user: cookieUser as Parameters<NonNullable<typeof authOptions.callbacks.jwt>>[0]['user'],
    account,
    isNewUser: false,
    trigger: 'signIn',
  });
  const resolvedToken = token ?? defaultToken;
  const finalToken = {
    ...resolvedToken,
    access_token: (resolvedToken as { access_token?: string }).access_token ?? cookieUser.access_token,
    refresh_token: (resolvedToken as { refresh_token?: string }).refresh_token ?? cookieUser.refresh_token,
    id: (resolvedToken as { id?: string }).id ?? cookieUser.id,
    userType:
      (resolvedToken as { userType?: string | null }).userType ??
      cookieUser.userType ??
      cookieUser.roleType ??
      null,
    roleType: (resolvedToken as { roleType?: string | null }).roleType ?? cookieUser.roleType ?? null,
    role: (resolvedToken as { role?: string | null }).role ?? cookieUser.role ?? null,
    roles: (resolvedToken as { roles?: string[] }).roles ?? cookieUser.roles,
    companyId: (resolvedToken as { companyId?: string | null }).companyId ?? cookieUser.companyId ?? null,
    branchId: (resolvedToken as { branchId?: string | null }).branchId ?? cookieUser.branchId ?? null,
    companyName: (resolvedToken as { companyName?: string | null }).companyName ?? cookieUser.companyName ?? null,
    branchName: (resolvedToken as { branchName?: string | null }).branchName ?? cookieUser.branchName ?? null,
    employeeId: (resolvedToken as { employeeId?: string | null }).employeeId ?? cookieUser.employeeId ?? null,
    tenantId: (resolvedToken as { tenantId?: string | null }).tenantId ?? cookieUser.tenantId ?? null,
    ...(cookieUser.accessTokenExpires != null ? { accessTokenExpires: cookieUser.accessTokenExpires } : {}),
    ...(cookieUser.refreshTokenExpires != null ? { refreshTokenExpires: cookieUser.refreshTokenExpires } : {}),
  };

  const encoded = await encode({
    token: finalToken,
    secret,
    maxAge: sessionMaxAge,
  });

  const expires = new Date();
  expires.setTime(expires.getTime() + sessionMaxAge * 1000);
  const options = {
    ...cookieConfig.options,
    secure,
    expires,
  };

  const cookieStrings: string[] = [];
  if (encoded.length <= CHUNK_SIZE) {
    cookieStrings.push(
      `${cookieConfig.name}=${encodeURIComponent(encoded)}; Path=${options.path ?? '/'}; HttpOnly; SameSite=Lax${options.secure ? '; Secure' : ''}; Expires=${expires.toUTCString()}; Max-Age=${sessionMaxAge}`
    );
  } else {
    const chunkCount = Math.ceil(encoded.length / CHUNK_SIZE);
    for (let i = 0; i < chunkCount; i++) {
      const name = `${cookieConfig.name}.${i}`;
      const value = encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      cookieStrings.push(
        `${name}=${encodeURIComponent(value)}; Path=${options.path ?? '/'}; HttpOnly; SameSite=Lax${options.secure ? '; Secure' : ''}; Expires=${expires.toUTCString()}; Max-Age=${sessionMaxAge}`
      );
    }
  }
  return cookieStrings;
}
