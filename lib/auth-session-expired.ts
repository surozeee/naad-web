export class AuthSessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthSessionExpiredError';
  }
}

export function extractApiErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const record = data as Record<string, unknown>;
  const message = record.message ?? record.error;
  if (typeof message === 'string') return message.trim();
  return '';
}

export function isLoginRequiredApiMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('login required') ||
    m.includes('unauthorized') ||
    m.includes('token expired') ||
    m.includes('invalid token') ||
    m.includes('session expired')
  );
}
