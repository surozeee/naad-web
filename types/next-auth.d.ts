import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    access_token?: string;
    refresh_token?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    error?: 'RefreshAccessTokenError';
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType?: string | null;
      roleType?: string | null;
      role?: string | null;
      roles?: string[];
      permissions?: string[];
      organizationId?: string | null;
      companyId?: string | null;
      branchId?: string | null;
      companyName?: string | null;
      branchName?: string | null;
      employeeId?: string | null;
      tenantId?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    id?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    error?: 'RefreshAccessTokenError';
    userType?: string | null;
    roleType?: string | null;
    role?: string | null;
    roles?: string[];
    permissions?: string[];
    organizationId?: string | null;
    companyId?: string | null;
    branchId?: string | null;
    companyName?: string | null;
    branchName?: string | null;
    employeeId?: string | null;
    tenantId?: string | null;
  }
}
