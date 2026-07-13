/**
 * App UI / Accept-Language preference (2-char lowercase, e.g. en, ne, hi).
 * Readable outside React so fetchWithAuth can attach Accept-Language.
 */

export const UI_LANGUAGE_STORAGE_KEY = 'uiLanguage';
export const DEFAULT_UI_LANGUAGE = 'en';

/** Normalize to a 2-character lowercase BCP 47 primary tag when possible. */
export function normalizeUiLanguageCode(raw?: string | null): string {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  if (!value) return DEFAULT_UI_LANGUAGE;
  if (value === 'np' || value === 'nep' || value === 'nepali') return 'ne';
  if (value === 'eng' || value === 'english') return 'en';
  if (value === 'hin' || value === 'hindi') return 'hi';
  const primary = value.split('-')[0] ?? value;
  if (/^[a-z]{2}$/.test(primary)) return primary;
  if (/^[a-z]{2,3}$/.test(primary)) return primary.slice(0, 2);
  return DEFAULT_UI_LANGUAGE;
}

/** Map Language master row → 2-char UI code. */
export function languageRowToUiCode(row: Record<string, unknown>): string | null {
  const iso = String(row.iso ?? row.isoCode ?? row.iso639 ?? '').trim();
  const code = String(row.code ?? '').trim();
  if (iso) return normalizeUiLanguageCode(iso);
  if (code) return normalizeUiLanguageCode(code);
  return null;
}

export function getStoredUiLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_UI_LANGUAGE;
  try {
    return normalizeUiLanguageCode(localStorage.getItem(UI_LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_UI_LANGUAGE;
  }
}

export function setStoredUiLanguage(code: string): string {
  const normalized = normalizeUiLanguageCode(code);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, normalized);
      document.documentElement.lang = normalized;
    } catch {
      /* ignore */
    }
  }
  return normalized;
}
