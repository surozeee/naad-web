/**
 * Map backend user rows → public astrologer profiles (no email/phone).
 */
import type { UserResponse } from '@/app/lib/user-api.types';
import type { AstrologerPublicProfile } from '@/app/lib/astrologer.types';

function unwrapList(raw: unknown): UserResponse[] {
  if (Array.isArray(raw)) return raw as UserResponse[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.result)) return obj.result as UserResponse[];
    if (Array.isArray(obj.content)) return obj.content as UserResponse[];
    if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data.result)) return data.result as UserResponse[];
      if (Array.isArray(data.content)) return data.content as UserResponse[];
      if (Array.isArray(data.data)) return data.data as UserResponse[];
    }
  }
  return [];
}

export function mapUserToPublicAstrologer(raw: UserResponse): AstrologerPublicProfile | null {
  const status = String(raw.status ?? 'ACTIVE').toUpperCase();
  if (status !== 'ACTIVE') return null;
  const id = String(raw.id ?? '').trim();
  if (!id) return null;
  const name = String(raw.userDetail?.name ?? raw.emailAddress ?? 'Astrologer').trim();
  return {
    id,
    name,
    photoUrl: raw.userDetail?.photoUrl ?? null,
    bio: null,
    averageRating: null,
    reviewCount: 0,
  };
}

export function sanitizeAstrologerListPayload(json: unknown): AstrologerPublicProfile[] {
  const rows = unwrapList(json);
  const mapped: AstrologerPublicProfile[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const profile = mapUserToPublicAstrologer(row);
    if (!profile || seen.has(profile.id)) continue;
    seen.add(profile.id);
    mapped.push(profile);
  }
  return mapped;
}

export function mergeReviewStats(
  profiles: AstrologerPublicProfile[],
  statsById: Record<string, { averageRating: number | null; reviewCount: number }>
): AstrologerPublicProfile[] {
  return profiles.map((p) => {
    const stats = statsById[p.id];
    if (!stats) return p;
    return {
      ...p,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
    };
  });
}
