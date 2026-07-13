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
  /** When true (default), show RATINGS title with Overall on the right above the box. */
  showTitle?: boolean;
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

/** Category star ratings; Overall sits on the right of the RATINGS title (auto average). */
export function HoroscopeRatingsPanel({
  value,
  onChange,
  className = '',
  showTitle = true,
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

  return (
    <div className={`space-y-2 ${className}`}>
      {showTitle ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider horoscope-key m-0">
            {t('common.ratings')}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-black dark:text-white">
                {t('common.overall')}
              </div>
              <p className="text-[9px] horoscope-muted m-0">{t('add.autoAverage')}</p>
            </div>
            <HoroscopeRatingSelect
              label=""
              value={overall}
              readOnly
              className="!min-h-0 !py-0 !border-0 gap-1.5"
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden horoscope-ratings-panel">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 relative z-10">
          {CATEGORY_FIELDS.map((field, index) => (
            <div
              key={field.key}
              className={`px-3 relative z-10 ${
                index % 2 === 0 ? 'sm:border-r sm:border-slate-200 dark:sm:border-slate-600' : ''
              }`}
            >
              <HoroscopeRatingSelect
                label={t(field.labelKey)}
                value={value[field.key]}
                onChange={(next) => setCategory(field.key, next)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
