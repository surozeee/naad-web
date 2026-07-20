import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {
  accessTokenExpiresAtMs,
  isAccessTokenExpired,
  parseAuthApiPayload,
  jwtSubFromAccessToken,
  laterRefreshTokenExpiresMs,
  refreshTokenExpiresAtMs,
  effectiveSessionMaxSeconds,
} from '@/lib/auth-tokens';
import { refreshTokensWithBackend } from '@/lib/server-refresh-token';
import { getServerApiBase } from '@/lib/server-api-base';
import { inferUserTypeFromRoleName } from '@/app/lib/menu-role';
import { serverFetch } from '@/lib/server-fetch';

export interface LoginApiUser {
  id?: string;
  userId?: string;
  employeeId?: string;
  employee_id?: string;
  email?: string;
  mobileNumber?: string;
  name?: string | null;
  role?: string;
  companyId?: string;
  company_id?: string;
  branchId?: string;
  branch_id?: string;
  companyName?: string;
  company_name?: string;
  branchName?: string;
  branch_name?: string;
  tenantId?: string;
  tenant_id?: string;
  roles?: string[];
  permissions?: string[];
}

export interface LoginApiResponse {
  status?: string;
  code?: string;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
    tokenType?: string;
    expiresIn?: number;
    expires_in?: number;
    refreshExpiresIn?: number;
    refresh_expires_in?: number;
    sessionMaxSeconds?: number;
    session_max_seconds?: number;
    user?: LoginApiUser;
  };
  access_token?: string;
  refresh_token?: string;
  user?: LoginApiUser;
}

/** Session cookie max-age for NextAuth config (env, else default; API refresh TTL applied per login in set-session). */
export function sessionMaxSeconds(): number {
  return effectiveSessionMaxSeconds();
}

/** Keep authOptions + set-session cookie names identical (HTTPS uses __Secure- prefix). */
export function sessionTokenCookieName(): string {
  const url = process.env.NEXTAUTH_URL?.trim() ?? '';
  const secure =
    url.startsWith('https://') ||
    process.env.NODE_ENV === 'production';
  return secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
}

export function sessionTokenCookieSecure(): boolean {
  const url = process.env.NEXTAUTH_URL?.trim() ?? '';
  return url.startsWith('https://') || process.env.NODE_ENV === 'production';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        access_token: { label: 'Access Token', type: 'text' },
        refresh_token: { label: 'Refresh Token', type: 'text' },
        id: { label: 'User ID', type: 'text' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        const hasTokenRefresh =
          credentials?.access_token &&
          credentials?.refresh_token &&
          !credentials?.password;

        if (hasTokenRefresh) {
          return {
            id: (credentials.id as string) || 'refreshed',
            email: (credentials.email as string) || '',
            name: (credentials.name as string) || 'User',
            access_token: credentials.access_token as string,
            refresh_token: credentials.refresh_token as string,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const API_BASE = getServerApiBase();
        const loginUrl = `${API_BASE}/api/v2/public/user/login`;
        try {
          let cookieHeader = '';
          let xsrfToken = '';
          const parseSetCookies = (response: Response): void => {
            const setCookies =
              typeof response.headers.getSetCookie === 'function'
                ? response.headers.getSetCookie()
                : response.headers.get('set-cookie')
                  ? [response.headers.get('set-cookie')!]
                  : [];
            const cookiePairs: string[] = [];
            for (const raw of setCookies) {
              const eq = raw.indexOf('=');
              if (eq === -1) continue;
              const name = raw.slice(0, eq).trim();
              const valuePart = raw.slice(eq + 1);
              const semicolon = valuePart.indexOf(';');
              const value = (semicolon === -1 ? valuePart : valuePart.slice(0, semicolon)).trim();
              cookiePairs.push(`${name}=${value}`);
              if (/^[Xx][Ss][Rr][Ff]/i.test(name) && value) {
                xsrfToken = value;
              }
            }
            if (cookiePairs.length) cookieHeader = cookiePairs.join('; ');
          };
          try {
            const pre = await serverFetch(`${API_BASE}/api/v2/public`, {
              method: 'GET',
              redirect: 'manual',
            });
            parseSetCookies(pre);
          } catch {
            // ignore preflight failure
          }

          const headers: Record<string, string> = {
            accept: '*/*',
            'Content-Type': 'application/json',
          };
          const xsrf = process.env.NEXTAUTH_XSRF_TOKEN || xsrfToken;
          if (xsrf) {
            headers['X-XSRF-TOKEN'] = xsrf;
            const xsrfCookie = `XSRF-TOKEN=${xsrf}`;
            headers['Cookie'] = cookieHeader ? `${cookieHeader}; ${xsrfCookie}` : xsrfCookie;
          } else if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
          }

          const res = await serverFetch(loginUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            const message =
              (err?.message as string) ??
              (err?.error as string) ??
              (err?.data && typeof err.data === 'object' && (err.data as Record<string, string>).message) ??
              (err?.msg as string) ??
              `Login failed (${res.status})`;
            console.error('[Auth] Login API error:', res.status, message, err);
            if (res.status >= 500) {
              throw new Error('Something went wrong. Please try again later.');
            }
            throw new Error(String(message));
          }

          const data = (await res.json()) as LoginApiResponse;
          const parsed = parseAuthApiPayload(data);
          const user = data.data?.user ?? data.user ?? {};

          if (!parsed?.access_token) {
            console.error('[Auth] Login API error: No access token in response', data);
            throw new Error('Something went wrong. Please try again later.');
          }

          const sub = jwtSubFromAccessToken(parsed.access_token);
          const role = user.role ?? user.roles?.[0] ?? null;
          const resolvedUserType = inferUserTypeFromRoleName(role) ?? null;
          const userId = user.userId ?? user.id ?? sub ?? credentials.email;
          const employeeId = user.employeeId ?? user.employee_id ?? null;
          return {
            id: userId,
            email: user.email ?? credentials.email,
            name: user.name ?? user.email ?? credentials.email ?? 'User',
            userType: resolvedUserType,
            roleType: resolvedUserType,
            role,
            roles: user.roles,
            permissions: user.permissions,
            companyId: user.companyId ?? user.company_id ?? null,
            branchId: user.branchId ?? user.branch_id ?? null,
            companyName: user.companyName ?? user.company_name ?? null,
            branchName: user.branchName ?? user.branch_name ?? null,
            employeeId,
            tenantId: user.tenantId ?? user.tenant_id ?? null,
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
            accessTokenExpires: accessTokenExpiresAtMs(parsed.accessExpiresIn),
            refreshTokenExpires: refreshTokenExpiresAtMs(parsed.refreshExpiresIn),
          };
        } catch (error) {
          const cause = (error as { cause?: { code?: string } })?.cause;
          const isConnectionError =
            (error instanceof TypeError && cause?.code === 'ECONNREFUSED') ||
            (error instanceof Error && /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(error.message));
          if (isConnectionError) {
            console.error(
              '[Auth] Cannot reach login service at',
              loginUrl,
              '— ensure the backend is running and BACKEND_URL / NEXT_PUBLIC_API_URL is correct.',
              error
            );
            throw new Error('Something went wrong. Please try again later.');
          }
          console.error('[Auth] Login API error:', error);
          throw new Error('Something went wrong. Please try again later.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          access_token?: string;
          refresh_token?: string;
          accessTokenExpires?: number;
          refreshTokenExpires?: number;
          userType?: string | null;
          roleType?: string | null;
          role?: string | null;
          roles?: string[];
          permissions?: string[];
          companyId?: string | null;
          branchId?: string | null;
          companyName?: string | null;
          branchName?: string | null;
          employeeId?: string | null;
          tenantId?: string | null;
        };
        token.access_token = u.access_token;
        token.refresh_token = u.refresh_token;
        token.id = user.id;
        token.userType = u.userType ?? u.roleType ?? null;
        token.roleType = u.roleType ?? null;
        token.role = u.role ?? null;
        token.roles = u.roles;
        delete token.permissions;
        token.companyId = u.companyId ?? null;
        token.branchId = u.branchId ?? null;
        token.companyName = u.companyName ?? null;
        token.branchName = u.branchName ?? null;
        token.employeeId = u.employeeId ?? null;
        token.tenantId = u.tenantId ?? null;
        if (u.accessTokenExpires != null) token.accessTokenExpires = u.accessTokenExpires;
        if (u.refreshTokenExpires != null) token.refreshTokenExpires = u.refreshTokenExpires;
        delete token.error;
        return token;
      }

      if (token.error === 'RefreshAccessTokenError') {
        return token;
      }

      if (!isAccessTokenExpired(token.accessTokenExpires as number | undefined)) {
        return token;
      }

      const refreshToken = token.refresh_token as string | undefined;
      if (!refreshToken?.trim()) {
        return token;
      }

      const refreshed = await refreshTokensWithBackend(refreshToken);
      if (!refreshed) {
        return {
          ...token,
          error: 'RefreshAccessTokenError',
          access_token: undefined,
          refresh_token: undefined,
          accessTokenExpires: undefined,
          refreshTokenExpires: undefined,
        };
      }

      token.access_token = refreshed.access_token;
      token.refresh_token = refreshed.refresh_token || refreshToken;
      const accessExp = accessTokenExpiresAtMs(refreshed.accessExpiresIn);
      if (accessExp != null) {
        token.accessTokenExpires = accessExp;
      } else {
        delete token.accessTokenExpires;
      }
      if (refreshed.refreshExpiresIn != null) {
        token.refreshTokenExpires = laterRefreshTokenExpiresMs(
          token.refreshTokenExpires as number | undefined,
          refreshed.refreshExpiresIn
        );
      }
      delete token.error;
      return token;
    },
    async session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError') {
        return {
          ...session,
          user: undefined,
          expires: '1970-01-01',
          error: 'RefreshAccessTokenError',
          access_token: undefined,
          refresh_token: undefined,
        };
      }
      if (session?.user && token) {
        session.user.id = (token.id as string) ?? undefined;
        session.user.userType =
          (token.userType as string | null | undefined) ??
          (token.roleType as string | null | undefined) ??
          null;
        session.user.roleType = (token.roleType as string | null | undefined) ?? null;
        session.user.role = (token.role as string | null | undefined) ?? null;
        session.user.roles = token.roles;
        if (Array.isArray(token.permissions) && token.permissions.length > 0) {
          session.user.permissions = token.permissions;
        }
        (session.user as { companyId?: string | null }).companyId =
          (token.companyId as string | null | undefined) ?? null;
        (session.user as { branchId?: string | null }).branchId =
          (token.branchId as string | null | undefined) ?? null;
        (session.user as { companyName?: string | null }).companyName =
          (token.companyName as string | null | undefined) ?? null;
        (session.user as { branchName?: string | null }).branchName =
          (token.branchName as string | null | undefined) ?? null;
        (session.user as { employeeId?: string | null }).employeeId =
          (token.employeeId as string | null | undefined) ?? null;
        (session.user as { tenantId?: string | null }).tenantId =
          (token.tenantId as string | null | undefined) ?? null;
        (session as { access_token?: string }).access_token = (token.access_token as string) ?? undefined;
        (session as { refresh_token?: string }).refresh_token = (token.refresh_token as string) ?? undefined;
        (session as { accessTokenExpires?: number }).accessTokenExpires =
          (token.accessTokenExpires as number) ?? undefined;
        (session as { refreshTokenExpires?: number }).refreshTokenExpires =
          (token.refreshTokenExpires as number) ?? undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: sessionMaxSeconds(),
  },
  cookies: {
    sessionToken: {
      name: sessionTokenCookieName(),
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: sessionTokenCookieSecure(),
        maxAge: sessionMaxSeconds(),
      },
    },
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'development-secret-min-32-characters-long'
      : undefined),
};
