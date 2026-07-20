/**
 * Parse token fields from login / refresh API JSON (camelCase or snake_case).
 * Access TTL from API expiresIn (or access JWT exp).
 * Refresh TTL only when API sends refreshExpiresIn — never invent from refresh JWT.
 * Without API refresh TTL, refresh validity is decided by refresh API success/error only.
 */

/** Session cookie lifetime when API omits refreshExpiresIn (30 days). */
export const DEFAULT_SESSION_MAX_SECONDS = 30 * 24 * 60 * 60;

export type ParsedAuthTokens = {
  access_token: string;
  refresh_token: string;
  /** Access token lifetime in seconds (OAuth expires_in / expiresIn). */
  accessExpiresIn?: number;
  /** Refresh token lifetime in seconds — used for session cookie max-age only. */
  refreshExpiresIn?: number;
  sessionMaxSeconds?: number;
};

function decodeBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  try {
    if (typeof atob === 'function') return atob(padded);
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

function jwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.trim().split('.')[1];
  if (!payload) return null;
  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function jwtExpiresAtMs(token: string): number | undefined {
  const exp = jwtPayload(token)?.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp) || exp <= 0) {
    return undefined;
  }
  return Math.floor(exp) * 1000;
}

/** Subject (`sub`) from a JWT access token — used when login API omits user.id. */
export function jwtSubFromAccessToken(accessToken: string): string | undefined {
  const sub = jwtPayload(accessToken)?.sub;
  if (typeof sub !== 'string') return undefined;
  const trimmed = sub.trim();
  return trimmed || undefined;
}

function resolveAccessExpiresInSeconds(
  apiSeconds: number | undefined,
  accessToken: string
): number | undefined {
  const jwtRemaining = secondsUntil(jwtExpiresAtMs(accessToken));
  if (apiSeconds != null && jwtRemaining != null) {
    return Math.min(apiSeconds, jwtRemaining);
  }
  return apiSeconds ?? jwtRemaining;
}

function secondsUntil(expiresAtMs: number | undefined): number | undefined {
  if (expiresAtMs == null || !Number.isFinite(expiresAtMs)) return undefined;
  const seconds = Math.floor((expiresAtMs - Date.now()) / 1000);
  return seconds > 0 ? seconds : undefined;
}

const REFRESH_EXPIRES_KEYS = [
  'refreshExpiresIn',
  'refresh_expires_in',
  'refreshTokenExpiresIn',
  'refresh_token_expires_in',
  'refreshTokenLifeTime',
  'refresh_token_lifetime',
];

function readRefreshExpiresSeconds(
  bag: Record<string, unknown>,
  root: Record<string, unknown>
): number | undefined {
  return readSeconds(bag, REFRESH_EXPIRES_KEYS) ?? readSeconds(root, REFRESH_EXPIRES_KEYS);
}

/** Prefer API refresh TTL only. Never invent expiry from JWT when API omits it —
 * refresh validity is decided by the refresh API response (success vs error). */
function resolveRefreshExpiresInSeconds(
  apiRefresh: number | undefined,
  accessExpiresIn: number | undefined
): number | undefined {
  if (apiRefresh == null) return undefined;
  if (accessExpiresIn == null || apiRefresh > accessExpiresIn) return apiRefresh;
  return apiRefresh;
}

function resolveParsedSessionMaxSeconds(parsed: ParsedAuthTokens): number | undefined {
  if (parsed.refreshExpiresIn != null) return parsed.refreshExpiresIn;
  if (
    parsed.sessionMaxSeconds != null &&
    (parsed.accessExpiresIn == null || parsed.sessionMaxSeconds > parsed.accessExpiresIn)
  ) {
    return parsed.sessionMaxSeconds;
  }
  return undefined;
}

/** Keep the later expiry when refresh extends the session (avoid shrinking on access-only refresh). */
export function laterRefreshTokenExpiresMs(
  existingMs: number | undefined,
  refreshExpiresInSeconds: number | undefined
): number | undefined {
  const next = refreshTokenExpiresAtMs(refreshExpiresInSeconds);
  if (next == null) return existingMs;
  if (existingMs == null || !Number.isFinite(existingMs)) return next;
  return Math.max(existingMs, next);
}

function authDataBag(payload: unknown): Record<string, unknown> {
  if (payload == null || typeof payload !== 'object') return {};
  const root = payload as Record<string, unknown>;
  const nested = root.data;
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return root;
}

export function readSeconds(
  record: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const k of keys) {
    const v = record[k];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.floor(v);
    if (typeof v === 'string') {
      const t = v.trim();
      if (/^\d+$/.test(t)) {
        const n = Number.parseInt(t, 10);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
  }
  return undefined;
}

export function parseAuthApiPayload(payload: unknown): ParsedAuthTokens | null {
  const bag = authDataBag(payload);
  const root = payload != null && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  if (root.success === false) {
    return null;
  }

  const access_token =
    String(
      bag.accessToken ??
        bag.access_token ??
        root.accessToken ??
        root.access_token ??
        ''
    ).trim();
  const refresh_token =
    String(
      bag.refreshToken ??
        bag.refresh_token ??
        root.refreshToken ??
        root.refresh_token ??
        ''
    ).trim();

  if (!access_token) return null;

  const accessExpiresIn = resolveAccessExpiresInSeconds(
    readSeconds(bag, ['expiresIn', 'expires_in']) ??
      readSeconds(root, ['expiresIn', 'expires_in']),
    access_token
  );
  const apiRefreshExpiresIn = readRefreshExpiresSeconds(bag, root);

  return {
    access_token,
    refresh_token,
    accessExpiresIn,
    refreshExpiresIn: resolveRefreshExpiresInSeconds(
      apiRefreshExpiresIn,
      accessExpiresIn
    ),
    sessionMaxSeconds:
      readSeconds(bag, ['sessionMaxSeconds', 'session_max_seconds']) ??
      readSeconds(root, ['sessionMaxSeconds', 'session_max_seconds']),
  };
}

/** Wall-clock ms when the access token should be treated as expired. */
export function accessTokenExpiresAtMs(accessExpiresInSeconds?: number): number | undefined {
  if (accessExpiresInSeconds == null || !Number.isFinite(accessExpiresInSeconds)) {
    return undefined;
  }
  return Date.now() + Math.floor(accessExpiresInSeconds) * 1000;
}

/** Wall-clock ms when the refresh token expires (for session cookie / JWT). */
export function refreshTokenExpiresAtMs(refreshExpiresInSeconds?: number): number | undefined {
  if (refreshExpiresInSeconds == null || !Number.isFinite(refreshExpiresInSeconds)) {
    return undefined;
  }
  return Date.now() + Math.floor(refreshExpiresInSeconds) * 1000;
}

/**
 * Session cookie max-age (seconds). Prefer refresh-token lifetime; never access-token expiresIn.
 */
export function sessionMaxAgeFromAuthApiPayload(payload: unknown): number | undefined {
  const parsed = parseAuthApiPayload(payload);
  if (!parsed) return undefined;
  return resolveParsedSessionMaxSeconds(parsed);
}

/** Env fallback when the API omits refresh/session TTL. */
export function sessionMaxSecondsFromEnv(): number | undefined {
  const raw = process.env.NEXTAUTH_SESSION_MAX_SECONDS?.trim();
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n > 0) return n;
  return undefined;
}

/** Env or default — used when login/refresh API does not send refreshExpiresIn. */
export function effectiveSessionMaxSeconds(): number {
  return sessionMaxSecondsFromEnv() ?? DEFAULT_SESSION_MAX_SECONDS;
}

export function resolveSessionMaxAgeSeconds(payload: unknown): number {
  return sessionMaxAgeFromAuthApiPayload(payload) ?? effectiveSessionMaxSeconds();
}

function isTokenExpiredAt(
  expiresAtMs: number | undefined,
  bufferMs = 30_000
): boolean {
  if (expiresAtMs == null || !Number.isFinite(expiresAtMs)) {
    return false;
  }
  return Date.now() >= expiresAtMs - bufferMs;
}

/** True when access token should be refreshed before the next API call. */
export function isAccessTokenExpired(
  accessTokenExpiresMs: number | undefined,
  bufferMs = 30_000
): boolean {
  return isTokenExpiredAt(accessTokenExpiresMs, bufferMs);
}

/** True only when the API provided a refresh TTL and that window has passed. */
export function hasKnownRefreshTokenExpiry(
  refreshTokenExpiresMs: number | undefined
): boolean {
  return refreshTokenExpiresMs != null && Number.isFinite(refreshTokenExpiresMs);
}

/**
 * True when refresh token is expired per API-provided TTL only.
 * When the API omits refresh expiry, returns false — invalid/expired refresh is
 * decided solely by a failed refresh API response (then logout immediately).
 */
export function isRefreshTokenExpired(
  refreshTokenExpiresMs: number | undefined,
  bufferMs = 30_000
): boolean {
  if (!hasKnownRefreshTokenExpiry(refreshTokenExpiresMs)) {
    return false;
  }
  return isTokenExpiredAt(refreshTokenExpiresMs, bufferMs);
}

/** Fields for createSessionCookieHeaders from a login/refresh API payload. */
export function sessionUserFromParsedTokens(
  parsed: ParsedAuthTokens,
  identity: {
    id: string;
    email: string;
    name?: string | null;
    userType?: string | null;
    roleType?: string | null;
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
): {
  id: string;
  email: string;
  name?: string | null;
  userType?: string | null;
  roleType?: string | null;
  role?: string | null;
  roles?: string[];
  permissions?: string[];
  companyId?: string | null;
  branchId?: string | null;
  companyName?: string | null;
  branchName?: string | null;
  employeeId?: string | null;
  tenantId?: string | null;
  access_token: string;
  refresh_token: string;
  sessionMaxAgeSeconds?: number;
  accessTokenExpires?: number;
  refreshTokenExpires?: number;
} {
  return {
    ...identity,
    employeeId: identity.employeeId ?? null,
    access_token: parsed.access_token,
    refresh_token: parsed.refresh_token,
    sessionMaxAgeSeconds: resolveParsedSessionMaxSeconds(parsed) ?? effectiveSessionMaxSeconds(),
    accessTokenExpires: accessTokenExpiresAtMs(parsed.accessExpiresIn),
    ...(parsed.refreshExpiresIn != null
      ? { refreshTokenExpires: refreshTokenExpiresAtMs(parsed.refreshExpiresIn) }
      : {}),
  };
}
