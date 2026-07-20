import { getServerApiBase } from '@/lib/server-api-base';
import { parseAuthApiPayload, type ParsedAuthTokens } from '@/lib/auth-tokens';
import { serverFetch } from '@/lib/server-fetch';

/** Call User-Service refresh (server-only). */
export async function refreshTokensWithBackend(
  refreshToken: string
): Promise<ParsedAuthTokens | null> {
  const trimmed = refreshToken.trim();
  if (!trimmed) return null;

  const xsrf = process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
  const headers: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf;
    headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
  }

  const API_BASE = getServerApiBase();
  if (!API_BASE) return null;

  const bodies: Record<string, string>[] = [
    { refreshToken: trimmed },
    { refresh_token: trimmed },
  ];

  for (const body of bodies) {
    try {
      const res = await serverFetch(`${API_BASE}/api/v2/public/user/refresh/token`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) continue;
      if (
        data != null &&
        typeof data === 'object' &&
        (data as { success?: boolean }).success === false
      ) {
        continue;
      }

      const parsed = parseAuthApiPayload(data);
      if (!parsed?.access_token) continue;
      if (!parsed.refresh_token) {
        parsed.refresh_token = trimmed;
      }
      return parsed;
    } catch {
      continue;
    }
  }

  return null;
}
