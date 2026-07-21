'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ZodiacSignEnum } from '@/app/lib/crm.types';
import { useZodiacSigns } from '@/app/lib/use-zodiac-signs';
import { zodiacApi } from '@/app/lib/zodiac.service';
import {
  SUN_SIGN_META,
  ZODIAC_SIGN_ORDER,
  beneficNote,
  modalityLabel,
  planetLabel,
  quickSummaryLine,
  type ZodiacCompatibilityResult,
} from '@/app/lib/zodiac-sun-sign';

type Props = {
  selectedSign: ZodiacSignEnum | null;
  onSelectSign: (sign: ZodiacSignEnum) => void;
};

export default function SunSignQuickPanel({ selectedSign, onSelectSign }: Props) {
  const { rows, loading: zodiacLoading, zodiacName, zodiacElement, zodiacLogoUrl, uiCode } = useZodiacSigns();
  const meta = selectedSign ? SUN_SIGN_META[selectedSign] : null;

  const [compatPreview, setCompatPreview] = useState<ZodiacCompatibilityResult | null>(null);
  const [compatLoading, setCompatLoading] = useState(false);

  const compatibleLabels = useMemo(() => {
    if (!meta) return [];
    return meta.compatibleWith.map((s) => zodiacName(s));
  }, [meta, zodiacName]);

  useEffect(() => {
    if (!selectedSign || !meta?.compatibleWith[0]) {
      setCompatPreview(null);
      return;
    }
    let cancelled = false;
    setCompatLoading(true);
    zodiacApi
      .getCompatibility(selectedSign, meta.compatibleWith[0])
      .then((result) => {
        if (!cancelled) setCompatPreview(result);
      })
      .finally(() => {
        if (!cancelled) setCompatLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSign, meta, uiCode]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Your sun sign (no birth date needed)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pick your zodiac sign for ruling planet, element, benefic notes, and compatibility hints. Sign names come from
          the zodiac master (EN / NE / HI). For exact birth positions, use{' '}
          <Link href="/astrology/birth-chart" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Birth Kundali
          </Link>
          .
        </p>
      </div>

      {zodiacLoading && rows.length === 0 && (
        <p className="text-sm text-gray-500">Loading zodiac signs…</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {ZODIAC_SIGN_ORDER.map((sign) => {
          const active = selectedSign === sign;
          return (
            <button
              key={sign}
              type="button"
              onClick={() => onSelectSign(sign)}
              className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-400'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300'
              }`}
            >
              <img
                src={zodiacLogoUrl(sign)}
                alt=""
                className="w-8 h-8 mx-auto mb-1 opacity-90"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 block leading-tight">
                {zodiacName(sign)}
              </span>
            </button>
          );
        })}
      </div>

      {meta && selectedSign && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-slate-800 p-5 space-y-4 shadow-sm">
          <p className="text-base font-medium text-gray-800 dark:text-gray-100">
            {quickSummaryLine(
              zodiacName(selectedSign),
              planetLabel(meta.rulingPlanet, uiCode),
              zodiacElement(selectedSign),
              compatibleLabels,
              uiCode
            )}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <InfoChip label="Ruling planet" value={planetLabel(meta.rulingPlanet, uiCode)} />
            <InfoChip label="Element" value={zodiacElement(selectedSign)} />
            <InfoChip label="Modality" value={modalityLabel(meta.modality, uiCode)} />
            <InfoChip label="Best matches" value={compatibleLabels.join(' · ')} />
          </div>

          <div className="rounded-lg bg-white/70 dark:bg-slate-900/50 border border-indigo-100 dark:border-slate-700 px-4 py-3">
            <h3 className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold mb-1">
              Benefic guidance (sun-sign)
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{beneficNote(meta, uiCode)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              General sun-sign reference only — functional benefics in Vedic astrology depend on your full birth chart
              (Lagna + Moon).
            </p>
          </div>

          {compatLoading && <p className="text-sm text-gray-500">Loading compatibility detail…</p>}
          {compatPreview && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 text-sm">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                {compatPreview.signALabel ?? zodiacName(compatPreview.signA)} &{' '}
                {compatPreview.signBLabel ?? zodiacName(compatPreview.signB)} — {compatPreview.score}/100
                {compatPreview.levelLabel ? ` (${compatPreview.levelLabel})` : ''}
              </p>
              {compatPreview.summary && (
                <p className="text-gray-700 dark:text-gray-300 mt-1">{compatPreview.summary}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/astrology/compatibility"
              className="text-xs px-3 py-1.5 rounded-full border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-100"
            >
              Full kundali matching (DOB + place) →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{value}</div>
    </div>
  );
}
