/** Persist selected astrologer across login / register. */

export const ASTROLOGER_INTENT_KEY = 'naad_astrologer_intent';

export type AstrologerIntentAction = 'rate' | 'book' | 'detail';

export type AstrologerIntent = {
  astrologerId: string;
  action: AstrologerIntentAction;
  name?: string;
};

export function rateAstrologerPath(astrologerId: string): string {
  return `/dashboard/rate-astrologer?astrologerId=${encodeURIComponent(astrologerId)}`;
}

export function bookAstrologerPath(astrologerId: string): string {
  return `/book-meeting?astrologerId=${encodeURIComponent(astrologerId)}`;
}

export function astrologerDetailPath(astrologerId: string): string {
  return `/astrologers/${encodeURIComponent(astrologerId)}`;
}

export function intentRedirectPath(intent: AstrologerIntent): string {
  if (intent.action === 'rate') return rateAstrologerPath(intent.astrologerId);
  if (intent.action === 'book') return bookAstrologerPath(intent.astrologerId);
  return astrologerDetailPath(intent.astrologerId);
}

export function saveAstrologerIntent(intent: AstrologerIntent): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ASTROLOGER_INTENT_KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

export function readAstrologerIntent(): AstrologerIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ASTROLOGER_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AstrologerIntent;
    if (!parsed?.astrologerId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAstrologerIntent(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ASTROLOGER_INTENT_KEY);
  } catch {
    /* ignore */
  }
}
