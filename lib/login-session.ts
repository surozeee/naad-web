import { NextResponse } from 'next/server';
import {
  jwtSubFromAccessToken,
  parseAuthApiPayload,
  sessionUserFromParsedTokens,
} from '@/lib/auth-tokens';
import { inferUserTypeFromRoleName } from '@/app/lib/menu-role';
import { buildLoginUserPayload } from '@/lib/login-user';
import { createSessionCookieHeaders } from '@/lib/set-session';

export async function buildLoginSessionResponse(
  data: unknown,
  fallbackEmail: string
): Promise<NextResponse> {
  const parsed = parseAuthApiPayload(data);
  if (!parsed?.access_token) {
    return NextResponse.json(
      typeof data === 'object' && data
        ? data
        : { message: 'Login failed — no access token in response.' },
      { status: 502 }
    );
  }

  const userData =
    (data as { data?: { user?: Record<string, unknown> } })?.data?.user ?? {};
  const sub = jwtSubFromAccessToken(parsed.access_token);
  const role =
    (userData as { role?: string }).role ??
    ((userData as { roles?: string[] }).roles?.[0] ?? null);
  const resolvedUserType = inferUserTypeFromRoleName(role) ?? null;
  const email = String((userData as { email?: string }).email ?? fallbackEmail);

  const user = sessionUserFromParsedTokens(parsed, {
    id: String((userData as { id?: string }).id ?? sub ?? email),
    email,
    name:
      (userData as { name?: string | null }).name ??
      (userData as { email?: string }).email ??
      email,
    userType: resolvedUserType,
    roleType: resolvedUserType,
    role,
    roles: (userData as { roles?: string[] }).roles,
    permissions: (userData as { permissions?: string[] }).permissions,
    companyId:
      (userData as { companyId?: string }).companyId ??
      (userData as { company_id?: string }).company_id ??
      null,
    branchId:
      (userData as { branchId?: string }).branchId ??
      (userData as { branch_id?: string }).branch_id ??
      null,
    companyName:
      (userData as { companyName?: string }).companyName ??
      (userData as { company_name?: string }).company_name ??
      null,
    branchName:
      (userData as { branchName?: string }).branchName ??
      (userData as { branch_name?: string }).branch_name ??
      null,
    employeeId:
      (userData as { employeeId?: string }).employeeId ??
      (userData as { employee_id?: string }).employee_id ??
      null,
    tenantId:
      (userData as { tenantId?: string }).tenantId ??
      (userData as { tenant_id?: string }).tenant_id ??
      null,
  });

  const enrichedUser = buildLoginUserPayload(userData, user);

  let cookieHeaders: string[];
  try {
    cookieHeaders = await createSessionCookieHeaders(user);
  } catch (sessionErr) {
    console.error('[Auth] Login set-session error:', sessionErr);
    const detail =
      sessionErr instanceof Error ? sessionErr.message : 'Unknown session error';
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === 'development'
            ? `Session cookie failed: ${detail}`
            : 'Something went wrong. Please try again later.',
        code: 'SESSION_COOKIE_FAILED',
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    ...(typeof data === 'object' && data ? data : {}),
    sessionReady: true,
    data: {
      ...((data as { data?: Record<string, unknown> })?.data ?? {}),
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token,
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      user: enrichedUser,
    },
  });
  cookieHeaders.forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });
  return response;
}
