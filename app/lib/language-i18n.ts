/**
 * Localized language display names (same idea as color-i18n):
 * prefers API `locales` for the active UI language, then nativeName / name / table fallback.
 */
import type { LanguageLocaleResponse } from '@/app/lib/master.types';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';

export type LanguageNameSource = {
  code: string;
  name?: string | null;
  nativeName?: string | null;
  label?: string | null;
  locales?: LanguageLocaleResponse[] | null;
};

/** UI language → (language code → localized display name). */
const LANGUAGE_LABELS: Record<string, Record<string, string>> = {
  en: {
    en: 'English',
    ne: 'Nepali',
    hi: 'Hindi',
  },
  ne: {
    en: 'अंग्रेजी',
    ne: 'नेपाली',
    hi: 'हिन्दी',
  },
  hi: {
    en: 'अंग्रेज़ी',
    ne: 'नेपाली',
    hi: 'हिन्दी',
  },
};

function localeLangCode(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase();
}

/**
 * Resolve how a language should appear in the UI language switcher / chips.
 */
export function resolveLanguageDisplayName(
  option: LanguageNameSource,
  uiLanguageCode?: string | null
): string {
  const code = normalizeUiLanguageCode(option.code);
  const ui = normalizeUiLanguageCode(uiLanguageCode);
  const backendLang = ui.toUpperCase();

  if (option.locales?.length) {
    const match = option.locales.find((l) => localeLangCode(l.language) === backendLang);
    if (match?.name?.trim()) return match.name.trim();
    const en = option.locales.find((l) => localeLangCode(l.language) === 'EN');
    if (en?.name?.trim()) return en.name.trim();
  }

  const fromTable = LANGUAGE_LABELS[ui]?.[code];
  if (fromTable) return fromTable;

  const native = String(option.nativeName ?? '').trim();
  const english = String(option.name ?? option.label ?? '').trim();

  if (ui === code && native) return native;
  if (ui === 'en' && english) return english;
  if (native) return native;
  if (english) return english;
  return code.toUpperCase();
}
