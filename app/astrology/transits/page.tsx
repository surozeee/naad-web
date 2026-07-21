'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { kundaliApi } from '@/app/lib/kundali.service';
import type { TransitPlanet, TransitSnapshot } from '@/app/lib/kundali.types';

function formatWhen(isoLike: string | null | undefined): string {
  if (!isoLike) return '—';
  // Backend sends "yyyy-MM-dd HH:mm:ss UTC" for ingresses
  return isoLike.replace(' UTC', ' UTC');
}

function TransitCard({ t }: { t: TransitPlanet }) {
  const dateLabel =
    t.daysUntilSignChange != null && t.nextSignLabel
      ? `Next: ${t.nextSignLabel} in ~${t.daysUntilSignChange}d`
      : 'Ongoing';

  return (
    <div className="bg-gray-50 dark:bg-slate-700/60 rounded-lg p-6 border border-gray-100 dark:border-slate-600">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{t.glyph}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {t.name}
              {t.retrograde ? ' (R)' : ''}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t.status}</p>
          </div>
        </div>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-right shrink-0">
          {dateLabel}
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-200 mb-1">
        {t.signLabel} · {t.formattedDegree}
        {t.house != null ? ` · House ${t.house}` : ''}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {t.nakshatraLabel} Pada {t.pada}
        {t.nextSignChangeAt
          ? ` · Enters ${t.nextSignLabel} ${formatWhen(t.nextSignChangeAt)}`
          : ''}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t.effect}</p>
    </div>
  );
}

export default function TransitsPage() {
  const [snapshot, setSnapshot] = useState<TransitSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    kundaliApi
      .transits({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kathmandu',
        latitude: 27.7172,
        longitude: 85.324,
        placeName: 'Kathmandu',
        daysAhead: 120,
      })
      .then(setSnapshot)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load transits'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = (snapshot?.transits ?? [])
    .filter((t) => t.daysUntilSignChange != null && t.daysUntilSignChange <= 45)
    .sort((a, b) => (a.daysUntilSignChange ?? 999) - (b.daysUntilSignChange ?? 999));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Planetary Transits</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Live gochara from Swiss Ephemeris — current signs, retrograde status, and upcoming
              ingresses.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link
              href="/astrology/birth-chart"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Personal kundali
            </Link>
          </div>
        </div>

        {snapshot && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {snapshot.ephemerisMode} · {snapshot.ayanamsaName} · {snapshot.placeName} ·{' '}
            {snapshot.dateTime} ({snapshot.timezone})
            {snapshot.personal && snapshot.natalLagna
              ? ` · Houses from natal Lagna ${snapshot.natalLagna}`
              : ' · Houses from transit Ascendant'}
          </p>
        )}

        {loading && !snapshot && (
          <p className="text-gray-500">Calculating transits with Swiss Ephemeris…</p>
        )}
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {snapshot && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Current Transits</h2>
              <div className="space-y-4">
                {snapshot.transits.map((t) => (
                  <TransitCard key={t.code} t={t} />
                ))}
              </div>
            </div>

            {upcoming.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Upcoming sign changes
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Ingresses within the next ~45 days (search window {snapshot.daysAhead}d).
                </p>
                <div className="space-y-3">
                  {upcoming.map((t) => (
                    <div
                      key={`up-${t.code}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3 border border-indigo-100 dark:border-indigo-900"
                    >
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {t.name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {' '}
                          → {t.nextSignLabel}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ~{t.daysUntilSignChange}d · {formatWhen(t.nextSignChangeAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
