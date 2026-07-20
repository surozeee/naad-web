import { authOptions } from '@/lib/auth';

/** Set-Cookie header values that expire all NextAuth session tokens (including chunks). */
export function buildClearSessionCookieHeaders(): string[] {
  const configuredName = authOptions.cookies?.sessionToken?.name ?? 'next-auth.session-token';
  const secure = process.env.NODE_ENV === 'production';
  const names = new Set<string>([
    configuredName,
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
  ]);

  for (const base of Array.from(names)) {
    for (let i = 0; i < 8; i += 1) {
      names.add(`${base}.${i}`);
    }
  }

  const secureSuffix = secure ? '; Secure' : '';
  return Array.from(names).map(
    (name) =>
      `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${secureSuffix}`
  );
}
