'use client';

import { useEffect, useMemo, useState } from 'react';
import { EnglishDatepicker } from '@/app/components/ui/english-datepicker';
import { NepaliDatepicker, ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import type { HoroscopeTypeEnum } from '@/app/lib/crm.types';
import {
  adIsoToBsIso,
  bsIsoToAdIso,
  periodDateHint,
  resolveHoroscopePeriodDates,
  type CalendarMode,
} from '@/app/lib/horoscope-date-period';

interface HoroscopePeriodDateFieldProps {
  horoscopeType: HoroscopeTypeEnum;
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
  className?: string;
}

export function HoroscopePeriodDateField({
  horoscopeType,
  startDate,
  endDate,
  onChange,
  className = '',
}: HoroscopePeriodDateFieldProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('AD');
  const [bsReady, setBsReady] = useState(false);

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

  const displayAd = startDate;
  const displayBs = useMemo(() => (displayAd ? adIsoToBsIso(displayAd) : ''), [displayAd, bsReady]);

  const applyAnchor = (adIso: string) => {
    if (!adIso) return;
    onChange(resolveHoroscopePeriodDates(horoscopeType, adIso));
  };

  const rangeLabel =
    horoscopeType === 'DAILY'
      ? startDate
      : startDate && endDate
        ? `${startDate} → ${endDate}`
        : '';

  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <div className="flex items-center gap-1">
        <div
          className="inline-flex rounded-md border border-slate-200 dark:border-slate-600 overflow-hidden text-[11px] font-semibold"
          role="group"
          aria-label="Calendar type"
        >
          {(['AD', 'BS'] as CalendarMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`px-2 py-1 transition-colors ${
                calendarMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              onClick={() => setCalendarMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        <span className="text-[10px] horoscope-muted truncate">{periodDateHint(horoscopeType)}</span>
      </div>

      {calendarMode === 'AD' ? (
        <EnglishDatepicker
          key={`ad-${horoscopeType}`}
          value={displayAd}
          onChange={(value) => applyAnchor(value)}
          placeholder={horoscopeType === 'DAILY' ? 'Select date (AD)' : 'Select period date (AD)'}
          className="form-input text-sm py-1.5 h-9"
          options={{
            dateFormat: 'YYYY-MM-DD',
            language: 'english',
            autoClose: true,
            showToday: true,
          }}
        />
      ) : (
        <NepaliDatepicker
          key={`bs-${horoscopeType}-${bsReady ? 'ready' : 'loading'}`}
          value={displayBs}
          onChange={(value) => {
            const ad = bsIsoToAdIso(value);
            if (ad) applyAnchor(ad);
          }}
          placeholder={horoscopeType === 'DAILY' ? 'Select date (BS)' : 'Select period date (BS)'}
          className="form-input text-sm py-1.5 h-9"
          options={{
            dateFormat: 'YYYY-MM-DD',
            language: 'nepali',
            dateType: 'BS',
            autoClose: true,
            showToday: true,
            useEnglishNumbers: true,
            showEnglishDateSubscript: true,
          }}
        />
      )}

      {horoscopeType !== 'DAILY' && rangeLabel ? (
        <p className="text-[10px] text-black dark:text-slate-300">
          Range: <span className="font-semibold">{rangeLabel}</span>
          {calendarMode === 'BS' && displayBs ? (
            <span className="horoscope-muted"> · BS start {displayBs}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
