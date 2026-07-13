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
  'summary',
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
  { uiCode: 'ne', label: 'Nepali', backendCode: 'NE', isBase: false },
  { uiCode: 'hi', label: 'Hindi', backendCode: 'HI', isBase: false },
];

/** Valid half-star rating values (0.0–5.0 step 0.5). */
export const HOROSCOPE_RATING_STEPS = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
] as const;

export type HoroscopeRatingValue = (typeof HOROSCOPE_RATING_STEPS)[number];

export function isValidHoroscopeRating(value: number | null | undefined): boolean {
  if (value == null || Number.isNaN(value)) return true;
  if (value < 0 || value > 5) return false;
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
}

/** Round to nearest 0.5 within 0–5. */
export function roundHoroscopeRating(value: number): number {
  const clamped = Math.min(5, Math.max(0, value));
  return Math.round(clamped * 2) / 2;
}

/**
 * Overall = average of set category ratings, rounded to 0.5.
 * Returns undefined when no category ratings are set.
 */
export function computeOverallRating(ratings: {
  loveRating?: number | null;
  careerRating?: number | null;
  moneyRating?: number | null;
  healthRating?: number | null;
  familyRating?: number | null;
  educationRating?: number | null;
  travelRating?: number | null;
  luckRating?: number | null;
}): number | undefined {
  const values = [
    ratings.loveRating,
    ratings.careerRating,
    ratings.moneyRating,
    ratings.healthRating,
    ratings.familyRating,
    ratings.educationRating,
    ratings.travelRating,
    ratings.luckRating,
  ].filter((v): v is number => v != null && !Number.isNaN(v));
  if (!values.length) return undefined;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return roundHoroscopeRating(avg);
}

const LEGACY_UI_BY_BACKEND: Record<string, string> = {
  EN: 'en',
  NE: 'ne',
  HI: 'hi',
};

/** Prefer ISO for UI code; LanguageEnum code lowercased otherwise. */
function resolveUiCode(backendCode: string, iso?: string): string {
  const normalizedIso = String(iso ?? '').trim().toLowerCase();
  if (normalizedIso) return normalizedIso === 'np' ? 'ne' : normalizedIso;
  return backendToUiCode(backendCode);
}

export function backendToUiCode(backendCode: string): string {
  const upper = backendCode.toUpperCase();
  return LEGACY_UI_BY_BACKEND[upper] ?? upper.toLowerCase();
}

/**
 * Build horoscope language options from **active Language master list only**.
 * Pass the API result from language/list-active. Empty list → empty tabs (no hardcoded languages).
 * Use DEFAULT_HOROSCOPE_LANGUAGES only as a temporary UI boot state before the API returns.
 */
export function resolveHoroscopeLanguages(
  masterItems?: Array<Record<string, unknown>> | null
): HoroscopeLanguageOption[] {
  if (!masterItems) return DEFAULT_HOROSCOPE_LANGUAGES;
  if (masterItems.length === 0) return [];

  const byBackend = new Map<string, HoroscopeLanguageOption>();
  for (const item of masterItems) {
    const backendCode = String(item.code ?? '').trim().toUpperCase();
    if (!backendCode) continue;
    const iso = String(item.iso ?? item.isoCode ?? item.iso639 ?? '').trim();
    const label = String(item.name ?? item.nativeName ?? item.code ?? backendCode);
    const isDefault = item.isDefault === true || item.isDefault === 'true' || item.isDefault === 1;
    byBackend.set(backendCode, {
      uiCode: resolveUiCode(backendCode, iso),
      label,
      backendCode,
      isBase: isDefault || backendCode === 'EN',
    });
  }

  const list = [...byBackend.values()];
  if (list.length === 0) return [];

  const hasBase = list.some((l) => l.isBase);
  if (!hasBase) {
    const en = list.find((l) => l.backendCode === 'EN');
    if (en) en.isBase = true;
    else list[0].isBase = true;
  } else if (list.filter((l) => l.isBase).length > 1) {
    const keep = list.find((l) => l.backendCode === 'EN' && l.isBase) ?? list.find((l) => l.isBase)!;
    for (const l of list) {
      if (l !== keep) l.isBase = false;
    }
  }

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
  familyRating?: number;
  educationRating?: number;
  travelRating?: number;
  luckRating?: number;
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
  if (lang.isBase) return Boolean(row.summary?.trim());
  const locale = row.locales?.find(
    (l) => String(l.language).toUpperCase() === String(lang.backendCode).toUpperCase()
  );
  if (!locale) return false;
  return HOROSCOPE_TEXT_FIELDS.some((f) => Boolean(locale[f]?.trim()));
}

function hasLocaleContent(row: HoroscopeLocaleRequest): boolean {
  return HOROSCOPE_TEXT_FIELDS.some((f) => Boolean(row[f]?.trim()));
}

/** Locale rows carry only that language's text — never copy base/EN as a fallback. */
function buildLocaleRow(
  language: LanguageEnumCode,
  uiCode: string,
  localized: HoroscopeLocalizedFields
): HoroscopeLocaleRequest | null {
  const row: HoroscopeLocaleRequest = { language };
  let hasContent = false;

  for (const field of HOROSCOPE_TEXT_FIELDS) {
    const value = (localized[field][uiCode] ?? '').trim();
    if (value) {
      row[field] = value;
      hasContent = true;
    }
  }

  return hasContent ? row : null;
}

function isIsoDate(value: string | undefined | null): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/** Maps UI/CSV entry to backend HoroscopeRequest (base language + locale rows). */
export function buildHoroscopeRequest(
  entry: HoroscopeMultilangEntry,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): HoroscopeRequest {
  const langs = languages.length ? languages : DEFAULT_HOROSCOPE_LANGUAGES;
  const base = getBaseHoroscopeLanguage(langs);
  const en = HOROSCOPE_TEXT_FIELDS.reduce((acc, field) => {
    acc[field] = (entry.localized[field][base.uiCode] ?? '').trim();
    return acc;
  }, {} as Record<HoroscopeTextField, string>);

  const locales: HoroscopeLocaleRequest[] = [];
  for (const lang of langs) {
    if (lang.isBase) continue;
    const backendCode = String(lang.backendCode ?? '')
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(backendCode)) continue;
    const row = buildLocaleRow(backendCode, lang.uiCode, entry.localized);
    if (row && hasLocaleContent(row)) locales.push(row);
  }

  const sanitizeRating = (value?: number | null): number | undefined => {
    if (value == null || Number.isNaN(Number(value))) return undefined;
    const n = Number(value);
    if (!isValidHoroscopeRating(n)) return roundHoroscopeRating(n);
    return n;
  };

  const startDate = isIsoDate(entry.startDate) ? entry.startDate.trim() : entry.startDate;
  const endDate = isIsoDate(entry.endDate) ? entry.endDate.trim() : entry.endDate;

  return {
    zodiacSign: entry.zodiacSign,
    horoscopeType: entry.horoscopeType,
    startDate,
    endDate,
    summary: en.summary || undefined,
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
    loveRating: sanitizeRating(entry.loveRating),
    careerRating: sanitizeRating(entry.careerRating),
    moneyRating: sanitizeRating(entry.moneyRating),
    healthRating: sanitizeRating(entry.healthRating),
    familyRating: sanitizeRating(entry.familyRating),
    educationRating: sanitizeRating(entry.educationRating),
    travelRating: sanitizeRating(entry.travelRating),
    luckRating: sanitizeRating(entry.luckRating),
    // overallRating is derived server-side from category ratings
    publishStatus: entry.publishStatus ?? 'DRAFT',
    locales,
  };
}

export function validateHoroscopeMultilangEntry(
  entry: HoroscopeMultilangEntry,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): string | null {
  if (!entry.zodiacSign) return 'Zodiac sign is required';
  if (!entry.horoscopeType) return 'Horoscope type is required';
  if (!entry.startDate?.trim()) return 'Start date is required';
  if (!entry.endDate?.trim()) return 'End date is required';
  if (entry.horoscopeType === 'DAILY' && entry.startDate !== entry.endDate) {
    return 'Daily horoscope start and end dates must be the same';
  }
  if (entry.endDate < entry.startDate) return 'End date must not be before start date';

  const ratingFields: Array<[string, number | undefined]> = [
    ['Love', entry.loveRating],
    ['Career', entry.careerRating],
    ['Finance', entry.moneyRating],
    ['Health', entry.healthRating],
    ['Family', entry.familyRating],
    ['Education', entry.educationRating],
    ['Travel', entry.travelRating],
    ['Luck', entry.luckRating],
  ];
  for (const [label, value] of ratingFields) {
    if (!isValidHoroscopeRating(value)) {
      return `${label} rating must be 0.0–5.0 in steps of 0.5`;
    }
  }
  if (!languages.length) return 'No active languages configured';
  return null;
}
