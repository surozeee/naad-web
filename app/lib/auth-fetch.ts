/** Re-export NextAuth-based auth fetch (erp-web flow). */
export {
  authFetch,
  fetchWithAuth,
  getCachedSession,
  clearSessionCache,
  tryRecoverAuthSession,
  type AuthFetchOptions,
  type FetchWithAuthOptions,
} from '@/lib/auth-fetch';
