import type { LanguageEnumCode, ZodiacSignEnum, ZodiacSignResponse } from '@/app/lib/crm.types';
import { translateHoroscope } from '@/app/lib/horoscope-i18n';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';

export type ElementTone = 'fire' | 'earth' | 'air' | 'water';

export const ZODIAC_SIGN_ORDER: ZodiacSignEnum[] = [
  'ARIES',
  'TAURUS',
  'GEMINI',
  'CANCER',
  'LEO',
  'VIRGO',
  'LIBRA',
  'SCORPIO',
  'SAGITTARIUS',
  'CAPRICORN',
  'AQUARIUS',
  'PISCES',
];

/** Static glyph + tone fallback when API has no element. */
export const ZODIAC_META: Record<ZodiacSignEnum, { symbol: string; tone: ElementTone }> = {
  ARIES: { symbol: '♈', tone: 'fire' },
  TAURUS: { symbol: '♉', tone: 'earth' },
  GEMINI: { symbol: '♊', tone: 'air' },
  CANCER: { symbol: '♋', tone: 'water' },
  LEO: { symbol: '♌', tone: 'fire' },
  VIRGO: { symbol: '♍', tone: 'earth' },
  LIBRA: { symbol: '♎', tone: 'air' },
  SCORPIO: { symbol: '♏', tone: 'water' },
  SAGITTARIUS: { symbol: '♐', tone: 'fire' },
  CAPRICORN: { symbol: '♑', tone: 'earth' },
  AQUARIUS: { symbol: '♒', tone: 'air' },
  PISCES: { symbol: '♓', tone: 'water' },
};

export function uiCodeToBackendLanguage(uiCode: string): LanguageEnumCode {
  return normalizeUiLanguageCode(uiCode).toUpperCase() as LanguageEnumCode;
}

export function localeLanguageCode(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim().toUpperCase();
  if (typeof raw === 'object' && 'name' in (raw as object)) {
    return String((raw as { name?: string }).name ?? '').trim().toUpperCase();
  }
  return String(raw).trim().toUpperCase();
}

export function findZodiacRow(
  sign: ZodiacSignEnum,
  zodiacRows: ZodiacSignResponse[]
): ZodiacSignResponse | undefined {
  return zodiacRows.find((z) => String(z.zodiacSign).toUpperCase() === sign);
}

export function findLocaleName(
  locales: ZodiacSignResponse['locales'] | undefined,
  language: LanguageEnumCode
): string | null {
  if (!locales?.length) return null;
  const want = String(language).toUpperCase();
  const match = locales.find((l) => localeLanguageCode(l.language) === want);
  const name = match?.name?.trim();
  return name || null;
}

export function findLocaleElement(
  locales: ZodiacSignResponse['locales'] | undefined,
  language: LanguageEnumCode
): string | null {
  if (!locales?.length) return null;
  const want = String(language).toUpperCase();
  const match = locales.find((l) => localeLanguageCode(l.language) === want);
  const element = match?.element?.trim();
  return element || null;
}

export function findLocaleStartingName(
  locales: ZodiacSignResponse['locales'] | undefined,
  language: LanguageEnumCode
): string | null {
  if (!locales?.length) return null;
  const want = String(language).toUpperCase();
  const match = locales.find((l) => localeLanguageCode(l.language) === want);
  const startingName = match?.startingName?.trim();
  return startingName || null;
}

export function elementEnumToTone(element?: string | null): ElementTone | null {
  const key = String(element ?? '').trim().toUpperCase();
  if (key === 'FIRE') return 'fire';
  if (key === 'EARTH') return 'earth';
  if (key === 'AIR') return 'air';
  if (key === 'WATER') return 'water';
  return null;
}

/**
 * Resolve zodiac sign display name from DB locales (zodiac_sign_language), with JSON fallback.
 */
export function resolveZodiacDisplayName(
  sign: ZodiacSignEnum,
  zodiacRows: ZodiacSignResponse[],
  backendLanguage: LanguageEnumCode,
  uiCode: string
): string {
  const row = findZodiacRow(sign, zodiacRows);

  const localized = findLocaleName(row?.locales, backendLanguage);
  if (localized) return localized;

  const fromJson = translateHoroscope(uiCode, `zodiac.${sign}`).trim();
  if (fromJson && fromJson !== `zodiac.${sign}` && !fromJson.startsWith('common.zodiac.')) {
    return fromJson;
  }

  const enName = findLocaleName(row?.locales, 'EN');
  if (enName) return enName;
  if (row?.name?.trim()) return row.name.trim();
  return translateHoroscope('en', `zodiac.${sign}`);
}

export function resolveZodiacElementLabel(
  sign: ZodiacSignEnum,
  zodiacRows: ZodiacSignResponse[],
  backendLanguage: LanguageEnumCode,
  uiCode: string,
  elementLabel: (tone: ElementTone) => string
): string {
  const row = findZodiacRow(sign, zodiacRows);
  const localized = findLocaleElement(row?.locales, backendLanguage);
  if (localized) return localized;
  const enElement = findLocaleElement(row?.locales, 'EN');
  if (enElement) return enElement;
  if (row?.element) {
    const tone = elementEnumToTone(row.element);
    if (tone) return elementLabel(tone);
  }
  return elementLabel(ZODIAC_META[sign].tone);
}

export function resolveZodiacTone(sign: ZodiacSignEnum, zodiacRows: ZodiacSignResponse[]): ElementTone {
  const row = findZodiacRow(sign, zodiacRows);
  return elementEnumToTone(row?.element) ?? ZODIAC_META[sign].tone;
}

export function isUsableZodiacLogoUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;
  if (
    normalized.includes('app-store') ||
    normalized.includes('appstore') ||
    normalized.includes('play.google') ||
    normalized.includes('placeholder')
  ) {
    return false;
  }
  return (
    normalized.startsWith('http') ||
    normalized.startsWith('/') ||
    /\.(svg|png|jpe?g|webp|gif)(\?|#|$)/i.test(url) ||
    normalized.includes('/zodiac/')
  );
}

export function resolveZodiacLogoUrl(sign: ZodiacSignEnum, zodiacRows: ZodiacSignResponse[]): string {
  const row = findZodiacRow(sign, zodiacRows);
  const fromApi = row?.logoUrl?.trim();
  if (fromApi && isUsableZodiacLogoUrl(fromApi)) return fromApi;
  return `/zodiac/${sign.toLowerCase()}.svg`;
}
