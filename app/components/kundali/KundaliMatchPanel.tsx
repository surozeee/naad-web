'use client';

import { useState } from 'react';
import type { ChartStyleType, KundaliChart, KundaliMatchResult } from '@/app/lib/kundali.types';
import KundaliChartView from '@/app/components/kundali/KundaliChartView';
import KundaliDetailsPanel from '@/app/components/kundali/KundaliDetailsPanel';

type Props = {
  result: KundaliMatchResult;
};

function scoreColor(obtained: number, maximum: number): string {
  const ratio = maximum > 0 ? obtained / maximum : 0;
  if (ratio >= 0.75) return 'text-emerald-600 dark:text-emerald-400';
  if (ratio >= 0.4) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export default function KundaliMatchPanel({ result }: Props) {
  const ringPercent = Math.min(100, Math.max(0, result.percentage));
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('NORTH_INDIAN');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div
            className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `conic-gradient(#6366f1 ${ringPercent * 3.6}deg, rgb(226 232 240) 0deg)`,
            }}
          >
            <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-800 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {result.totalScore}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">/ {result.maximumScore} gunas</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{result.verdict}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{result.recommendation}</p>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
              {result.percentage}% compatibility (Ashtakoot)
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <PersonCard title="Groom / Male" person={result.male} />
        <PersonCard title="Bride / Female" person={result.female} />
      </div>

      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          result.mangalikCompatibility.compatible
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
        }`}
      >
        <span className="font-semibold">Mangal dosha: </span>
        {result.mangalikCompatibility.note}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Ashtakoot breakdown</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-slate-700">
          {result.gunas.map((g) => (
            <div key={g.code} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-36 font-medium text-gray-800 dark:text-white">{g.label}</div>
              <div className={`sm:w-20 font-semibold ${scoreColor(g.obtained, g.maximum)}`}>
                {g.obtained} / {g.maximum}
              </div>
              <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">{g.summary}</div>
            </div>
          ))}
        </div>
      </div>

      {result.charts?.male && result.charts?.female && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Full kundali charts</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Swiss Ephemeris sidereal charts for both partners — dasha, mangalik, panchanga, dignities.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-slate-600 p-0.5">
              <TabButton active={chartStyle === 'NORTH_INDIAN'} onClick={() => setChartStyle('NORTH_INDIAN')}>
                North
              </TabButton>
              <TabButton active={chartStyle === 'SOUTH_INDIAN'} onClick={() => setChartStyle('SOUTH_INDIAN')}>
                South
              </TabButton>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <ChartCard title="Groom / Male" chart={result.charts.male} style={chartStyle} />
            <ChartCard title="Bride / Female" chart={result.charts.female} style={chartStyle} />
          </div>

          <FullAnalysis title="Groom / Male" chart={result.charts.male} />
          <FullAnalysis title="Bride / Female" chart={result.charts.female} />
        </div>
      )}
    </div>
  );
}

function FullAnalysis({ title, chart }: { title: string; chart: KundaliChart }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title} — full analysis</h3>
      <ChartMeta chart={chart} />
      <KundaliDetailsPanel chart={chart} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-md transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function ChartCard({
  title,
  chart,
  style,
}: {
  title: string;
  chart: KundaliChart;
  style: ChartStyleType;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-slate-700 space-y-4">
      <div>
        <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
        {chart.name && (
          <p className="text-lg font-semibold text-gray-800 dark:text-white">{chart.name}</p>
        )}
      </div>
      <div className="max-w-sm mx-auto">
        <KundaliChartView chart={chart} style={style} />
      </div>
      <ChartMeta chart={chart} compact />
    </div>
  );
}

function ChartMeta({ chart, compact = false }: { chart: KundaliChart; compact?: boolean }) {
  return (
    <div className={`grid ${compact ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-2 text-sm`}>
      <Info label="Birth" value={chart.birthDateTime} />
      <Info
        label="Place"
        value={
          chart.placeName ||
          `${chart.latitude}, ${chart.longitude}` + (chart.timezone ? ` · ${chart.timezone}` : '')
        }
      />
      <Info label="Lagna" value={`${chart.summary.lagna} (${chart.ascendant.formattedDegree})`} />
      <Info label="Moon" value={`${chart.summary.moonSign} · ${chart.summary.moonNakshatra}`} />
      <Info label="Sun" value={chart.summary.sunSign} />
      <Info label="Ayanamsa" value={`${chart.ayanamsaName} ${chart.ayanamsaDegrees.toFixed(4)}°`} />
    </div>
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

function PersonCard({
  title,
  person,
}: {
  title: string;
  person: KundaliMatchResult['male'];
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
      {person.name && (
        <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{person.name}</p>
      )}
      <dl className="space-y-1 text-sm">
        <Row label="Lagna" value={person.lagna} />
        <Row label="Moon sign" value={person.moonSign} />
        <Row label="Moon nakshatra" value={person.moonNakshatra} />
        <Row
          label="Mangal dosha"
          value={
            person.mangalik
              ? `Yes${person.mangalikSeverity ? ` (${person.mangalikSeverity})` : ''}`
              : 'No'
          }
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-800 dark:text-gray-100 text-right">{value}</dd>
    </div>
  );
}
