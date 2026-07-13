'use client';

import { useMemo } from 'react';
import { HoroscopeRatingSelect } from '@/app/horoscope/components/HoroscopeRatingSelect';
import { computeOverallRating } from '@/app/lib/horoscope-multilang';

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
  { key: 'loveRating' as const, label: 'Love' },
  { key: 'careerRating' as const, label: 'Career' },
  { key: 'moneyRating' as const, label: 'Finance' },
  { key: 'healthRating' as const, label: 'Health' },
  { key: 'familyRating' as const, label: 'Family' },
  { key: 'educationRating' as const, label: 'Education' },
  { key: 'travelRating' as const, label: 'Travel' },
  { key: 'luckRating' as const, label: 'Luck' },
];

/** Category star ratings + read-only Overall (average of set categories, 0.5 step). */
export function HoroscopeRatingsPanel({
  value,
  onChange,
  className = '',
}: HoroscopeRatingsPanelProps) {
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
    <div className={`rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden ${className}`}>
      <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-600">
        <span className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted">Category</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted text-right">Rating</span>
      </div>
      <div className="px-3">
        <HoroscopeRatingSelect
          label="Overall"
          value={overall}
          readOnly
          hint="Auto average of ratings below"
        />
        {CATEGORY_FIELDS.map((field) => (
          <HoroscopeRatingSelect
            key={field.key}
            label={field.label}
            value={value[field.key]}
            onChange={(next) => setCategory(field.key, next)}
          />
        ))}
      </div>
    </div>
  );
}
