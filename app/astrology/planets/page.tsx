'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import SunSignQuickPanel from '../../components/astrology/SunSignQuickPanel';
import { kundaliApi } from '@/app/lib/kundali.service';
import type { PlanetPosition } from '@/app/lib/kundali.types';
import type { ZodiacSignEnum } from '@/app/lib/crm.types';

export default function PlanetaryPositionsPage() {
  const [planets, setPlanets] = useState<PlanetPosition[]>([]);
  const [meta, setMeta] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSign, setSelectedSign] = useState<ZodiacSignEnum | null>(null);

  useEffect(() => {
    const now = new Date();
    const birthDate = now.toISOString().slice(0, 10);
    const birthTime = now.toTimeString().slice(0, 8);
    kundaliApi
      .generate({
        birthDate,
        birthTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kathmandu',
        latitude: 27.7172,
        longitude: 85.324,
        placeName: 'Kathmandu (sky now)',
        chartStyle: 'NORTH_INDIAN',
      })
      .then((chart) => {
        setPlanets(chart.planets);
        setMeta(`${chart.ephemerisMode} · ${chart.ayanamsaName} · ${chart.birthDateTime}`);
        const sun = chart.planets.find((p) => p.code === 'SU');
        if (sun?.sign) {
          setSelectedSign((prev) => prev ?? (sun.sign as ZodiacSignEnum));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load positions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Planetary Positions</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sun-sign guide without birth date, plus live sidereal sky positions (reference: Kathmandu).
            </p>
          </div>
          <Link
            href="/astrology/birth-chart"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Open Birth Kundali
          </Link>
        </div>

        <SunSignQuickPanel selectedSign={selectedSign} onSelectSign={setSelectedSign} />

        <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Live sky now</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current graha positions from Swiss Ephemeris — not your personal birth chart.
            </p>
            {meta && <p className="text-xs text-gray-500 mt-1">{meta}</p>}
          </div>

          {loading && <p className="text-gray-500">Calculating with Swiss Ephemeris…</p>}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planets.map((planet) => (
              <div
                key={planet.code}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl font-semibold">{planet.glyph}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {planet.name}
                      {planet.retrograde ? ' (R)' : ''}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {planet.signLabel} · {planet.formattedDegree}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  House {planet.house} · {planet.nakshatraLabel} Pada {planet.pada}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
