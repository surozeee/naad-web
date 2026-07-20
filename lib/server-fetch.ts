/**
 * Server-side HTTP to the backend with a longer timeout than the default fetch.
 */

const BACKEND_FETCH_TIMEOUT_MS = Number(
  process.env.API_CONNECT_TIMEOUT_MS ?? process.env.BACKEND_FETCH_TIMEOUT_MS ?? 60_000
);

/** Use for all Next route-handler calls to your API (not for browser). */
export function serverFetch(input: string | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(BACKEND_FETCH_TIMEOUT_MS),
  });
}
