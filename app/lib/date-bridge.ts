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

/** BS calendar years for modern dates are typically 2050–2100. */
export function looksLikeBsYear(year: number): boolean {
  return year >= 2050 && year <= 2200;
}

export function looksLikeBsYmd(value: string): boolean {
  const parts = parseYmd(value);
  return Boolean(parts && looksLikeBsYear(parts.year));
}

type ConvertFns = {
  ad2bs?: (x: YmdParts) => YmdParts;
  bs2ad?: (x: YmdParts) => YmdParts;
};

function getConvertFns(): ConvertFns {
  if (typeof window === 'undefined') return {};
  const w = window as unknown as {
    adtobs?: (x: YmdParts) => YmdParts;
    ad2bs?: (x: YmdParts) => YmdParts;
    bs2ad?: (x: YmdParts) => YmdParts;
    nepaliFunction?: {
      ad2bs?: (x: YmdParts) => YmdParts;
      bs2ad?: (x: YmdParts) => YmdParts;
    };
    NepaliFunctions?: {
      AD2BS?: (x: YmdParts) => YmdParts;
      BS2AD?: (x: YmdParts) => YmdParts;
    };
  };
  return {
    ad2bs: w.ad2bs ?? w.adtobs ?? w.nepaliFunction?.ad2bs ?? w.NepaliFunctions?.AD2BS,
    bs2ad: w.bs2ad ?? w.nepaliFunction?.bs2ad ?? w.NepaliFunctions?.BS2AD,
  };
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
    const bs = ad2bs(parts);
    if (bs && typeof bs.year === 'number' && typeof bs.month === 'number' && typeof bs.day === 'number') {
      return padYmd(bs);
    }
  } catch {
    /* ignore */
  }
  return adStr;
}

export function bsStringToAD(bsStr: string): string {
  if (!bsStr || typeof bsStr !== 'string') return '';
  const normalized = nepaliToEnglishDigits(bsStr.trim());
  const parts = parseYmd(normalized);
  if (!parts) return bsStr;
  if (!looksLikeBsYear(parts.year)) return padYmd(parts);
  if (typeof window === 'undefined') return '';
  try {
    const { bs2ad } = getConvertFns();
    if (typeof bs2ad !== 'function') return '';
    const ad = bs2ad(parts);
    if (ad && typeof ad === 'object' && 'year' in ad && 'month' in ad && 'day' in ad) {
      return padYmd(ad);
    }
  } catch {
    /* ignore */
  }
  return '';
}

/** Prefer AD for APIs. Converts BS → AD when needed. */
export function ensureAdYmd(value: string): string {
  const normalized = nepaliToEnglishDigits((value || '').trim()).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return '';
  if (looksLikeBsYmd(normalized)) return bsStringToAD(normalized);
  return normalized;
}

export function isNepaliUiLanguage(language: string | null | undefined): boolean {
  const code = String(language ?? '')
    .trim()
    .toLowerCase();
  return code === 'ne' || code === 'np' || code.startsWith('ne-') || code.startsWith('np-');
}

export type CalendarMode = 'BS' | 'AD';

export function defaultCalendarMode(language: string | null | undefined): CalendarMode {
  return isNepaliUiLanguage(language) ? 'BS' : 'AD';
}
