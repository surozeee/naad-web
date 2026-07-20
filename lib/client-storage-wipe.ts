'use client';

export type ClearClientStorageOptions = {
  theme?: string | null;
  language?: string | null;
};

const THEME_KEY = 'theme';
const LANGUAGE_KEY = 'uiLanguage';

export function clearAllCookies(): void {
  if (typeof document === 'undefined') return;
  const cookies = document.cookie.split(';');
  const path = '/';
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf('=');
    const name = (eqIdx > -1 ? cookie.slice(0, eqIdx).trim() : cookie.trim());
    if (!name) continue;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${document.location.hostname}`;
  }
}

/** Wipe client storage; preserve theme + UI language. */
export function clearAllClientStorage(options?: ClearClientStorageOptions): void {
  let preservedTheme = options?.theme ?? null;
  let preservedLanguage = options?.language ?? null;

  if (typeof window !== 'undefined') {
    try {
      if (!preservedTheme) preservedTheme = localStorage.getItem(THEME_KEY);
      if (!preservedLanguage) preservedLanguage = localStorage.getItem(LANGUAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  clearAllCookies();
  if (typeof window === 'undefined') return;

  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }

  try {
    if (preservedTheme) localStorage.setItem(THEME_KEY, preservedTheme);
    if (preservedLanguage) localStorage.setItem(LANGUAGE_KEY, preservedLanguage);
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}
