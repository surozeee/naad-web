'use client';

import { Star } from 'lucide-react';

interface HoroscopeRatingSelectProps {
  label: string;
  value?: number | null;
  onChange?: (value: number | undefined) => void;
  required?: boolean;
  readOnly?: boolean;
  hint?: string;
  className?: string;
}

function starFill(value: number, star: number): 'full' | 'half' | 'empty' {
  if (value >= star) return 'full';
  if (value >= star - 0.5) return 'half';
  return 'empty';
}

/** Interactive 0.0–5.0 half-star rating (or read-only display). */
export function HoroscopeRatingSelect({
  label,
  value,
  onChange,
  required = false,
  readOnly = false,
  hint,
  className = '',
}: HoroscopeRatingSelectProps) {
  const current = value == null || Number.isNaN(value) ? 0 : Number(value);
  const hasValue = value != null && !Number.isNaN(value);
  const interactive = !readOnly && typeof onChange === 'function';

  const pick = (next: number) => {
    if (!interactive || !onChange) return;
    if (hasValue && Math.abs(current - next) < 1e-9) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  return (
    <div
      className={`flex items-center ${label || hint ? 'justify-between gap-3' : 'justify-end gap-2'} min-h-[2.25rem] py-1.5 border-b border-slate-100 dark:border-slate-700/80 last:border-0 ${className}`}
    >
      {label || hint ? (
        <div className="min-w-0">
          {label ? (
            <div className="text-xs font-semibold">
              {label}
              {required ? <span className="text-red-600"> *</span> : null}
            </div>
          ) : null}
          {hint ? <p className="text-[10px] horoscope-muted leading-tight">{hint}</p> : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2 shrink-0">
        <div
          className="flex items-center gap-0.5"
          role={readOnly ? 'img' : 'group'}
          aria-label={`${label} rating`}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = hasValue ? starFill(current, star) : 'empty';
            const starVisual = (
              <>
                <Star
                  size={18}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${
                    fill === 'empty'
                      ? 'text-slate-300 dark:text-slate-600'
                      : 'text-amber-400'
                  }`}
                  fill={fill === 'full' ? 'currentColor' : 'none'}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {fill === 'half' ? (
                  <div className="absolute left-0 top-0 h-full w-1/2 overflow-hidden">
                    <Star
                      size={18}
                      className="absolute left-1 top-1/2 -translate-y-1/2 text-amber-400"
                      fill="currentColor"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                ) : null}
              </>
            );

            if (!interactive) {
              return (
                <span key={star} className="relative inline-block h-8 w-8 cursor-default">
                  {starVisual}
                </span>
              );
            }

            return (
              <button
                key={star}
                type="button"
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm border-0 bg-transparent p-0 cursor-pointer hover:bg-amber-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/60"
                aria-label={`${label} ${star}`}
                title={`${label}: click left half for ${star - 0.5}, right half for ${star}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                  pick(isLeftHalf ? star - 0.5 : star);
                }}
              >
                {starVisual}
              </button>
            );
          })}
        </div>
        <span className="w-8 text-right text-[11px] font-semibold tabular-nums">
          {hasValue ? current.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  );
}
