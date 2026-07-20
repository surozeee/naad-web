'use client';

import { performClientLogout } from '@/lib/logout-client';

/**
 * Clear NextAuth session + profile, then redirect home.
 */
export function logout(_redirectTo: string = '/'): void {
  void performClientLogout(null);
}
