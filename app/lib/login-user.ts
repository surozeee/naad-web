import { inferUserTypeFromRoleName } from '@/app/lib/menu-role';

/** Enrich backend login user payload with resolved userType/role (erp-web style). */
export function buildLoginUserPayload(
  userData: Record<string, unknown>,
  fallbackEmail?: string
): Record<string, unknown> {
  const roles = Array.isArray(userData.roles) ? userData.roles.map((r) => String(r)) : [];
  const role =
    (typeof userData.role === 'string' && userData.role.trim() ? userData.role : null) ??
    (typeof userData.roleName === 'string' && userData.roleName.trim() ? userData.roleName : null) ??
    roles[0] ??
    null;
  const resolvedUserType =
    (typeof userData.userType === 'string' && userData.userType.trim() ? userData.userType : null) ??
    (typeof userData.roleType === 'string' && userData.roleType.trim() ? userData.roleType : null) ??
    inferUserTypeFromRoleName(role) ??
    null;

  return {
    ...userData,
    id: userData.id ?? userData.userId ?? userData.user_id ?? null,
    email: userData.email ?? userData.emailAddress ?? fallbackEmail ?? null,
    name: userData.name ?? userData.email ?? userData.emailAddress ?? fallbackEmail ?? null,
    role,
    roles: roles.length > 0 ? roles : role ? [role] : [],
    userType: resolvedUserType,
    roleType: resolvedUserType,
  };
}
