import type { HoroscopeTypeEnum } from '@/app/lib/crm.types';
import type { NepaliCalendarResponse } from '@/app/lib/master.types';

export type BsDateParts = { year: number; month: number; day: number };

export const BS_MONTH_OPTIONS = [
  { value: 1, label: 'Baishakh' },
  { value: 2, label: 'Jestha' },
  { value: 3, label: 'Asar' },
  { value: 4, label: 'Shrawan' },
  { value: 5, label: 'Bhadra' },
  { value: 6, label: 'Ashoj' },
  { value: 7, label: 'Kartik' },
  { value: 8, label: 'Mangsir' },
  { value: 9, label: 'Poush' },
  { value: 10, label: 'Magh' },
  { value: 11, label: 'Falgun' },
  { value: 12, label: 'Chaitra' },
] as const;

const BS_MONTH_DAY_KEYS = [
  'baishakhDay',
  'jesthaDay',
  'asarDay',
  'shrawanDay',
  'bhadraDay',
  'ashojDay',
  'kartikDay',
  'mangsirDay',
  'poushDay',
  'maghDay',
  'falgunDay',
  'chaitraDay',
] as const;

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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatBsIso(parts: BsDateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function parseBsIso(value: string): BsDateParts | null {
  const normalized = convertNepaliDigits(String(value ?? '').trim());
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** Sunday–Saturday week containing the anchor date (AD fallback). */
export function getWeekRangeSundayToSaturday(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/** 1st → last day of the anchor month (AD fallback). */
export function getMonthRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0, 0);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12, 0, 0, 0);
  return { start, end };
}

/** Jan 1 → Dec 31 of the anchor year (AD fallback). */
export function getYearRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), 0, 1, 12, 0, 0, 0);
  const end = new Date(anchor.getFullYear(), 11, 31, 12, 0, 0, 0);
  return { start, end };
}

/**
 * Calendar weeks within a BS month:
 * - Week 1: day 1 → first Saturday
 * - Later weeks: Sunday → Saturday (clipped to month end)
 */
export function listBsMonthWeekRanges(
  year: number,
  month: number,
  daysInMonth: number,
  calendar?: NepaliCalendarResponse | null
): { startDay: number; endDay: number }[] {
  const firstSat = firstSaturdayDayInBsMonth(year, month, daysInMonth, calendar);
  const ranges: { startDay: number; endDay: number }[] = [
    { startDay: 1, endDay: firstSat },
  ];
  let start = firstSat + 1;
  while (start <= daysInMonth) {
    const end = Math.min(start + 6, daysInMonth);
    ranges.push({ startDay: start, endDay: end });
    start = end + 1;
  }
  return ranges;
}

/** Day-of-month of the first Saturday in a BS month (1-based). */
export function firstSaturdayDayInBsMonth(
  year: number,
  month: number,
  daysInMonth: number,
  _calendar?: NepaliCalendarResponse | null
): number {
  const ad = bsIsoToAdDate(formatBsIso({ year, month, day: 1 }));
  if (!ad) {
    return Math.min(7, daysInMonth);
  }
  // JS: 0 = Sunday … 6 = Saturday
  const dow = ad.getDay();
  const offsetToSaturday = (6 - dow + 7) % 7;
  return Math.min(1 + offsetToSaturday, daysInMonth);
}

export function weekOfBsMonth(
  day: number,
  year: number,
  month: number,
  daysInMonth: number,
  calendar?: NepaliCalendarResponse | null
): number {
  const ranges = listBsMonthWeekRanges(year, month, daysInMonth, calendar);
  const d = Math.max(1, day);
  for (let i = 0; i < ranges.length; i += 1) {
    if (d >= ranges[i].startDay && d <= ranges[i].endDay) return i + 1;
  }
  return ranges.length || 1;
}

export function bsWeekDayRange(
  week: number,
  year: number,
  month: number,
  daysInMonth: number,
  calendar?: NepaliCalendarResponse | null
): { startDay: number; endDay: number } {
  const ranges = listBsMonthWeekRanges(year, month, daysInMonth, calendar);
  if (!ranges.length) {
    return { startDay: 1, endDay: daysInMonth };
  }
  const w = Math.min(Math.max(1, week), ranges.length);
  return ranges[w - 1];
}

export function maxWeeksInBsMonth(
  year: number,
  month: number,
  daysInMonth: number,
  calendar?: NepaliCalendarResponse | null
): number {
  return listBsMonthWeekRanges(year, month, daysInMonth, calendar).length;
}

export function getBsMonthDayCountFromCalendar(
  calendar: NepaliCalendarResponse | null | undefined,
  month: number
): number | null {
  const key = BS_MONTH_DAY_KEYS[month - 1];
  if (!key || !calendar) return null;
  const value = calendar[key];
  return typeof value === 'number' && value > 0 ? value : null;
}

/** Days in a BS month — master calendar first, then probe converters. */
export function getBsDaysInMonth(
  year: number,
  month: number,
  calendar?: NepaliCalendarResponse | null
): number {
  const fromMaster = getBsMonthDayCountFromCalendar(calendar, month);
  if (fromMaster != null) return fromMaster;

  for (let day = 32; day >= 28; day -= 1) {
    if (bsIsoToAdDate(formatBsIso({ year, month, day }))) return day;
  }

  const first = bsIsoToAdDate(formatBsIso({ year, month, day: 1 }));
  const nextMonth = month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 };
  const next = bsIsoToAdDate(formatBsIso(nextMonth));
  if (first && next) {
    return Math.round((next.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 30;
}

export function resolveBsWeekPeriod(
  year: number,
  month: number,
  week: number,
  calendar?: NepaliCalendarResponse | null
): { startDate: string; endDate: string; startBs: string; endBs: string } | null {
  const daysInMonth = getBsDaysInMonth(year, month, calendar);
  const maxWeek = maxWeeksInBsMonth(year, month, daysInMonth, calendar);
  const w = Math.min(Math.max(1, week), maxWeek);
  const { startDay, endDay } = bsWeekDayRange(w, year, month, daysInMonth, calendar);
  const startBs = formatBsIso({ year, month, day: startDay });
  const endBs = formatBsIso({ year, month, day: endDay });
  const startAd = bsIsoToAdIso(startBs);
  const endAd = bsIsoToAdIso(endBs);
  if (!startAd || !endAd) return null;
  return { startDate: startAd, endDate: endAd, startBs, endBs };
}

export function resolveBsMonthPeriod(
  year: number,
  month: number,
  calendar?: NepaliCalendarResponse | null
): { startDate: string; endDate: string; startBs: string; endBs: string } | null {
  const daysInMonth = getBsDaysInMonth(year, month, calendar);
  const startBs = formatBsIso({ year, month, day: 1 });
  const endBs = formatBsIso({ year, month, day: daysInMonth });
  const startAd = bsIsoToAdIso(startBs);
  const endAd = bsIsoToAdIso(endBs);
  if (!startAd || !endAd) return null;
  return { startDate: startAd, endDate: endAd, startBs, endBs };
}

export function resolveBsYearPeriod(
  year: number,
  calendarByYear?: Record<number, NepaliCalendarResponse>
): { startDate: string; endDate: string; startBs: string; endBs: string } | null {
  const startBs = formatBsIso({ year, month: 1, day: 1 });
  const chaitraDays = getBsDaysInMonth(year, 12, calendarByYear?.[year] ?? null);
  const endBs = formatBsIso({ year, month: 12, day: chaitraDays });
  const startAd = bsIsoToAdIso(startBs);
  const endAd = bsIsoToAdIso(endBs);
  if (!startAd || !endAd) return null;
  return { startDate: startAd, endDate: endAd, startBs, endBs };
}

/**
 * Resolve start/end dates for a horoscope period from a single anchor AD date.
 * WEEKLY / MONTHLY / YEARLY use Bikram Sambat when converters are available.
 */
export function resolveHoroscopePeriodDates(
  type: HoroscopeTypeEnum,
  anchorIso: string,
  calendarByYear?: Record<number, NepaliCalendarResponse>
): { startDate: string; endDate: string } {
  const anchor = parseIsoDate(anchorIso) ?? new Date();
  const bs = adDateToBsParts(anchor);

  if (type === 'DAILY') {
    const day = formatIsoDate(anchor);
    return { startDate: day, endDate: day };
  }

  if (bs) {
    const calendar = calendarByYear?.[bs.year] ?? null;
    if (type === 'WEEKLY') {
      const daysInMonth = getBsDaysInMonth(bs.year, bs.month, calendar);
      const week = weekOfBsMonth(bs.day, bs.year, bs.month, daysInMonth, calendar);
      const resolved = resolveBsWeekPeriod(bs.year, bs.month, week, calendar);
      if (resolved) return { startDate: resolved.startDate, endDate: resolved.endDate };
    }
    if (type === 'MONTHLY') {
      const resolved = resolveBsMonthPeriod(bs.year, bs.month, calendar);
      if (resolved) return { startDate: resolved.startDate, endDate: resolved.endDate };
    }
    if (type === 'YEARLY') {
      const resolved = resolveBsYearPeriod(bs.year, calendarByYear);
      if (resolved) return { startDate: resolved.startDate, endDate: resolved.endDate };
    }
  }

  // AD fallbacks when BS converters are unavailable
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
  if (type === 'DAILY') return 'One BS date';
  if (type === 'WEEKLY') return 'Year · month · week → 1st–Sat, then Sun–Sat';
  if (type === 'MONTHLY') return 'Year · month → 1st–last';
  return 'Year → 1 Baishakh–last Chaitra';
}

/** Week option label including BS start day for the selected week. */
export function formatBsWeekOptionLabel(
  year: number,
  month: number,
  week: number,
  calendar?: NepaliCalendarResponse | null
): string {
  const resolved = resolveBsWeekPeriod(year, month, week, calendar);
  if (!resolved) return `Week ${week}`;
  return `Week ${week} · starts ${resolved.startBs}`;
}

const BS_MONTH_NAME_TO_NUM: Record<string, number> = {
  baishakh: 1,
  baisakh: 1,
  jestha: 2,
  asar: 3,
  ashadh: 3,
  shrawan: 4,
  saun: 4,
  bhadra: 5,
  ashoj: 6,
  ashwin: 6,
  kartik: 7,
  mangsir: 8,
  poush: 9,
  magh: 10,
  falgun: 11,
  chaitra: 12,
};

export function parseBsMonthValue(raw?: string | null): number | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toLowerCase();
  if (/^\d{1,2}$/.test(t)) {
    const n = Number(t);
    return n >= 1 && n <= 12 ? n : null;
  }
  return BS_MONTH_NAME_TO_NUM[t] ?? null;
}

/**
 * Resolve AD start/end from CSV period columns:
 * - DAILY: `date` (BS preferred) or legacy startDate
 * - WEEKLY: bsYear + bsMonth + bsWeek
 * - MONTHLY: bsYear + bsMonth
 * - YEARLY: bsYear
 * Falls back to startDate/endDate when present.
 */
export function resolvePeriodDatesFromCsvFields(input: {
  horoscopeType: HoroscopeTypeEnum;
  date?: string;
  bsYear?: string;
  bsMonth?: string;
  bsWeek?: string;
  startDate?: string;
  endDate?: string;
}): { startDate: string; endDate: string } | null {
  const type = input.horoscopeType;

  if (type === 'DAILY') {
    const raw = (input.date || input.startDate || '').trim();
    if (!raw) return null;
    const parts = parseBsIso(raw);
    if (parts) {
      // BS years for modern dates are ~2070+; AD years are ~2000–2050.
      const preferBs = parts.year >= 2070;
      if (preferBs) {
        const ad = bsIsoToAdIso(raw);
        if (ad) return { startDate: ad, endDate: ad };
      }
      const adDirect = parseIsoDate(raw);
      if (adDirect) {
        const iso = formatIsoDate(adDirect);
        return { startDate: iso, endDate: iso };
      }
      if (!preferBs) {
        const ad = bsIsoToAdIso(raw);
        if (ad) return { startDate: ad, endDate: ad };
      }
    }
    return null;
  }

  const year = Number(String(input.bsYear ?? '').trim());
  if (type === 'YEARLY') {
    if (!Number.isFinite(year) || year < 1970) {
      // legacy
      if (input.startDate && input.endDate) {
        return { startDate: input.startDate, endDate: input.endDate };
      }
      return null;
    }
    return resolveBsYearPeriod(year) ?? null;
  }

  const month = parseBsMonthValue(input.bsMonth);
  if (type === 'MONTHLY') {
    if (!Number.isFinite(year) || !month) {
      if (input.startDate && input.endDate) {
        return { startDate: input.startDate, endDate: input.endDate };
      }
      return null;
    }
    return resolveBsMonthPeriod(year, month) ?? null;
  }

  if (type === 'WEEKLY') {
    const week = Number(String(input.bsWeek ?? '1').trim()) || 1;
    if (!Number.isFinite(year) || !month) {
      if (input.startDate && input.endDate) {
        return { startDate: input.startDate, endDate: input.endDate };
      }
      return null;
    }
    return resolveBsWeekPeriod(year, month, week) ?? null;
  }

  return null;
}

/** Derive weekly/monthly/yearly dropdown state from an AD start date. */
export function deriveBsPeriodSelection(startDateAd: string): {
  year: number;
  month: number;
  week: number;
} {
  const ad = parseIsoDate(startDateAd) ?? new Date();
  const bs = adDateToBsParts(ad);
  if (bs) {
    const daysInMonth = getBsDaysInMonth(bs.year, bs.month);
    return {
      year: bs.year,
      month: bs.month,
      week: weekOfBsMonth(bs.day, bs.year, bs.month, daysInMonth),
    };
  }
  // Rough fallback if converters unavailable
  const approxYear = ad.getFullYear() + 57;
  return { year: approxYear, month: ad.getMonth() + 1, week: 1 };
}

export function buildBsYearOptions(
  calendars: NepaliCalendarResponse[],
  preferredYear?: number
): number[] {
  const fromMaster = calendars
    .map((c) => c.year)
    .filter((y): y is number => typeof y === 'number' && y > 0);
  if (fromMaster.length) {
    const years = new Set(fromMaster);
    if (preferredYear && preferredYear > 0) years.add(preferredYear);
    return [...years].sort((a, b) => a - b);
  }
  const center = preferredYear ?? deriveBsPeriodSelection(formatIsoDate(new Date())).year;
  const years: number[] = [];
  for (let y = center - 10; y <= center + 2; y += 1) years.push(y);
  return years;
}

function convertNepaliDigits(value: string): string {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return value.replace(/[०-९]/g, (ch) => map[ch] ?? ch);
}

export function adDateToBsParts(date: Date): BsDateParts | null {
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
    return { year: bs.year, month: bs.month, day: bs.day };
  } catch {
    return null;
  }
}

/** Convert AD Date → BS YYYY-MM-DD when converters are available. */
export function adDateToBsIso(date: Date): string | null {
  const parts = adDateToBsParts(date);
  return parts ? formatBsIso(parts) : null;
}

/** Convert BS YYYY-MM-DD → AD Date when converters are available. */
export function bsIsoToAdDate(bsIso: string): Date | null {
  if (typeof window === 'undefined') return null;
  const parts = parseBsIso(bsIso);
  if (!parts) return null;
  try {
    const bs2ad =
      (window as Window & { bs2ad?: Function; nepaliFunction?: { bs2ad?: Function } }).bs2ad ||
      (window as Window & { nepaliFunction?: { bs2ad?: Function } }).nepaliFunction?.bs2ad;
    if (typeof bs2ad !== 'function') return null;
    const ad = bs2ad({
      year: parts.year,
      month: parts.month,
      day: parts.day,
    }) as { year?: number; month?: number; day?: number };
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
