'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/app/lib/auth-fetch';
import { resolveLanguageDisplayName } from '@/app/lib/language-i18n';
import {
  DEFAULT_UI_LANGUAGE,
  getStoredUiLanguage,
  languageRowToUiCode,
  normalizeUiLanguageCode,
  setStoredUiLanguage,
} from '@/app/lib/ui-language';

export type UiLanguageOption = {
  code: string;
  /** English / master name */
  name: string;
  /** Native script name (e.g. नेपाली) */
  nativeName: string;
  /** Resolved label for the current UI language */
  label: string;
};

type LocaleContextType = {
  language: string;
  setLanguage: (code: string) => void;
  languages: UiLanguageOption[];
  ready: boolean;
};

const defaultContext: LocaleContextType = {
  language: DEFAULT_UI_LANGUAGE,
  setLanguage: () => undefined,
  languages: [{ code: 'en', name: 'English', nativeName: 'English', label: 'English' }],
  ready: false,
};

const LocaleContext = createContext<LocaleContextType>(defaultContext);

const FALLBACK_RAW = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
] as const;

function withLabels(
  rows: Array<{ code: string; name: string; nativeName: string }>,
  uiCode: string
): UiLanguageOption[] {
  return rows.map((row) => ({
    ...row,
    label: resolveLanguageDisplayName(row, uiCode),
  }));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState(DEFAULT_UI_LANGUAGE);
  const [rawLanguages, setRawLanguages] = useState<Array<{ code: string; name: string; nativeName: string }>>(
    () => FALLBACK_RAW.map((r) => ({ ...r }))
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredUiLanguage();
    setLanguageState(stored);
    document.documentElement.lang = stored;
    setReady(true);

    // ignoreAuthFailure: never force logout/redirect from the language bootstrap call
    fetchWithAuth('/api/master/language/list-active', {
      method: 'GET',
      ignoreAuthFailure: true,
    })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json().catch(() => ({}))) as { data?: unknown };
        const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const mapped: Array<{ code: string; name: string; nativeName: string }> = [];
        const seen = new Set<string>();
        for (const item of raw as Array<Record<string, unknown>>) {
          const code = languageRowToUiCode(item);
          if (!code || seen.has(code)) continue;
          seen.add(code);
          const name = String(item.name ?? '').trim() || code.toUpperCase();
          const nativeName = String(item.nativeName ?? item.native_name ?? '').trim() || name;
          mapped.push({ code, name, nativeName });
        }
        if (!mapped.length) return;
        setRawLanguages(mapped);
        if (!seen.has(stored)) {
          const next = mapped.find((l) => l.code === 'en')?.code ?? mapped[0].code;
          setLanguageState(next);
          setStoredUiLanguage(next);
        }
      })
      .catch(() => {
        /* keep fallbacks */
      });
  }, []);

  const setLanguage = useCallback((code: string) => {
    const next = setStoredUiLanguage(code);
    setLanguageState(next);
  }, []);

  const languages = useMemo(
    () => withLabels(rawLanguages, normalizeUiLanguageCode(language)),
    [rawLanguages, language]
  );

  const value = useMemo(
    () => ({
      language: normalizeUiLanguageCode(language),
      setLanguage,
      languages,
      ready,
    }),
    [language, setLanguage, languages, ready]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
