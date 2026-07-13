import type { HoroscopeTypeEnum } from '@/app/lib/crm.types';

/** Format a local Date as YYYY-MM-DD (AD). */
export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as a local Date (noon to avoid DST edge cases). */
export function parseIsoDate(value: string): Date | null {
  const match = String(value ?? '')
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Sunday–Saturday week containing the anchor date. */
export function getWeekRangeSundayToSaturday(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  return { start, end };
}

/** 1st → last day of the anchor month. */
export function getMonthRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0, 0);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12, 0, 0, 0);
  return { start, end };
}

/** Jan 1 → Dec 31 of the anchor year. */
export function getYearRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), 0, 1, 12, 0, 0, 0);
  const end = new Date(anchor.getFullYear(), 11, 31, 12, 0, 0, 0);
  return { start, end };
}

/**
 * Resolve start/end dates for a horoscope period from a single anchor AD date.
 * - DAILY: same day
 * - WEEKLY: Sunday–Saturday
 * - MONTHLY: 1st–last of month
 * - YEARLY: Jan 1–Dec 31
 */
export function resolveHoroscopePeriodDates(
  type: HoroscopeTypeEnum,
  anchorIso: string
): { startDate: string; endDate: string } {
  const anchor = parseIsoDate(anchorIso) ?? new Date();
  if (type === 'DAILY') {
    const day = formatIsoDate(anchor);
    return { startDate: day, endDate: day };
  }
  if (type === 'WEEKLY') {
    const { start, end } = getWeekRangeSundayToSaturday(anchor);
    return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
  }
  if (type === 'MONTHLY') {
    const { start, end } = getMonthRange(anchor);
    return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
  }
  const { start, end } = getYearRange(anchor);
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) };
}

export function periodDateHint(type: HoroscopeTypeEnum): string {
  if (type === 'DAILY') return 'Pick one day';
  if (type === 'WEEKLY') return 'Week runs Sunday → Saturday';
  if (type === 'MONTHLY') return 'Month runs 1st → last day';
  return 'Year runs Jan 1 → Dec 31';
}

export type CalendarMode = 'AD' | 'BS';

function convertNepaliDigits(value: string): string {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return value.replace(/[०-९]/g, (ch) => map[ch] ?? ch);
}

/** Convert AD Date → BS YYYY-MM-DD when converters are available. */
export function adDateToBsIso(date: Date): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const ad2bs =
      (window as Window & { adtobs?: Function; ad2bs?: Function; nepaliFunction?: { ad2bs?: Function } })
        .adtobs ||
      (window as Window & { ad2bs?: Function }).ad2bs ||
      (window as Window & { nepaliFunction?: { ad2bs?: Function } }).nepaliFunction?.ad2bs;
    if (typeof ad2bs !== 'function') return null;
    const bs = ad2bs({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    }) as { year?: number; month?: number; day?: number };
    if (
      typeof bs?.year !== 'number' ||
      typeof bs?.month !== 'number' ||
      typeof bs?.day !== 'number'
    ) {
      return null;
    }
    return `${String(bs.year).padStart(4, '0')}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

/** Convert BS YYYY-MM-DD → AD Date when converters are available. */
export function bsIsoToAdDate(bsIso: string): Date | null {
  if (typeof window === 'undefined') return null;
  const normalized = convertNepaliDigits(String(bsIso ?? '').trim());
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  try {
    const bs2ad =
      (window as Window & { bs2ad?: Function; nepaliFunction?: { bs2ad?: Function } }).bs2ad ||
      (window as Window & { nepaliFunction?: { bs2ad?: Function } }).nepaliFunction?.bs2ad;
    if (typeof bs2ad !== 'function') return null;
    const ad = bs2ad({ year, month, day }) as { year?: number; month?: number; day?: number };
    if (
      typeof ad?.year !== 'number' ||
      typeof ad?.month !== 'number' ||
      typeof ad?.day !== 'number'
    ) {
      return null;
    }
    return new Date(ad.year, ad.month - 1, ad.day, 12, 0, 0, 0);
  } catch {
    return null;
  }
}

export function adIsoToBsIso(adIso: string): string {
  const ad = parseIsoDate(adIso);
  if (!ad) return '';
  return adDateToBsIso(ad) ?? '';
}

export function bsIsoToAdIso(bsIso: string): string {
  const ad = bsIsoToAdDate(bsIso);
  return ad ? formatIsoDate(ad) : '';
}
