'use client';

import { useMemo } from 'react';
import { HoroscopeRatingSelect } from '@/app/horoscope/components/HoroscopeRatingSelect';
import { computeOverallRating } from '@/app/lib/horoscope-multilang';
import { useHoroscopeI18n } from '@/app/lib/horoscope-i18n';

export interface HoroscopeCategoryRatings {
  loveRating?: number;
  careerRating?: number;
  moneyRating?: number;
  healthRating?: number;
  familyRating?: number;
  educationRating?: number;
  travelRating?: number;
  luckRating?: number;
  overallRating?: number;
}

interface HoroscopeRatingsPanelProps {
  value: HoroscopeCategoryRatings;
  onChange: (next: HoroscopeCategoryRatings) => void;
  className?: string;
}

const CATEGORY_FIELDS = [
  { key: 'loveRating' as const, labelKey: 'common.ratingLabels.love' },
  { key: 'careerRating' as const, labelKey: 'common.ratingLabels.career' },
  { key: 'moneyRating' as const, labelKey: 'common.ratingLabels.money' },
  { key: 'healthRating' as const, labelKey: 'common.ratingLabels.health' },
  { key: 'familyRating' as const, labelKey: 'common.ratingLabels.family' },
  { key: 'educationRating' as const, labelKey: 'common.ratingLabels.education' },
  { key: 'travelRating' as const, labelKey: 'common.ratingLabels.travel' },
  { key: 'luckRating' as const, labelKey: 'common.ratingLabels.luck' },
];

/** Category star ratings + read-only Overall (average of set categories, 0.5 step). Two per row. */
export function HoroscopeRatingsPanel({
  value,
  onChange,
  className = '',
}: HoroscopeRatingsPanelProps) {
  const { t } = useHoroscopeI18n();

  const overall = useMemo(
    () =>
      computeOverallRating({
        loveRating: value.loveRating,
        careerRating: value.careerRating,
        moneyRating: value.moneyRating,
        healthRating: value.healthRating,
        familyRating: value.familyRating,
        educationRating: value.educationRating,
        travelRating: value.travelRating,
        luckRating: value.luckRating,
      }),
    [
      value.loveRating,
      value.careerRating,
      value.moneyRating,
      value.healthRating,
      value.familyRating,
      value.educationRating,
      value.travelRating,
      value.luckRating,
    ]
  );

  const setCategory = (key: (typeof CATEGORY_FIELDS)[number]['key'], next: number | undefined) => {
    const patch = { ...value, [key]: next };
    onChange({
      ...patch,
      overallRating: computeOverallRating(patch),
    });
  };

  const rows = [
    {
      key: 'overallRating' as const,
      label: t('common.overall'),
      readOnly: true as const,
      value: overall,
      hint: t('add.autoAverage'),
    },
    ...CATEGORY_FIELDS.map((field) => ({
      key: field.key,
      label: t(field.labelKey),
      readOnly: false as const,
      value: value[field.key],
      hint: undefined as string | undefined,
    })),
  ];

  return (
    <div className={`rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden horoscope-ratings-panel ${className}`}>
      <div className="hidden sm:grid grid-cols-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60">
        {[0, 1].map((col) => (
          <div
            key={col}
            className={`grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2 ${
              col === 0 ? 'border-r border-slate-200 dark:border-slate-600' : ''
            }`}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted">
              {t('list.category')}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted text-right">
              {t('list.rating')}
            </span>
          </div>
        ))}
      </div>
      <div className="sm:hidden grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-600">
        <span className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted">
          {t('list.category')}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted text-right">
          {t('list.rating')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={`px-3 ${
              index % 2 === 0 ? 'sm:border-r sm:border-slate-200 dark:sm:border-slate-600' : ''
            }`}
          >
            <HoroscopeRatingSelect
              label={row.label}
              value={row.value}
              readOnly={row.readOnly}
              hint={row.hint}
              onChange={
                row.readOnly
                  ? undefined
                  : (next) => setCategory(row.key as (typeof CATEGORY_FIELDS)[number]['key'], next)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
