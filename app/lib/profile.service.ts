/**
 * Profile API – current user profile from GET /api/user/profile.
 * Update detail: PUT /api/user/update-detail (header: userId).
 * Change password: POST /api/user/change-password (header: id).
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';

export interface ProfileUserDetail {
  id?: string;
  salutation?: string;
  gender?: string;
  name?: string;
  phoneNumber?: string;
  expiryDate?: string;
  roleType?: string;
  language?: string;
  enable2FA?: boolean;
  country?: string;
  employeeCode?: string;
  userType?: string;
  notifyTo?: string;
  status?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface ProfileApiResponse {
  id?: string;
  emailAddress?: string;
  mobileNumber?: string;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  enabled?: boolean;
  status?: string;
  roleId?: string;
  roleName?: string;
  createdAt?: string;
  lastModifiedAt?: string;
  userDetail?: ProfileUserDetail;
}

interface ProfileGlobalResponse {
  data?: ProfileApiResponse;
  message?: string;
  status?: string;
}

/**
 * Fetches the current user's profile (uses session/cookies via fetchWithAuth).
 */
export async function getProfile(): Promise<ProfileApiResponse | null> {
  const res = await fetchWithAuth('/api/user/profile', { method: 'GET', credentials: 'same-origin' });
  if (!res.ok) return null;
  const json = (await res.json()) as ProfileGlobalResponse;
  return json?.data ?? null;
}
