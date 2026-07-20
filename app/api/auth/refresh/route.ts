import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtSubFromAccessToken, sessionUserFromParsedTokens } from '@/lib/auth-tokens';
import { buildClearSessionCookieHeaders } from '@/lib/clear-session-cookies';
import { createSessionCookieHeaders } from '@/lib/set-session';
import { authOptions } from '@/lib/auth';
import { refreshTokensWithBackend } from '@/lib/server-refresh-token';

export interface RefreshBody {
  refreshToken: string;
  id?: string;
  email?: string;
  name?: string | null;
}

function refreshFailureResponse(status: number, message: string) {
  const response = NextResponse.json({ message }, { status });
  // Any refresh failure → clear session cookies immediately (no client TTL guess).
  buildClearSessionCookieHeaders().forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RefreshBody;
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      return refreshFailureResponse(400, 'refreshToken is required');
    }

    const parsed = await refreshTokensWithBackend(refreshToken);
    if (!parsed) {
      return refreshFailureResponse(401, 'Refresh failed');
    }

    const response = NextResponse.json({
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      expires_in: parsed.accessExpiresIn,
      refresh_expires_in: parsed.refreshExpiresIn,
    });

    let priorSub: string | null = null;
    let priorEmail = '';
    let priorName: string | null | undefined;
    let priorUserType: string | null | undefined;
    let priorRoleType: string | null | undefined;
    let priorRole: string | null | undefined;
    let priorRoles: string[] | undefined;
    let priorPermissions: string[] | undefined;
    let priorCompanyId: string | null | undefined;
    let priorBranchId: string | null | undefined;
    let priorCompanyName: string | null | undefined;
    let priorBranchName: string | null | undefined;
    let priorEmployeeId: string | null | undefined;
    const secret = authOptions.secret;
    if (secret) {
      try {
        const existing = await getToken({
          req: request as Parameters<typeof getToken>[0]['req'],
          secret,
        });
        if (existing) {
          if (typeof existing.sub === 'string' && existing.sub.trim() !== '') {
            priorSub = existing.sub.trim();
          } else if (
            typeof (existing as { id?: unknown }).id === 'string' &&
            String((existing as { id: string }).id).trim() !== ''
          ) {
            priorSub = String((existing as { id: string }).id).trim();
          }
          priorEmail = typeof existing.email === 'string' ? existing.email.trim() : '';
          priorName = typeof existing.name === 'string' ? existing.name : undefined;
          priorUserType =
            typeof (existing as { userType?: unknown }).userType === 'string'
              ? String((existing as { userType: string }).userType)
              : undefined;
          priorRoleType =
            typeof (existing as { roleType?: unknown }).roleType === 'string'
              ? String((existing as { roleType: string }).roleType)
              : undefined;
          priorRole =
            typeof (existing as { role?: unknown }).role === 'string'
              ? String((existing as { role: string }).role)
              : undefined;
          priorRoles = Array.isArray((existing as { roles?: unknown }).roles)
            ? ((existing as { roles: string[] }).roles)
            : undefined;
          priorPermissions = Array.isArray((existing as { permissions?: unknown }).permissions)
            ? ((existing as { permissions: string[] }).permissions)
            : undefined;
          priorCompanyId =
            typeof (existing as { companyId?: unknown }).companyId === 'string'
              ? String((existing as { companyId: string }).companyId)
              : undefined;
          priorBranchId =
            typeof (existing as { branchId?: unknown }).branchId === 'string'
              ? String((existing as { branchId: string }).branchId)
              : undefined;
          priorCompanyName =
            typeof (existing as { companyName?: unknown }).companyName === 'string'
              ? String((existing as { companyName: string }).companyName)
              : undefined;
          priorBranchName =
            typeof (existing as { branchName?: unknown }).branchName === 'string'
              ? String((existing as { branchName: string }).branchName)
              : undefined;
          priorEmployeeId =
            typeof (existing as { employeeId?: unknown }).employeeId === 'string'
              ? String((existing as { employeeId: string }).employeeId)
              : undefined;
        }
      } catch {
        // ignore
      }
    }

    const bodyId = body.id != null && String(body.id).trim() !== '' ? String(body.id).trim() : '';
    const bodyEmail = body.email != null && String(body.email).trim() !== '' ? String(body.email).trim() : '';
    const sub = jwtSubFromAccessToken(parsed.access_token);
    const id = bodyId || bodyEmail || priorSub || sub;
    const email = bodyEmail || bodyId || priorEmail || sub || id;
    const name = body.name ?? priorName;

    if (id) {
      try {
        const user = sessionUserFromParsedTokens(parsed, {
          id,
          email: email || id,
          name: name ?? undefined,
          userType: priorUserType ?? priorRoleType ?? null,
          roleType: priorRoleType ?? null,
          role: priorRole ?? null,
          roles: priorRoles,
          permissions: priorPermissions,
          companyId: priorCompanyId ?? null,
          branchId: priorBranchId ?? null,
          companyName: priorCompanyName ?? null,
          branchName: priorBranchName ?? null,
          employeeId: priorEmployeeId ?? null,
        });
        const cookieHeaders = await createSessionCookieHeaders(user);
        cookieHeaders.forEach((cookie) => {
          response.headers.append('Set-Cookie', cookie);
        });
      } catch (e) {
        console.error('[Auth] Refresh set-session error:', e);
      }
    } else {
      console.error(
        '[Auth] Refresh succeeded but could not set session cookie: missing user id/email and no prior session.'
      );
    }

    return response;
  } catch (error) {
    console.error('[Auth] Refresh API error:', error);
    return refreshFailureResponse(500, 'Refresh failed');
  }
}
