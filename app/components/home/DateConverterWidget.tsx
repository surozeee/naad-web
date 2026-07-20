'use client';

import { useEffect, useMemo, useState } from 'react';
import { EnglishDatepicker } from '@/app/components/ui/english-datepicker';
import { NepaliDatepicker, ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { toNepaliDigits } from '@/app/lib/nepali-digits';
import {
  BS_MONTH_OPTIONS,
  adIsoToBsIso,
  bsIsoToAdIso,
  bsMonthLabel,
  formatIsoDate,
  getBsDaysInMonth,
  parseBsIso,
  parseIsoDate,
} from '@/app/lib/horoscope-date-period';

type CalendarSystem = 'ad' | 'bs';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAYS_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'] as const;
const WEEKDAYS_NE_FULL = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहिबार',
  'शुक्रबार',
  'शनिबार',
] as const;
const AD_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function todayAdIso(): string {
  return formatIsoDate(new Date());
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDisplayAd(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso || '—';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDisplayBs(iso: string, nepali = false): string {
  const parts = parseBsIso(iso);
  if (!parts) return iso || '—';
  if (nepali) {
    const ad = bsIsoToAdIso(iso);
    const adDate = ad ? parseIsoDate(ad) : null;
    const weekday = adDate ? WEEKDAYS_NE_FULL[adDate.getDay()] : '';
    return `${weekday} ${toNepaliDigits(parts.day)} ${bsMonthLabel(parts.month, 'ne')} ${toNepaliDigits(parts.year)}`.trim();
  }
  return `${parts.day} ${bsMonthLabel(parts.month)} ${parts.year} B.S.`;
}

type CalendarCell = {
  key: string;
  day: number | null;
  adIso: string;
  bsIso: string;
  isToday: boolean;
  isSelected: boolean;
};

function buildAdMonthCells(
  year: number,
  monthIndex: number,
  selectedAd: string,
  todayAd: string,
  ready: boolean
): CalendarCell[] {
  const first = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startPad = first.getDay();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push({
      key: `pad-${i}`,
      day: null,
      adIso: '',
      bsIso: '',
      isToday: false,
      isSelected: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const adIso = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
    const bsIso = ready ? adIsoToBsIso(adIso) : '';
    cells.push({
      key: adIso,
      day,
      adIso,
      bsIso,
      isToday: adIso === todayAd,
      isSelected: adIso === selectedAd,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `trail-${cells.length}`,
      day: null,
      adIso: '',
      bsIso: '',
      isToday: false,
      isSelected: false,
    });
  }

  return cells;
}

function buildBsMonthCells(
  year: number,
  month: number,
  selectedBs: string,
  todayBs: string,
  ready: boolean
): CalendarCell[] {
  if (!ready) return [];
  const daysInMonth = getBsDaysInMonth(year, month);
  const firstBs = `${year}-${pad2(month)}-01`;
  const firstAd = bsIsoToAdIso(firstBs);
  const firstAdDate = firstAd ? parseIsoDate(firstAd) : null;
  const startPad = firstAdDate ? firstAdDate.getDay() : 0;
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push({
      key: `pad-${i}`,
      day: null,
      adIso: '',
      bsIso: '',
      isToday: false,
      isSelected: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const bsIso = `${year}-${pad2(month)}-${pad2(day)}`;
    const adIso = bsIsoToAdIso(bsIso);
    cells.push({
      key: bsIso,
      day,
      adIso,
      bsIso,
      isToday: bsIso === todayBs,
      isSelected: bsIso === selectedBs,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `trail-${cells.length}`,
      day: null,
      adIso: '',
      bsIso: '',
      isToday: false,
      isSelected: false,
    });
  }

  return cells;
}

export default function DateConverterWidget() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [calendarSystem, setCalendarSystem] = useState<CalendarSystem>('ad');

  const [adIso, setAdIso] = useState(todayAdIso);
  const [bsIso, setBsIso] = useState('');

  const todayAd = useMemo(() => todayAdIso(), []);
  const todayBs = useMemo(() => (ready ? adIsoToBsIso(todayAd) : ''), [ready, todayAd]);

  const [viewAdYear, setViewAdYear] = useState(() => new Date().getFullYear());
  const [viewAdMonth, setViewAdMonth] = useState(() => new Date().getMonth());
  const [viewBsYear, setViewBsYear] = useState(2080);
  const [viewBsMonth, setViewBsMonth] = useState(1);

  useEffect(() => {
    let cancelled = false;
    ensureOfficialLibrary()
      .then(() => {
        if (cancelled) return;
        setReady(true);
        const today = todayAdIso();
        const bs = adIsoToBsIso(today);
        setAdIso(today);
        setBsIso(bs);
        const parts = parseBsIso(bs);
        if (parts) {
          setViewBsYear(parts.year);
          setViewBsMonth(parts.month);
        }
        const ad = parseIsoDate(today);
        if (ad) {
          setViewAdYear(ad.getFullYear());
          setViewAdMonth(ad.getMonth());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
          setError('Date converter could not load. Please refresh the page.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncFromAd = (nextAd: string) => {
    setAdIso(nextAd);
    if (!ready) return;
    const nextBs = adIsoToBsIso(nextAd);
    if (!nextBs) {
      setError('Could not convert this English date.');
      setBsIso('');
      return;
    }
    setError('');
    setBsIso(nextBs);
    const parts = parseBsIso(nextBs);
    if (parts) {
      setViewBsYear(parts.year);
      setViewBsMonth(parts.month);
    }
    const ad = parseIsoDate(nextAd);
    if (ad) {
      setViewAdYear(ad.getFullYear());
      setViewAdMonth(ad.getMonth());
    }
  };

  const syncFromBs = (nextBs: string) => {
    setBsIso(nextBs);
    if (!ready) return;
    const nextAd = bsIsoToAdIso(nextBs);
    if (!nextAd) {
      setError('Could not convert this Nepali date.');
      return;
    }
    setError('');
    setAdIso(nextAd);
    const ad = parseIsoDate(nextAd);
    if (ad) {
      setViewAdYear(ad.getFullYear());
      setViewAdMonth(ad.getMonth());
    }
    const parts = parseBsIso(nextBs);
    if (parts) {
      setViewBsYear(parts.year);
      setViewBsMonth(parts.month);
    }
  };

  const shiftMonth = (delta: number) => {
    if (calendarSystem === 'ad') {
      const d = new Date(viewAdYear, viewAdMonth + delta, 1);
      setViewAdYear(d.getFullYear());
      setViewAdMonth(d.getMonth());
      return;
    }
    let month = viewBsMonth + delta;
    let year = viewBsYear;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    setViewBsMonth(month);
    setViewBsYear(year);
  };

  const goToday = () => {
    syncFromAd(todayAd);
    setCalendarSystem('ad');
  };

  const cells = useMemo(() => {
    if (calendarSystem === 'ad') {
      return buildAdMonthCells(viewAdYear, viewAdMonth, adIso, todayAd, ready);
    }
    return buildBsMonthCells(viewBsYear, viewBsMonth, bsIso, todayBs, ready);
  }, [
    calendarSystem,
    viewAdYear,
    viewAdMonth,
    viewBsYear,
    viewBsMonth,
    adIso,
    bsIso,
    todayAd,
    todayBs,
    ready,
  ]);

  const headerTitle =
    calendarSystem === 'ad'
      ? `${AD_MONTHS[viewAdMonth]} ${viewAdYear}`
      : `${bsMonthLabel(viewBsMonth, 'ne')} ${toNepaliDigits(viewBsYear)}`;

  const weekdayLabels = calendarSystem === 'bs' ? WEEKDAYS_NE : WEEKDAYS_EN;

  const bsParts = parseBsIso(bsIso);
  const bsYearOptions = useMemo(() => {
    const base = bsParts?.year || viewBsYear || 2080;
    const years: number[] = [];
    for (let y = base - 40; y <= base + 20; y += 1) years.push(y);
    return years;
  }, [bsParts?.year, viewBsYear]);

  const adYearOptions = useMemo(() => {
    const base = viewAdYear || new Date().getFullYear();
    const years: number[] = [];
    for (let y = base - 40; y <= base + 20; y += 1) years.push(y);
    return years;
  }, [viewAdYear]);

  return (
    <div className="naad-date-tool">
      <section className="naad-cal-panel">
        <div className="naad-cal-toolbar">
          <div className="naad-cal-system" role="tablist" aria-label="Calendar type">
            <button
              type="button"
              role="tab"
              aria-selected={calendarSystem === 'ad'}
              className={`naad-cal-chip${calendarSystem === 'ad' ? ' is-active' : ''}`}
              onClick={() => setCalendarSystem('ad')}
            >
              English calendar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={calendarSystem === 'bs'}
              className={`naad-cal-chip${calendarSystem === 'bs' ? ' is-active' : ''}`}
              onClick={() => setCalendarSystem('bs')}
              disabled={!ready}
            >
              Nepali calendar
            </button>
          </div>

          <div className="naad-cal-nav">
            <button type="button" className="naad-cal-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              ‹
            </button>
            <div className="naad-cal-month-controls">
              {calendarSystem === 'ad' ? (
                <>
                  <select
                    aria-label="Month"
                    value={viewAdMonth}
                    onChange={(e) => setViewAdMonth(Number(e.target.value))}
                  >
                    {AD_MONTHS.map((name, idx) => (
                      <option key={name} value={idx}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Year"
                    value={viewAdYear}
                    onChange={(e) => setViewAdYear(Number(e.target.value))}
                  >
                    {adYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select
                    aria-label="BS month"
                    value={viewBsMonth}
                    onChange={(e) => setViewBsMonth(Number(e.target.value))}
                    disabled={!ready}
                  >
                    {BS_MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.labelNe}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="BS year"
                    value={viewBsYear}
                    onChange={(e) => setViewBsYear(Number(e.target.value))}
                    disabled={!ready}
                  >
                    {bsYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {toNepaliDigits(y)}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <button type="button" className="naad-cal-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
              ›
            </button>
            <button type="button" className="naad-cal-today" onClick={goToday} disabled={!ready}>
              Today
            </button>
          </div>
        </div>

        <h2 className="naad-cal-title">{headerTitle}</h2>

        <div className="naad-cal-weekdays" aria-hidden>
          {weekdayLabels.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="naad-cal-grid" role="grid" aria-label={headerTitle}>
          {cells.map((cell) =>
            cell.day == null ? (
              <span key={cell.key} className="naad-cal-cell is-empty" />
            ) : (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                className={`naad-cal-cell${cell.isToday ? ' is-today' : ''}${cell.isSelected ? ' is-selected' : ''}`}
                onClick={() => {
                  if (calendarSystem === 'ad') syncFromAd(cell.adIso);
                  else syncFromBs(cell.bsIso);
                }}
                disabled={!ready}
              >
                <strong>
                  {calendarSystem === 'bs' ? toNepaliDigits(cell.day) : cell.day}
                </strong>
                <em>
                  {calendarSystem === 'ad'
                    ? cell.bsIso
                      ? toNepaliDigits(Number(cell.bsIso.slice(8)))
                      : ''
                    : cell.adIso
                      ? Number(cell.adIso.slice(8))
                      : ''}
                </em>
              </button>
            )
          )}
        </div>

        <p className="naad-cal-legend">
          Selected:{' '}
          <strong>
            {calendarSystem === 'bs' ? formatDisplayBs(bsIso, true) : formatDisplayAd(adIso)}
          </strong>
          <span aria-hidden> · </span>
          <strong>
            {calendarSystem === 'bs' ? formatDisplayAd(adIso) : formatDisplayBs(bsIso)}
          </strong>
        </p>
      </section>

      <section className="naad-convert-panel">
        <h2 className="naad-cal-title">Convert dates</h2>
        <p className="naad-convert-lead">Pick a date with either calendar — the other updates automatically.</p>

        <div className="naad-convert-pickers">
          <label className="naad-converter-field">
            <span>English date (A.D.)</span>
            {ready ? (
              <EnglishDatepicker
                key={ready ? 'ad-ready' : 'ad-loading'}
                value={adIso}
                onChange={(value) => {
                  if (value) syncFromAd(value);
                }}
                placeholder="Select English date"
                className="naad-datepicker-input"
                options={{
                  dateFormat: 'YYYY-MM-DD',
                  language: 'english',
                  autoClose: true,
                  showToday: true,
                  showEnglishDateSubscript: false,
                }}
              />
            ) : (
              <input type="text" disabled placeholder="Loading…" />
            )}
            <em>{formatDisplayAd(adIso)}</em>
          </label>

          <div className="naad-converter-swap" aria-hidden>
            ↔
          </div>

          <label className="naad-converter-field">
            <span>Nepali date (B.S.)</span>
            {ready ? (
              <NepaliDatepicker
                key={ready ? 'bs-ready' : 'bs-loading'}
                value={bsIso}
                onChange={(value) => {
                  if (value) syncFromBs(value);
                }}
                placeholder="नेपाली मिति छान्नुहोस्"
                className="naad-datepicker-input"
                options={{
                  dateFormat: 'YYYY-MM-DD',
                  language: 'nepali',
                  dateType: 'BS',
                  autoClose: true,
                  showToday: true,
                  useEnglishNumbers: false,
                  showEnglishDateSubscript: true,
                }}
              />
            ) : (
              <input type="text" disabled placeholder="Loading…" />
            )}
            <em>{formatDisplayBs(bsIso, true)}</em>
          </label>
        </div>

        <div className="naad-convert-result naad-convert-result--pair">
          <div>
            <p className="naad-convert-result-label">English</p>
            <p className="naad-convert-result-value">{formatDisplayAd(adIso)}</p>
            <p className="naad-convert-result-sub">{adIso || '—'}</p>
          </div>
          <div>
            <p className="naad-convert-result-label">नेपाली</p>
            <p className="naad-convert-result-value">{formatDisplayBs(bsIso, true)}</p>
            <p className="naad-convert-result-sub">{bsIso || '—'}</p>
          </div>
        </div>

        {!ready && !error ? <p className="naad-converter-status">Loading converter…</p> : null}
        {error ? <p className="naad-converter-error">{error}</p> : null}
      </section>
    </div>
  );
}
