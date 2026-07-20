/** Normalize login user payload for session storage and API clients. */
export function buildLoginUserPayload(
  userData: Record<string, unknown>,
  sessionUser: {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
    roles?: string[];
    permissions?: string[];
    companyId?: string | null;
    branchId?: string | null;
    companyName?: string | null;
    branchName?: string | null;
    employeeId?: string | null;
    tenantId?: string | null;
  }
): Record<string, unknown> {
  return {
    ...userData,
    id: sessionUser.id,
    userId: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name ?? userData.name,
    role: sessionUser.role ?? userData.role,
    roles: sessionUser.roles ?? userData.roles,
    permissions: sessionUser.permissions ?? userData.permissions,
    companyId: sessionUser.companyId ?? userData.companyId ?? userData.company_id ?? null,
    branchId: sessionUser.branchId ?? userData.branchId ?? userData.branch_id ?? null,
    companyName: sessionUser.companyName ?? userData.companyName ?? userData.company_name ?? null,
    branchName: sessionUser.branchName ?? userData.branchName ?? userData.branch_name ?? null,
    employeeId: sessionUser.employeeId ?? userData.employeeId ?? userData.employee_id ?? null,
    employee_id: sessionUser.employeeId ?? userData.employeeId ?? userData.employee_id ?? null,
    tenantId: sessionUser.tenantId ?? userData.tenantId ?? userData.tenant_id ?? null,
    tenant_id: sessionUser.tenantId ?? userData.tenantId ?? userData.tenant_id ?? null,
  };
}
