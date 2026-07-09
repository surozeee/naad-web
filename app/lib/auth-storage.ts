import { inferUserTypeFromRoleName } from '@/app/lib/menu-role';
import type { ProfileApiResponse } from '@/app/lib/profile.service';

export const AUTH_PROFILE_STORAGE_KEY = 'naad_auth_profile';

export interface StoredAuthProfile {
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  userType?: string | null;
  roleType?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
}

export function saveAuthProfileToLocalStorage(profile: StoredAuthProfile): void {
  if (typeof window === 'undefined') return;
  const payload: StoredAuthProfile = {
    userId: profile.userId ?? null,
    name: profile.name ?? null,
    email: profile.email ?? null,
    userType: profile.userType ?? null,
    roleType: profile.roleType ?? null,
    role: profile.role ?? null,
    roles: Array.isArray(profile.roles) ? profile.roles : [],
    permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
  };
  localStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(payload));
}

export function getAuthProfileFromLocalStorage(): StoredAuthProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthProfile;
    return {
      userId: parsed.userId ?? null,
      name: parsed.name ?? null,
      email: parsed.email ?? null,
      userType: parsed.userType ?? null,
      roleType: parsed.roleType ?? null,
      role: parsed.role ?? null,
      roles: Array.isArray(parsed.roles) ? parsed.roles : [],
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    };
  } catch {
    return null;
  }
}

export function clearAuthProfileFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
}

function asOptionalString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function authProfileFromLoginUser(user: Record<string, unknown> | null | undefined): StoredAuthProfile {
  if (!user || typeof user !== 'object') {
    return { userType: null, role: null, roles: [], permissions: [] };
  }
  const roles = Array.isArray(user.roles) ? user.roles.map((r) => String(r)) : [];
  const permissions = Array.isArray(user.permissions) ? user.permissions.map((p) => String(p)) : [];
  const role =
    (typeof user.role === 'string' && user.role.trim() ? user.role : null) ??
    (typeof user.roleName === 'string' && user.roleName.trim() ? user.roleName : null) ??
    roles[0] ??
    null;
  const userType =
    (typeof user.userType === 'string' && user.userType.trim() ? user.userType : null) ??
    (typeof user.roleType === 'string' && user.roleType.trim() ? user.roleType : null) ??
    inferUserTypeFromRoleName(role) ??
    null;

  return {
    userId: asOptionalString(user.userId ?? user.id ?? user.user_id),
    name: asOptionalString(user.name),
    email: asOptionalString(user.email ?? user.emailAddress),
    userType,
    roleType: userType,
    role,
    roles,
    permissions,
  };
}

export function authProfileFromUserApi(profile: ProfileApiResponse | null | undefined): StoredAuthProfile {
  if (!profile) {
    return { userType: null, role: null, roles: [], permissions: [] };
  }
  const role = profile.roleName ?? null;
  const userType = profile.userDetail?.userType ?? profile.userDetail?.roleType ?? inferUserTypeFromRoleName(role) ?? null;
  return {
    userId: profile.id ?? null,
    name: profile.userDetail?.name ?? null,
    email: profile.emailAddress ?? null,
    userType,
    roleType: profile.userDetail?.roleType ?? userType,
    role,
    roles: role ? [role] : [],
    permissions: [],
  };
}
