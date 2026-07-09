/** Naad portal role helpers (erp-web style). */

import type { StoredAuthProfile } from '@/app/lib/auth-storage';

export type NaadPortalRole = 'customer' | 'astrologer' | 'admin';

export interface ResolvedAuthRole {
  userType: string;
  roleName: string | null;
  portalRole: NaadPortalRole;
  isCustomer: boolean;
  isAstrologer: boolean;
  isAdmin: boolean;
}

export function getPortalRoleLabel(portalRole: NaadPortalRole): string {
  if (portalRole === 'customer') return 'Customer';
  if (portalRole === 'astrologer') return 'Astrologer';
  return 'Admin';
}

export function normalizeUserType(userType?: string | null, roleName?: string | null): string {
  const direct = String(userType ?? '').trim().toUpperCase();
  if (direct) return direct;
  return inferUserTypeFromRoleName(roleName) ?? '';
}

export function inferUserTypeFromRoleName(roleName?: string | null): string | undefined {
  const role = String(roleName ?? '').trim().toUpperCase();
  if (!role) return undefined;
  if (role.includes('SUPER ADMIN') || role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (role.includes('ASTROLOGER')) return 'ASTROLOGER';
  if (role.includes('CUSTOMER')) return 'CUSTOMER';
  if (role.includes('ADMIN')) return 'SUPER_ADMIN';
  return undefined;
}

export function isCustomerUserType(userType?: string | null, roleName?: string | null): boolean {
  const normalized = normalizeUserType(userType, roleName);
  if (normalized === 'CUSTOMER') return true;
  return /customer/i.test(String(roleName ?? ''));
}

export function isAstrologerUserType(userType?: string | null, roleName?: string | null): boolean {
  const normalized = normalizeUserType(userType, roleName);
  if (normalized === 'ASTROLOGER') return true;
  const role = String(roleName ?? '');
  if (!/astrologer/i.test(role)) return false;
  return !/super admin|admin/i.test(role);
}

export function isAdminUserType(userType?: string | null, roleName?: string | null): boolean {
  if (isCustomerUserType(userType, roleName)) return false;
  if (isAstrologerUserType(userType, roleName)) return false;
  return true;
}

export function mapToNaadPortalRole(userType?: string | null, roleName?: string | null): NaadPortalRole {
  if (isCustomerUserType(userType, roleName)) return 'customer';
  if (isAstrologerUserType(userType, roleName)) return 'astrologer';
  return 'admin';
}

/** Resolve role from session/localStorage profile (erp-web dual-source pattern). */
export function resolveAuthRole(profile?: StoredAuthProfile | null): ResolvedAuthRole {
  const userType = profile?.userType ?? null;
  const roleName = profile?.role ?? profile?.roles?.[0] ?? null;
  const normalizedUserType = normalizeUserType(userType, roleName);
  const portalRole = mapToNaadPortalRole(normalizedUserType, roleName);
  return {
    userType: normalizedUserType,
    roleName,
    portalRole,
    isCustomer: isCustomerUserType(normalizedUserType, roleName),
    isAstrologer: isAstrologerUserType(normalizedUserType, roleName),
    isAdmin: isAdminUserType(normalizedUserType, roleName),
  };
}
