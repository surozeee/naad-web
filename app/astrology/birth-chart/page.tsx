'use client';

import { FormEvent, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import KundaliChartView from '../../components/kundali/KundaliChartView';
import { kundaliApi } from '@/app/lib/kundali.service';
import type {
  AyanamsaType,
  ChartStyleType,
  HouseSystemType,
  KundaliChart,
} from '@/app/lib/kundali.types';
import { getStoredUiLanguage } from '@/app/lib/ui-language';

const PLACE_PRESETS: { label: string; placeName: string; latitude: number; longitude: number; timezone: string }[] = [
  { label: 'Kathmandu', placeName: 'Kathmandu, Nepal', latitude: 27.7172, longitude: 85.324, timezone: 'Asia/Kathmandu' },
  { label: 'Pokhara', placeName: 'Pokhara, Nepal', latitude: 28.2096, longitude: 83.9856, timezone: 'Asia/Kathmandu' },
  { label: 'Delhi', placeName: 'New Delhi, India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
  { label: 'Mumbai', placeName: 'Mumbai, India', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
];

export default function BirthChartPage() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('1990-05-15');
  const [birthTime, setBirthTime] = useState('10:30');
  const [placeName, setPlaceName] = useState(PLACE_PRESETS[0].placeName);
  const [latitude, setLatitude] = useState(String(PLACE_PRESETS[0].latitude));
  const [longitude, setLongitude] = useState(String(PLACE_PRESETS[0].longitude));
  const [timezone, setTimezone] = useState(PLACE_PRESETS[0].timezone);
  const [ayanamsa, setAyanamsa] = useState<AyanamsaType>('LAHIRI');
  const [houseSystem, setHouseSystem] = useState<HouseSystemType>('WHOLE_SIGN');
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('NORTH_INDIAN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<KundaliChart | null>(null);

  const language = useMemo(() => getStoredUiLanguage(), []);

  function applyPreset(preset: (typeof PLACE_PRESETS)[number]) {
    setPlaceName(preset.placeName);
    setLatitude(String(preset.latitude));
    setLongitude(String(preset.longitude));
    setTimezone(preset.timezone);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (!birthDate || Number.isNaN(lat) || Number.isNaN(lon)) {
        throw new Error('Date, latitude, and longitude are required');
      }
      const time = birthTime.length === 5 ? `${birthTime}:00` : birthTime;
      const result = await kundaliApi.generate({
        name: name.trim() || undefined,
        birthDate,
        birthTime: time,
        timezone,
        latitude: lat,
        longitude: lon,
        placeName: placeName.trim() || undefined,
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
            Swiss Ephemeris planetary positions with a custom SVG North / South Indian chart — no paid chart API.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Birth details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Full name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of birth</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time of birth</label>
                <input
                  type="time"
                  required
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place presets</label>
              <div className="flex flex-wrap gap-2">
                {PLACE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place of birth</label>
              <input
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="City, Country"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                <input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                <input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="Asia/Kathmandu"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ayanamsa</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House system</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart style</label>
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
                Enter birth details and generate a kundali. The SVG chart is rendered locally from Swiss Ephemeris
                positions.
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
                  <Info label="Place" value={chart.placeName || `${chart.latitude}, ${chart.longitude}`} />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-600 text-left text-gray-500">
                        <th className="py-2 pr-3">Planet</th>
                        <th className="py-2 pr-3">Sign</th>
                        <th className="py-2 pr-3">Degree</th>
                        <th className="py-2 pr-3">House</th>
                        <th className="py-2">Nakshatra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chart.planets.map((p) => (
                        <tr key={p.code} className="border-b border-gray-100 dark:border-slate-700/60">
                          <td className="py-2 pr-3 font-medium">
                            {p.glyph} {p.name}
                            {p.retrograde ? ' (R)' : ''}
                          </td>
                          <td className="py-2 pr-3">{p.signLabel}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{p.formattedDegree}</td>
                          <td className="py-2 pr-3">{p.house}</td>
                          <td className="py-2">
                            {p.nakshatraLabel} · Pada {p.pada}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
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
