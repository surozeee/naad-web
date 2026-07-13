'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { NepaliDatepicker, ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { nepaliCalendarApi } from '@/app/lib/master.service';
import type { HoroscopeTypeEnum } from '@/app/lib/crm.types';
import type { NepaliCalendarResponse } from '@/app/lib/master.types';
import {
  BS_MONTH_OPTIONS,
  adIsoToBsIso,
  bsIsoToAdIso,
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

interface HoroscopePeriodDateFieldProps {
  horoscopeType: HoroscopeTypeEnum;
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
  className?: string;
}

const selectClass = 'form-input text-sm py-1.5 h-9';

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
}: HoroscopePeriodDateFieldProps) {
  const [bsReady, setBsReady] = useState(false);
  const [calendars, setCalendars] = useState<NepaliCalendarResponse[]>([]);

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
    nepaliCalendarApi
      .listActive()
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
  }, []);

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

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-black dark:text-white">{title}</span>
        <span className="text-[10px] horoscope-muted shrink-0">{periodDateHint(horoscopeType)}</span>
      </div>

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
            className={selectClass}
            options={{
              dateFormat: 'YYYY-MM-DD',
              language: 'nepali',
              dateType: 'BS',
              autoClose: true,
              showToday: true,
              useEnglishNumbers: true,
              showEnglishDateSubscript: false,
            }}
          />
          {displayBs ? (
            <p className="text-[10px] horoscope-muted">
              Stored as one day · <span className="font-medium text-black dark:text-white">{displayBs}</span>
            </p>
          ) : null}
        </>
      ) : null}

      {horoscopeType === 'WEEKLY' ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <select
              className={selectClass}
              aria-label="Year"
              value={selection.year}
              onChange={(e) => applyWeekly(Number(e.target.value), selection.month, weekValue)}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              aria-label="Month"
              value={selection.month}
              onChange={(e) => applyWeekly(selection.year, Number(e.target.value), weekValue)}
            >
              {BS_MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              aria-label="Week"
              value={weekValue}
              onChange={(e) => applyWeekly(selection.year, selection.month, Number(e.target.value))}
            >
              {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {formatBsWeekOptionLabel(selection.year, selection.month, w, monthCalendar)}
                </option>
              ))}
            </select>
          </div>
          {weekResolved ? (
            <p className="text-[10px] horoscope-muted">
              Week ·{' '}
              <span className="font-medium text-black dark:text-white">{weekResolved.startBs}</span>
              {' → '}
              <span className="font-medium text-black dark:text-white">{weekResolved.endBs}</span>
              <span className="opacity-70"> (1st–Sat, then Sun–Sat)</span>
            </p>
          ) : null}
        </>
      ) : null}

      {horoscopeType === 'MONTHLY' ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] horoscope-muted">Year</span>
              <select
                className={selectClass}
                value={selection.year}
                onChange={(e) => applyMonthly(Number(e.target.value), selection.month)}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] horoscope-muted">Nepali month</span>
              <select
                className={selectClass}
                value={selection.month}
                onChange={(e) => applyMonthly(selection.year, Number(e.target.value))}
              >
                {BS_MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {monthResolved ? (
            <p className="text-[10px] horoscope-muted">
              Month ·{' '}
              <span className="font-medium text-black dark:text-white">
                {monthResolved.startBs} → {monthResolved.endBs}
              </span>
              <span className="opacity-70"> (1st–last day auto)</span>
            </p>
          ) : null}
        </>
      ) : null}

      {horoscopeType === 'YEARLY' ? (
        <>
          <label className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] horoscope-muted">Nepali year</span>
            <select
              className={selectClass}
              value={selection.year}
              onChange={(e) => applyYearly(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y} BS
                </option>
              ))}
            </select>
          </label>
          {yearResolved ? (
            <p className="text-[10px] horoscope-muted">
              Year ·{' '}
              <span className="font-medium text-black dark:text-white">
                {yearResolved.startBs} → {yearResolved.endBs}
              </span>
              <span className="opacity-70"> (1 Baishakh–last Chaitra)</span>
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
