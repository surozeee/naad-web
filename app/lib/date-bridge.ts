/** Bridge BS ↔ AD strings using jQuery Nepali datepicker globals. */

const NEPALI_DIGITS = '०१२३४५६७८९';

type YmdParts = { year: number; month: number; day: number };

export function nepaliToEnglishDigits(s: string): string {
  return s.replace(/[०-९]/g, (c) => {
    const i = NEPALI_DIGITS.indexOf(c);
    return i >= 0 ? String(i) : c;
  });
}

function padYmd(parts: YmdParts): string {
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function parseYmd(value: string): YmdParts | null {
  const normalized = nepaliToEnglishDigits(value.trim());
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1] || '0', 10),
    month: parseInt(match[2] || '0', 10),
    day: parseInt(match[3] || '0', 10),
  };
}

/**
 * Detect BS years for API safety nets.
 * BS for living people is roughly AD+56/57, so years past the near-future AD
 * (e.g. 2046 while today is 2026) are almost always Bikram Sambat.
 * Supported library range is about 1970–2200.
 */
export function looksLikeBsYear(year: number): boolean {
  if (!Number.isFinite(year) || year < 1970 || year > 2200) return false;
  const maxLikelyAd = new Date().getFullYear() + 1;
  // e.g. 2046 BS while current AD is 2026
  if (year > maxLikelyAd) return true;
  // Classic modern BS band still used by older heuristics
  if (year >= 2050) return true;
  return false;
}

export function looksLikeBsYmd(value: string): boolean {
  const parts = parseYmd(value);
  return Boolean(parts && looksLikeBsYear(parts.year));
}

type ConvertFn = (x: YmdParts | string, format?: string | boolean) => YmdParts | string;

type ConvertFns = {
  ad2bs?: ConvertFn;
  bs2ad?: ConvertFn;
};

function wrapPartsOnly(
  fn: ((x: YmdParts) => YmdParts) | undefined
): ConvertFn | undefined {
  if (typeof fn !== 'function') return undefined;
  return (x) => {
    const parts = typeof x === 'string' ? parseYmd(x) : x;
    if (!parts) return x;
    return fn(parts);
  };
}

function getConvertFns(): ConvertFns {
  if (typeof window === 'undefined') return {};
  const w = window as unknown as {
    adtobs?: ConvertFn;
    ad2bs?: ConvertFn;
    bs2ad?: ConvertFn;
    nepaliFunction?: {
      ad2bs?: ConvertFn;
      bs2ad?: ConvertFn;
    };
    NepaliFunctions?: {
      AD2BS?: (x: YmdParts) => YmdParts;
      BS2AD?: (x: YmdParts) => YmdParts;
    };
  };
  return {
    ad2bs:
      w.ad2bs ??
      w.adtobs ??
      w.nepaliFunction?.ad2bs ??
      wrapPartsOnly(w.NepaliFunctions?.AD2BS),
    bs2ad:
      w.bs2ad ??
      w.nepaliFunction?.bs2ad ??
      wrapPartsOnly(w.NepaliFunctions?.BS2AD),
  };
}

function asYmdParts(result: YmdParts | string | null | undefined): YmdParts | null {
  if (!result) return null;
  if (typeof result === 'string') return parseYmd(result);
  if (
    typeof result === 'object' &&
    typeof result.year === 'number' &&
    typeof result.month === 'number' &&
    typeof result.day === 'number'
  ) {
    return result;
  }
  return null;
}

export function isNepaliConvertReady(): boolean {
  const { ad2bs, bs2ad } = getConvertFns();
  return typeof ad2bs === 'function' && typeof bs2ad === 'function';
}

export function adStringToBS(adStr: string): string {
  if (!adStr || !/^\d{4}-\d{2}-\d{2}$/.test(adStr.trim())) return adStr;
  if (looksLikeBsYmd(adStr)) return nepaliToEnglishDigits(adStr.trim()).slice(0, 10);
  if (typeof window === 'undefined') return adStr;
  try {
    const { ad2bs } = getConvertFns();
    if (typeof ad2bs !== 'function') return adStr;
    const parts = parseYmd(adStr);
    if (!parts) return adStr;
    const bs = asYmdParts(ad2bs(parts) as YmdParts | string);
    if (bs) return padYmd(bs);
  } catch {
    /* ignore */
  }
  return adStr;
}

/**
 * Convert a BS YYYY-MM-DD to AD. Always attempts conversion (caller is BS picker / force).
 * Returns '' if the converter is unavailable or conversion fails.
 */
export function bsStringToAD(bsStr: string): string {
  if (!bsStr || typeof bsStr !== 'string') return '';
  const normalized = nepaliToEnglishDigits(bsStr.trim()).slice(0, 10);
  const parts = parseYmd(normalized);
  if (!parts) return '';
  if (typeof window === 'undefined') return '';
  try {
    const { bs2ad } = getConvertFns();
    if (typeof bs2ad !== 'function') return '';
    // Prefer string output from official plugin when available
    const asString = bs2ad(normalized, true);
    if (typeof asString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(asString)) {
      return asString;
    }
    const ad = asYmdParts(bs2ad(parts) as YmdParts | string);
    if (ad) return padYmd(ad);
  } catch {
    /* ignore */
  }
  return '';
}

export type CalendarMode = 'BS' | 'AD';

export type EnsureAdOptions = {
  /** @deprecated Prefer `calendarMode`. When true, treat value as BS. */
  forceBs?: boolean;
  /** Active calendar toggle — drives conversion for API. */
  calendarMode?: CalendarMode;
};

/**
 * Convert a date for API calls using the selected calendar mode.
 * - AD → normalize digits, return as-is
 * - BS → always BS → AD via official converter
 */
export function toApiAdDate(value: string, calendarMode: CalendarMode): string {
  const normalized = nepaliToEnglishDigits((value || '').trim()).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return '';
  if (calendarMode === 'AD') {
    // Safety: if an obvious BS year slipped in while AD is selected, convert it
    if (looksLikeBsYmd(normalized)) return bsStringToAD(normalized) || '';
    return normalized;
  }
  return bsStringToAD(normalized);
}

/** Prefer AD for APIs. Prefer `toApiAdDate(value, calendarMode)` when mode is known. */
export function ensureAdYmd(value: string, options?: EnsureAdOptions): string {
  if (options?.calendarMode) return toApiAdDate(value, options.calendarMode);
  const normalized = nepaliToEnglishDigits((value || '').trim()).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return '';
  const shouldConvert = Boolean(options?.forceBs) || looksLikeBsYmd(normalized);
  if (!shouldConvert) return normalized;
  const ad = bsStringToAD(normalized);
  return ad || (options?.forceBs ? '' : normalized);
}

/** Convert a stored date when the AD/BS toggle changes. */
export function convertBetweenCalendars(
  value: string,
  from: CalendarMode,
  to: CalendarMode
): string {
  const normalized = nepaliToEnglishDigits((value || '').trim()).slice(0, 10);
  if (!normalized || from === to) return normalized;
  if (from === 'AD' && to === 'BS') return adStringToBS(normalized) || normalized;
  if (from === 'BS' && to === 'AD') return bsStringToAD(normalized) || normalized;
  return normalized;
}

export function isNepaliUiLanguage(language: string | null | undefined): boolean {
  const code = String(language ?? '')
    .trim()
    .toLowerCase();
  return code === 'ne' || code === 'np' || code.startsWith('ne-') || code.startsWith('np-');
}

export function defaultCalendarMode(language: string | null | undefined): CalendarMode {
  return isNepaliUiLanguage(language) ? 'BS' : 'AD';
}
