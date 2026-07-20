'use client';

import { extractLoginErrorMessage, parseLoginResponse } from '@/lib/login-client';

const PUBLIC_LOGIN_PROXY = '/api/v2/public/user/login';
const ESTABLISH_SESSION_API = '/api/auth/establish-session';
const SERVER_LOGIN_API = '/api/auth/login';

export type LoginFlowResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; message: string };

function shouldFallback(status: number): boolean {
  return status === 502 || status === 503 || status === 404;
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const trimmed = text.trim();
    const looksHtml =
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      trimmed.toLowerCase().includes('/_next/static');
    return {
      message: looksHtml
        ? `Login route returned HTML instead of JSON (HTTP ${res.status}). The Next.js /api/auth handler is missing or crashed.`
        : trimmed.slice(0, 300),
      code: looksHtml ? 'HTML_INSTEAD_OF_JSON' : 'INVALID_JSON',
    };
  }
}

async function postJson(
  url: string,
  body: object,
  headers: Record<string, string>
): Promise<{ res: Response; data: unknown }> {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  return { res, data };
}

/**
 * Prefer the Next.js login route: server-side XSRF + HttpOnly session cookies.
 * Avoids client proxy/direct calls that often return "Failed to generate authentication token".
 */
async function loginViaServerRoute(
  email: string,
  password: string,
  headers: Record<string, string>
): Promise<LoginFlowResult> {
  const attempt = await postJson(SERVER_LOGIN_API, { email, password }, headers);
  if (attempt.res.ok) {
    return { ok: true, data: attempt.data };
  }
  return {
    ok: false,
    status: attempt.res.status,
    message: extractLoginErrorMessage(attempt.data, attempt.res.status),
  };
}

/** Exchange email/password via same-origin proxy (server injects XSRF). */
async function exchangeLoginCredentials(
  email: string,
  password: string,
  headers: Record<string, string>
): Promise<LoginFlowResult> {
  const proxyAttempt = await postJson(PUBLIC_LOGIN_PROXY, { email, password }, headers);
  if (proxyAttempt.res.ok) {
    return { ok: true, data: proxyAttempt.data };
  }

  return {
    ok: false,
    status: proxyAttempt.res.status,
    message: extractLoginErrorMessage(proxyAttempt.data, proxyAttempt.res.status),
  };
}

/** Create session cookies from a successful login API payload. */
async function establishLoginSession(
  email: string,
  password: string,
  loginResponse: unknown,
  headers: Record<string, string>
): Promise<LoginFlowResult> {
  const parsed = parseLoginResponse(loginResponse);
  if (parsed?.sessionReady) {
    return { ok: true, data: loginResponse };
  }

  const sessionAttempt = await postJson(
    ESTABLISH_SESSION_API,
    { email, loginResponse },
    headers
  );
  if (sessionAttempt.res.ok) {
    return { ok: true, data: sessionAttempt.data };
  }

  if (shouldFallback(sessionAttempt.res.status)) {
    return loginViaServerRoute(email, password, headers);
  }

  return {
    ok: false,
    status: sessionAttempt.res.status,
    message: extractLoginErrorMessage(sessionAttempt.data, sessionAttempt.res.status),
  };
}

export async function runLoginFlow(
  email: string,
  password: string,
  headers: Record<string, string>
): Promise<LoginFlowResult> {
  const serverLogin = await loginViaServerRoute(email, password, headers);
  if (serverLogin.ok) {
    return serverLogin;
  }
  if (!shouldFallback(serverLogin.status)) {
    return serverLogin;
  }

  const exchange = await exchangeLoginCredentials(email, password, headers);
  if (!exchange.ok) return exchange;

  const parsed = parseLoginResponse(exchange.data);
  if (parsed?.sessionReady) {
    return exchange;
  }

  return establishLoginSession(email, password, exchange.data, headers);
}
