import type { ColorLocaleResponse, ColorResponse } from '@/app/lib/master.types';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';
import { translateHoroscope } from '@/app/lib/horoscope-i18n';

/** Fallback Nepali names when API locales are missing (matches ColorDataLoader). */
export const COLOR_NE_FALLBACK: Record<string, string> = {
  red: 'रातो',
  orange: 'सुन्तला',
  amber: 'अम्बर',
  yellow: 'पहेंलो',
  green: 'हरियो',
  teal: 'टिल',
  blue: 'निलो',
  indigo: 'इन्डिगो',
  purple: 'बैजनी',
  pink: 'गुलाबी',
  white: 'सेतो',
  silver: 'चाँदी',
  gold: 'सुनौलो',
  brown: 'खैरो',
  black: 'कालो',
};

function localeLangCode(raw: unknown): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase();
}

/**
 * Resolve display name for a lucky color.
 * Canonical stored value stays English (e.g. "Red"); UI shows locale when available.
 */
export function resolveColorDisplayName(
  canonicalName: string,
  uiLanguageCode?: string | null,
  colors?: ColorResponse[] | null
): string {
  const name = canonicalName.trim();
  if (!name) return '';
  const ui = normalizeUiLanguageCode(uiLanguageCode);
  const backendLang = ui.toUpperCase();

  const row = colors?.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
  if (row?.locales?.length) {
    const match = row.locales.find((l: ColorLocaleResponse) => localeLangCode(l.language) === backendLang);
    if (match?.name?.trim()) return match.name.trim();
    const en = row.locales.find((l) => localeLangCode(l.language) === 'EN');
    if (en?.name?.trim()) return en.name.trim();
  }

  if (ui === 'ne') {
    const fromJson = translateHoroscope(ui, `common.colors.${name.toLowerCase()}`);
    if (fromJson && !fromJson.startsWith('common.colors.')) return fromJson;
    const fallback = COLOR_NE_FALLBACK[name.toLowerCase()];
    if (fallback) return fallback;
  }

  return row?.name?.trim() || name;
}
