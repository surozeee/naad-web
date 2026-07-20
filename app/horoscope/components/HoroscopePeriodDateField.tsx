'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { NepaliDatepicker, ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { nepaliCalendarApi } from '@/app/lib/master.service';
import { publicNepaliCalendarApi } from '@/app/lib/public-horoscope';
import type { HoroscopeTypeEnum } from '@/app/lib/crm.types';
import type { NepaliCalendarResponse } from '@/app/lib/master.types';
import {
  BS_MONTH_OPTIONS,
  adIsoToBsIso,
  bsIsoToAdIso,
  bsMonthLabel,
  buildBsYearOptions,
  deriveBsPeriodSelection,
  formatBsWeekOptionLabel,
  getBsDaysInMonth,
  maxWeeksInBsMonth,
  periodDateHint,
  resolveBsMonthPeriod,
  resolveBsWeekPeriod,
  resolveBsYearPeriod,
  resolveHoroscopePeriodDates,
} from '@/app/lib/horoscope-date-period';
import { useLocale } from '@/app/components/LocaleProvider';
import { localizeDigits } from '@/app/lib/nepali-digits';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';

interface HoroscopePeriodDateFieldProps {
  horoscopeType: HoroscopeTypeEnum;
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
  className?: string;
  /** Hide helper hints / range footers (list toolbar). */
  compact?: boolean;
  /**
   * Peer fields in one horizontal row (same label/input height as Zodiac).
   * Daily: Date · Weekly: Year+Month+Week · Monthly: Year+Month · Yearly: Year
   */
  inline?: boolean;
  /** Use public (unauthenticated) calendar API — required on marketing /horoscope. */
  usePublicApis?: boolean;
}

const selectClass = 'form-input text-sm py-1.5 h-9';
const selectClassCompact = 'form-input hl-period-select';

/**
 * Period picker (stores AD start_date / end_date on API):
 * - Daily: one BS date (start = end)
 * - Weekly: year + month + week → week start/end auto
 * - Monthly: year + Nepali month → 1st–last of that month
 * - Yearly: Nepali year → 1 Baishakh–last Chaitra
 */
export function HoroscopePeriodDateField({
  horoscopeType,
  startDate,
  endDate,
  onChange,
  className = '',
  compact = false,
  inline = false,
  usePublicApis = false,
}: HoroscopePeriodDateFieldProps) {
  const { language } = useLocale();
  const uiCode = normalizeUiLanguageCode(language);
  const useNepaliNumbers = uiCode === 'ne';
  const d = (value: string | number) => localizeDigits(value, uiCode);
  const [bsReady, setBsReady] = useState(false);
  const [calendars, setCalendars] = useState<NepaliCalendarResponse[]>([]);
  const fieldClass = compact || inline ? (compact ? selectClassCompact : selectClass) : selectClass;

  useEffect(() => {
    let cancelled = false;
    ensureOfficialLibrary()
      .then(() => {
        if (!cancelled) setBsReady(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loader = usePublicApis
      ? publicNepaliCalendarApi.listActive()
      : nepaliCalendarApi.listActive();
    loader
      .then((res) => {
        if (cancelled) return;
        const list = (res.data ?? []) as NepaliCalendarResponse[];
        setCalendars(list.filter((c) => typeof c.year === 'number'));
      })
      .catch(() => {
        if (!cancelled) setCalendars([]);
      });
    return () => {
      cancelled = true;
    };
  }, [usePublicApis]);

  const calendarByYear = useMemo(() => {
    const map: Record<number, NepaliCalendarResponse> = {};
    for (const c of calendars) map[c.year] = c;
    return map;
  }, [calendars]);

  const selection = useMemo(
    () => deriveBsPeriodSelection(startDate || new Date().toISOString().slice(0, 10)),
    [startDate, bsReady]
  );

  const yearOptions = useMemo(
    () => buildBsYearOptions(calendars, selection.year),
    [calendars, selection.year]
  );

  const daysInMonth = useMemo(
    () => getBsDaysInMonth(selection.year, selection.month, calendarByYear[selection.year]),
    [selection.year, selection.month, calendarByYear, bsReady]
  );

  const monthCalendar = calendarByYear[selection.year] ?? null;
  const maxWeek = maxWeeksInBsMonth(selection.year, selection.month, daysInMonth, monthCalendar);
  const weekValue = Math.min(selection.week, maxWeek);

  const weekResolved = useMemo(
    () =>
      horoscopeType === 'WEEKLY'
        ? resolveBsWeekPeriod(selection.year, selection.month, weekValue, monthCalendar)
        : null,
    [horoscopeType, selection.year, selection.month, weekValue, monthCalendar, bsReady]
  );

  const monthResolved = useMemo(
    () =>
      horoscopeType === 'MONTHLY'
        ? resolveBsMonthPeriod(selection.year, selection.month, monthCalendar)
        : null,
    [horoscopeType, selection.year, selection.month, monthCalendar, bsReady]
  );

  const yearResolved = useMemo(
    () => (horoscopeType === 'YEARLY' ? resolveBsYearPeriod(selection.year, calendarByYear) : null),
    [horoscopeType, selection.year, calendarByYear, bsReady]
  );

  const applyDaily = (adIso: string) => {
    if (!adIso) return;
    // One date → startDate = endDate
    onChange(resolveHoroscopePeriodDates('DAILY', adIso, calendarByYear));
  };

  const applyWeekly = useCallback(
    (year: number, month: number, week: number) => {
      const resolved = resolveBsWeekPeriod(year, month, week, calendarByYear[year]);
      if (resolved) {
        onChange({ startDate: resolved.startDate, endDate: resolved.endDate });
      }
    },
    [calendarByYear, onChange]
  );

  const applyMonthly = useCallback(
    (year: number, month: number) => {
      const resolved = resolveBsMonthPeriod(year, month, calendarByYear[year]);
      if (resolved) {
        onChange({ startDate: resolved.startDate, endDate: resolved.endDate });
      }
    },
    [calendarByYear, onChange]
  );

  const applyYearly = useCallback(
    (year: number) => {
      const resolved = resolveBsYearPeriod(year, calendarByYear);
      if (resolved) {
        onChange({ startDate: resolved.startDate, endDate: resolved.endDate });
      }
    },
    [calendarByYear, onChange]
  );

  const displayBs = useMemo(
    () => (startDate ? adIsoToBsIso(startDate) : ''),
    [startDate, bsReady]
  );

  const title =
    horoscopeType === 'DAILY'
      ? 'Date'
      : horoscopeType === 'WEEKLY'
        ? 'Week'
        : horoscopeType === 'MONTHLY'
          ? 'Month'
          : 'Year';

  const labelClass = 'text-xs font-semibold horoscope-key text-black dark:text-white';
  const rangeHint =
    horoscopeType === 'WEEKLY' && weekResolved
      ? `${d(weekResolved.startBs)} → ${d(weekResolved.endBs)}`
      : horoscopeType === 'MONTHLY' && monthResolved
        ? `${d(monthResolved.startBs)} → ${d(monthResolved.endBs)}`
        : horoscopeType === 'YEARLY' && yearResolved
          ? `${d(yearResolved.startBs)} → ${d(yearResolved.endBs)}`
          : horoscopeType === 'DAILY' && displayBs
            ? d(displayBs)
            : '';

  if (inline) {
    return (
      <>
        {horoscopeType === 'DAILY' ? (
          <label className="flex flex-col gap-1 min-w-[10rem] flex-1">
            <span className={labelClass}>{title}</span>
            <NepaliDatepicker
              key={`bs-daily-inline-${bsReady ? 'ready' : 'loading'}`}
              value={displayBs}
              onChange={(value) => {
                const ad = bsIsoToAdIso(value);
                if (ad) applyDaily(ad);
              }}
              placeholder="Select date"
              className={fieldClass}
              options={{
                dateFormat: 'YYYY-MM-DD',
                language: 'nepali',
                dateType: 'BS',
                autoClose: true,
                showToday: true,
                useEnglishNumbers: !useNepaliNumbers,
                showEnglishDateSubscript: false,
              }}
            />
          </label>
        ) : null}

        {horoscopeType === 'WEEKLY' ? (
          <>
            <label className="flex flex-col gap-1 min-w-[6.5rem]">
              <span className={labelClass}>Year</span>
              <select
                className={fieldClass}
                aria-label="Year"
                value={selection.year}
                onChange={(e) => applyWeekly(Number(e.target.value), selection.month, weekValue)}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {d(y)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-[7rem] flex-1">
              <span className={labelClass}>Month</span>
              <select
                className={fieldClass}
                aria-label="Month"
                value={selection.month}
                onChange={(e) => applyWeekly(selection.year, Number(e.target.value), weekValue)}
              >
                {BS_MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {bsMonthLabel(m.value, uiCode)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-[7.5rem] flex-1">
              <span className={labelClass}>Week</span>
              <select
                className={fieldClass}
                aria-label="Week"
                value={weekValue}
                onChange={(e) => applyWeekly(selection.year, selection.month, Number(e.target.value))}
              >
                {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    {d(formatBsWeekOptionLabel(selection.year, selection.month, w, monthCalendar))}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {horoscopeType === 'MONTHLY' ? (
          <>
            <label className="flex flex-col gap-1 min-w-[6.5rem]">
              <span className={labelClass}>Year</span>
              <select
                className={fieldClass}
                aria-label="Year"
                value={selection.year}
                onChange={(e) => applyMonthly(Number(e.target.value), selection.month)}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {d(y)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 min-w-[8rem] flex-1">
              <span className={labelClass}>Nepali month</span>
              <select
                className={fieldClass}
                aria-label="Month"
                value={selection.month}
                onChange={(e) => applyMonthly(selection.year, Number(e.target.value))}
              >
                {BS_MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {bsMonthLabel(m.value, uiCode)}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {horoscopeType === 'YEARLY' ? (
          <label className="flex flex-col gap-1 min-w-[8rem]">
            <span className={labelClass}>Nepali year</span>
            <select
              className={fieldClass}
              aria-label="Year"
              value={selection.year}
              onChange={(e) => applyYearly(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {d(y)} BS
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {rangeHint ? (
          <p className={`basis-full text-[10px] horoscope-muted -mt-1 mb-0 ${className}`}>{rangeHint}</p>
        ) : null}
      </>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-0' : 'gap-1.5'} min-w-0 ${className}`}>
      {!compact ? (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold horoscope-key text-black dark:text-white">{title}</span>
          <span className="text-[10px] horoscope-muted shrink-0">{periodDateHint(horoscopeType)}</span>
        </div>
      ) : null}

      {horoscopeType === 'DAILY' ? (
        <>
          <NepaliDatepicker
            key={`bs-daily-${bsReady ? 'ready' : 'loading'}`}
            value={displayBs}
            onChange={(value) => {
              const ad = bsIsoToAdIso(value);
              if (ad) applyDaily(ad);
            }}
            placeholder="Select date"
            className={fieldClass}
            options={{
              dateFormat: 'YYYY-MM-DD',
              language: 'nepali',
              dateType: 'BS',
              autoClose: true,
              showToday: true,
              useEnglishNumbers: !useNepaliNumbers,
              showEnglishDateSubscript: false,
            }}
          />
          {!compact && displayBs ? (
            <p className="text-[10px] horoscope-muted">
              Stored as one day ·{' '}
              <span className="font-medium text-black dark:text-white">{d(displayBs)}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {horoscopeType === 'WEEKLY' ? (
        <>
          <div
            className={
              compact
                ? 'grid grid-cols-[6.75rem_6.25rem_minmax(4.5rem,5.5rem)] gap-1.5'
                : 'grid grid-cols-3 gap-2'
            }
          >
            <select
              className={fieldClass}
              aria-label="Year"
              value={selection.year}
              onChange={(e) => applyWeekly(Number(e.target.value), selection.month, weekValue)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {d(y)}
                </option>
              ))}
            </select>
            <select
              className={fieldClass}
              aria-label="Month"
              value={selection.month}
              onChange={(e) => applyWeekly(selection.year, Number(e.target.value), weekValue)}
            >
              {BS_MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {bsMonthLabel(m.value, uiCode)}
                </option>
              ))}
            </select>
            <select
              className={fieldClass}
              aria-label="Week"
              value={weekValue}
              onChange={(e) => applyWeekly(selection.year, selection.month, Number(e.target.value))}
            >
              {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {compact
                    ? `W${d(w)}`
                    : d(formatBsWeekOptionLabel(selection.year, selection.month, w, monthCalendar))}
                </option>
              ))}
            </select>
          </div>
          {weekResolved && !compact ? (
            <p className="text-[10px] horoscope-muted">
              Week ·{' '}
              <span className="font-medium text-black dark:text-white">{d(weekResolved.startBs)}</span>
              {' → '}
              <span className="font-medium text-black dark:text-white">{d(weekResolved.endBs)}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {horoscopeType === 'MONTHLY' ? (
        <>
          <div className={`grid ${compact ? 'grid-cols-[6.75rem_7.5rem] gap-1.5' : 'grid-cols-2 gap-2'}`}>
            <label className="flex flex-col gap-0.5 min-w-0">
              {!compact ? <span className="text-[10px] horoscope-muted">Year</span> : null}
              <select
                className={fieldClass}
                aria-label="Year"
                value={selection.year}
                onChange={(e) => applyMonthly(Number(e.target.value), selection.month)}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {d(y)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 min-w-0">
              {!compact ? <span className="text-[10px] horoscope-muted">Nepali month</span> : null}
              <select
                className={fieldClass}
                aria-label="Month"
                value={selection.month}
                onChange={(e) => applyMonthly(selection.year, Number(e.target.value))}
              >
                {BS_MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {bsMonthLabel(m.value, uiCode)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {monthResolved && !compact ? (
            <p className="text-[10px] horoscope-muted">
              Month ·{' '}
              <span className="font-medium text-black dark:text-white">
                {d(monthResolved.startBs)} → {d(monthResolved.endBs)}
              </span>
            </p>
          ) : null}
        </>
      ) : null}

      {horoscopeType === 'YEARLY' ? (
        <>
          <label className={`flex flex-col gap-0.5 min-w-0 ${compact ? 'w-[9.5rem]' : ''}`}>
            {!compact ? <span className="text-[10px] horoscope-muted">Nepali year</span> : null}
            <select
              className={fieldClass}
              aria-label="Year"
              value={selection.year}
              onChange={(e) => applyYearly(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {d(y)} BS
                </option>
              ))}
            </select>
          </label>
          {yearResolved && !compact ? (
            <p className="text-[10px] horoscope-muted">
              Year ·{' '}
              <span className="font-medium text-black dark:text-white">
                {d(yearResolved.startBs)} → {d(yearResolved.endBs)}
              </span>
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
