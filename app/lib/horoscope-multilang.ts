/**
 * Horoscope multilingual helpers.
 * English (EN) → main record fields; other languages → locale rows on the backend.
 */
import type {
  HoroscopeLocaleRequest,
  HoroscopePublishStatusEnum,
  HoroscopeRequest,
  HoroscopeResponse,
  HoroscopeTypeEnum,
  LanguageEnumCode,
  ZodiacSignEnum,
} from '@/app/lib/crm.types';

export type HoroscopeUiLanguage = string;

export const HOROSCOPE_TEXT_FIELDS = [
  'title',
  'summary',
  'description',
  'love',
  'career',
  'money',
  'health',
  'family',
  'education',
  'travel',
  'advice',
  'mood',
] as const;

export type HoroscopeTextField = (typeof HOROSCOPE_TEXT_FIELDS)[number];

/** Per-field text keyed by UI language code (en, np, hi, or future codes). */
export type HoroscopeLocalizedFields = Record<HoroscopeTextField, Record<string, string>>;

export interface HoroscopeLanguageOption {
  uiCode: string;
  label: string;
  backendCode: LanguageEnumCode;
  isBase: boolean;
}

export const DEFAULT_HOROSCOPE_LANGUAGES: HoroscopeLanguageOption[] = [
  { uiCode: 'en', label: 'English', backendCode: 'EN', isBase: true },
  { uiCode: 'np', label: 'Nepali', backendCode: 'NE', isBase: false },
  { uiCode: 'hi', label: 'Hindi', backendCode: 'HI', isBase: false },
];

const LEGACY_UI_BY_BACKEND: Record<string, string> = {
  EN: 'en',
  NE: 'np',
  HI: 'hi',
};

export function backendToUiCode(backendCode: string): string {
  const upper = backendCode.toUpperCase();
  return LEGACY_UI_BY_BACKEND[upper] ?? upper.toLowerCase();
}

/** Merge master language list with defaults; backend can add languages later. */
export function resolveHoroscopeLanguages(
  masterItems?: Array<Record<string, unknown>>
): HoroscopeLanguageOption[] {
  if (!masterItems?.length) return DEFAULT_HOROSCOPE_LANGUAGES;

  const byBackend = new Map<string, HoroscopeLanguageOption>();
  for (const item of masterItems) {
    const backendCode = String(item.code ?? item.name ?? '').trim().toUpperCase();
    if (!backendCode) continue;
    const label = String(item.name ?? item.code ?? backendCode);
    byBackend.set(backendCode, {
      uiCode: backendToUiCode(backendCode),
      label,
      backendCode,
      isBase: backendCode === 'EN',
    });
  }

  for (const fallback of DEFAULT_HOROSCOPE_LANGUAGES) {
    if (!byBackend.has(fallback.backendCode)) byBackend.set(fallback.backendCode, fallback);
  }

  const list = [...byBackend.values()];
  list.sort((a, b) => {
    if (a.isBase) return -1;
    if (b.isBase) return 1;
    return a.label.localeCompare(b.label);
  });
  return list;
}

export function findHoroscopeLanguage(
  languages: HoroscopeLanguageOption[],
  uiCode: string
): HoroscopeLanguageOption | undefined {
  return languages.find((l) => l.uiCode === uiCode);
}

export function getBaseHoroscopeLanguage(
  languages: HoroscopeLanguageOption[]
): HoroscopeLanguageOption {
  return languages.find((l) => l.isBase) ?? languages[0] ?? DEFAULT_HOROSCOPE_LANGUAGES[0];
}

export interface HoroscopeMultilangEntry {
  zodiacSign: ZodiacSignEnum;
  horoscopeType: HoroscopeTypeEnum;
  startDate: string;
  endDate: string;
  luckyNumber: string;
  luckyColor: string;
  luckyTime: string;
  loveRating?: number;
  careerRating?: number;
  moneyRating?: number;
  healthRating?: number;
  overallRating?: number;
  publishStatus?: HoroscopePublishStatusEnum;
  localized: HoroscopeLocalizedFields;
}

export function createEmptyLocalizedFields(
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): HoroscopeLocalizedFields {
  const empty: Record<string, string> = {};
  for (const lang of languages) empty[lang.uiCode] = '';
  return HOROSCOPE_TEXT_FIELDS.reduce((acc, field) => {
    acc[field] = { ...empty };
    return acc;
  }, {} as HoroscopeLocalizedFields);
}

export function createEmptyLocalesMap(
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): Record<string, HoroscopeLocaleRequest> {
  const map: Record<string, HoroscopeLocaleRequest> = {};
  for (const lang of languages) {
    if (!lang.isBase) map[lang.backendCode] = { language: lang.backendCode };
  }
  return map;
}

export function localesFromResponse(
  row: HoroscopeResponse,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): Record<string, HoroscopeLocaleRequest> {
  const map = createEmptyLocalesMap(languages);
  for (const loc of row.locales ?? []) {
    const code = String(loc.language).toUpperCase();
    if (map[code] !== undefined) map[code] = { ...loc, language: code };
  }
  return map;
}

export function getHoroscopeTextForLanguage(
  row: HoroscopeResponse,
  field: HoroscopeTextField,
  lang: HoroscopeLanguageOption
): string {
  if (lang.isBase) return (row[field] as string | undefined) ?? '';
  const locale = row.locales?.find(
    (l) => String(l.language).toUpperCase() === String(lang.backendCode).toUpperCase()
  );
  return locale?.[field] ?? '';
}

export function hasHoroscopeTranslation(
  row: HoroscopeResponse,
  lang: HoroscopeLanguageOption
): boolean {
  if (lang.isBase) return Boolean(row.title?.trim() || row.summary?.trim());
  const locale = row.locales?.find(
    (l) => String(l.language).toUpperCase() === String(lang.backendCode).toUpperCase()
  );
  if (!locale) return false;
  return HOROSCOPE_TEXT_FIELDS.some((f) => Boolean(locale[f]?.trim()));
}

function pickField(value: string, fallback: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed) return trimmed;
  const fb = fallback.trim();
  return fb || undefined;
}

function hasLocaleContent(row: HoroscopeLocaleRequest): boolean {
  return HOROSCOPE_TEXT_FIELDS.some((f) => Boolean(row[f]?.trim()));
}

function buildLocaleRow(
  language: LanguageEnumCode,
  uiCode: string,
  localized: HoroscopeLocalizedFields,
  en: Record<HoroscopeTextField, string>
): HoroscopeLocaleRequest | null {
  const row: HoroscopeLocaleRequest = { language };
  let hasContent = false;

  for (const field of HOROSCOPE_TEXT_FIELDS) {
    const value = pickField(localized[field][uiCode] ?? '', en[field]);
    if (value) {
      row[field] = value;
      hasContent = true;
    }
  }

  return hasContent ? row : null;
}

/** Maps UI/CSV entry to backend HoroscopeRequest (base language + locale rows). */
export function buildHoroscopeRequest(
  entry: HoroscopeMultilangEntry,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): HoroscopeRequest {
  const base = getBaseHoroscopeLanguage(languages);
  const en = HOROSCOPE_TEXT_FIELDS.reduce((acc, field) => {
    acc[field] = (entry.localized[field][base.uiCode] ?? '').trim();
    return acc;
  }, {} as Record<HoroscopeTextField, string>);

  const locales: HoroscopeLocaleRequest[] = [];
  for (const lang of languages) {
    if (lang.isBase) continue;
    const row = buildLocaleRow(lang.backendCode, lang.uiCode, entry.localized, en);
    if (row && hasLocaleContent(row)) locales.push(row);
  }

  return {
    zodiacSign: entry.zodiacSign,
    horoscopeType: entry.horoscopeType,
    startDate: entry.startDate,
    endDate: entry.endDate,
    title: en.title || undefined,
    summary: en.summary || undefined,
    description: en.description || undefined,
    love: en.love || undefined,
    career: en.career || undefined,
    money: en.money || undefined,
    health: en.health || undefined,
    family: en.family || undefined,
    education: en.education || undefined,
    travel: en.travel || undefined,
    advice: en.advice || undefined,
    mood: en.mood || undefined,
    luckyNumber: entry.luckyNumber.trim() || undefined,
    luckyColor: entry.luckyColor.trim() || undefined,
    luckyTime: entry.luckyTime.trim() || undefined,
    loveRating: entry.loveRating,
    careerRating: entry.careerRating,
    moneyRating: entry.moneyRating,
    healthRating: entry.healthRating,
    overallRating: entry.overallRating,
    publishStatus: entry.publishStatus ?? 'DRAFT',
    locales,
  };
}

export function validateHoroscopeMultilangEntry(
  entry: HoroscopeMultilangEntry,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): string | null {
  const base = getBaseHoroscopeLanguage(languages);
  if (!entry.zodiacSign) return 'Zodiac sign is required';
  if (!entry.horoscopeType) return 'Horoscope type is required';
  if (!entry.startDate?.trim()) return 'Start date is required';
  if (!entry.endDate?.trim()) return 'End date is required';
  if (!entry.localized.title[base.uiCode]?.trim()) return `${base.label} title is required`;
  if (!entry.localized.summary[base.uiCode]?.trim()) return `${base.label} summary is required`;
  return null;
}
