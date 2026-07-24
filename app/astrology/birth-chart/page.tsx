'use client';

import { FormEvent, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useLocale } from '@/app/components/LocaleProvider';
import BirthPlaceMapPicker, {
  type BirthPlaceSelection,
} from '../../components/kundali/BirthPlaceMapPicker';
import KundaliChartView from '../../components/kundali/KundaliChartView';
import KundaliDetailsPanel from '../../components/kundali/KundaliDetailsPanel';
import { DateInputWithCalendarMode } from '@/app/components/ui/DateInputWithCalendarMode';
import { BirthTimeField } from '@/app/components/ui/BirthTimeField';
import { ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { kundaliApi } from '@/app/lib/kundali.service';
import type {
  AyanamsaType,
  ChartStyleType,
  HouseSystemType,
  KundaliChart,
} from '@/app/lib/kundali.types';
import { defaultCalendarMode, toApiAdDate, convertBetweenCalendars, adStringToBS, looksLikeBsYmd, type CalendarMode } from '@/app/lib/date-bridge';

const DEFAULT_PLACE: BirthPlaceSelection = {
  placeName: 'Kathmandu, Nepal',
  latitude: 27.7172,
  longitude: 85.324,
  timezone: 'Asia/Kathmandu',
  countryCode: 'NP',
  timezoneSource: 'country',
};

export default function BirthChartPage() {
  const { language } = useLocale();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1990-05-15');
  const [birthTime, setBirthTime] = useState('10:30');
  const [place, setPlace] = useState<BirthPlaceSelection>(DEFAULT_PLACE);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>(() => defaultCalendarMode(language));
  const [ayanamsa, setAyanamsa] = useState<AyanamsaType>('LAHIRI');
  const [houseSystem, setHouseSystem] = useState<HouseSystemType>('WHOLE_SIGN');
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('NORTH_INDIAN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<KundaliChart | null>(null);

  useEffect(() => {
    const next = defaultCalendarMode(language);
    setCalendarMode((prev) => {
      if (prev === next) return prev;
      setBirthDate((d) => convertBetweenCalendars(d, prev, next));
      return next;
    });
  }, [language]);

  useEffect(() => {
    // One-shot: if UI starts in BS, convert the AD default into BS after converters load
    void ensureOfficialLibrary().then(() => {
      setBirthDate((d) => {
        if (!d || calendarMode !== 'BS') return d;
        if (looksLikeBsYmd(d)) return d;
        return adStringToBS(d) || d;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only align initial AD default once library is ready
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Convert based on the selected AD/BS toggle
      const birthDateAd = toApiAdDate(birthDate, calendarMode);
      if (!birthDateAd || Number.isNaN(place.latitude) || Number.isNaN(place.longitude)) {
        throw new Error(
          !birthDateAd
            ? 'Could not convert birth date to English (A.D.). Wait for the calendar to load and try again.'
            : 'Date and a map place selection are required'
        );
      }
      if (!place.timezone.trim()) {
        throw new Error('Timezone is required — pick an active timezone');
      }
      const time = birthTime.length === 5 ? `${birthTime}:00` : birthTime;
      const result = await kundaliApi.generate({
        name: name.trim() || undefined,
        birthDate: birthDateAd,
        birthTime: time,
        timezone: place.timezone,
        latitude: place.latitude,
        longitude: place.longitude,
        placeName: place.placeName.trim() || undefined,
        ayanamsa,
        houseSystem,
        chartStyle,
        language,
      });
      setChart(result);
    } catch (err) {
      setChart(null);
      setError(err instanceof Error ? err.message : 'Failed to generate kundali');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Birth Chart (Kundali)</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select birth place on Google Maps — latitude, longitude, and timezone are filled from the
            location.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Birth details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name (optional)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of birth
              </label>
              <DateInputWithCalendarMode
                id="kundali-birth-date"
                value={birthDate}
                onChange={setBirthDate}
                calendarMode={calendarMode}
                onCalendarModeChange={(next) => {
                  setBirthDate((d) => convertBetweenCalendars(d, calendarMode, next));
                  setCalendarMode(next);
                }}
                togglePosition="end"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time of birth
              </label>
              <BirthTimeField id="kundali-birth-time" value={birthTime} onChange={setBirthTime} />
            </div>

            <BirthPlaceMapPicker
              value={place}
              birthDate={toApiAdDate(birthDate, calendarMode) || undefined}
              onChange={setPlace}
            />

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ayanamsa
                </label>
                <select
                  value={ayanamsa}
                  onChange={(e) => setAyanamsa(e.target.value as AyanamsaType)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="LAHIRI">Lahiri</option>
                  <option value="RAMAN">Raman</option>
                  <option value="KRISHNAMURTI">Krishnamurti</option>
                  <option value="FAGAN_BRADLEY">Fagan-Bradley</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  House system
                </label>
                <select
                  value={houseSystem}
                  onChange={(e) => setHouseSystem(e.target.value as HouseSystemType)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="WHOLE_SIGN">Whole Sign</option>
                  <option value="PLACIDUS">Placidus</option>
                  <option value="EQUAL">Equal</option>
                  <option value="SRIPATI">Sripati</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chart style
                </label>
                <select
                  value={chartStyle}
                  onChange={(e) => setChartStyle(e.target.value as ChartStyleType)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="NORTH_INDIAN">North Indian</option>
                  <option value="SOUTH_INDIAN">South Indian</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-60"
            >
              {loading ? 'Calculating…' : 'Generate Kundali'}
            </button>
          </form>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {chart?.summary?.title ?? 'Chart preview'}
              </h2>
              {chart && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setChartStyle('NORTH_INDIAN')}
                    className={`px-3 py-1 text-xs rounded-md border ${
                      chartStyle === 'NORTH_INDIAN'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    North
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartStyle('SOUTH_INDIAN')}
                    className={`px-3 py-1 text-xs rounded-md border ${
                      chartStyle === 'SOUTH_INDIAN'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  >
                    South
                  </button>
                </div>
              )}
            </div>

            {!chart ? (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-10 text-center text-gray-500 dark:text-gray-400">
                Choose a birth place on the map, then generate a kundali. The SVG chart is rendered from
                Swiss Ephemeris positions.
              </div>
            ) : (
              <>
                <div className="max-w-md mx-auto">
                  <KundaliChartView chart={chart} style={chartStyle} />
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <Info label="Lagna" value={`${chart.summary.lagna} (${chart.ascendant.formattedDegree})`} />
                  <Info label="Moon" value={`${chart.summary.moonSign} · ${chart.summary.moonNakshatra}`} />
                  <Info label="Sun" value={chart.summary.sunSign} />
                  <Info label="Ayanamsa" value={`${chart.ayanamsaName} ${chart.ayanamsaDegrees.toFixed(4)}°`} />
                  <Info label="Ephemeris" value={chart.ephemerisMode} />
                  <Info
                    label="Place"
                    value={
                      chart.placeName ||
                      `${chart.latitude}, ${chart.longitude}` + (chart.timezone ? ` · ${chart.timezone}` : '')
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {chart && (
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Full chart analysis</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vimshottari dasha, Mangalik, good times (business, journey, marriage), life areas
              (family, education, marital, abroad, business, health, career, finance, children),
              birth panchanga, planetary dignity, houses — derived from Swiss Ephemeris sidereal positions.
            </p>
            <KundaliDetailsPanel chart={chart} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="font-medium text-gray-800 dark:text-gray-100">{value}</div>
    </div>
  );
}
