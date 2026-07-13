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

  const pick = (next: number) => {
    if (readOnly || !onChange) return;
    if (hasValue && Math.abs(current - next) < 1e-9) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 min-h-[2.25rem] py-1.5 border-b border-slate-100 dark:border-slate-700/80 last:border-0 ${className}`}
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold text-black dark:text-white">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </div>
        {hint ? <p className="text-[10px] horoscope-muted leading-tight">{hint}</p> : null}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center" role={readOnly ? 'img' : 'group'} aria-label={`${label} rating`}>
          {[1, 2, 3, 4, 5].map((star) => {
            const fill = hasValue ? starFill(current, star) : 'empty';
            return (
              <div key={star} className="relative h-7 w-7">
                <Star
                  size={18}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none ${
                    fill === 'empty'
                      ? 'text-slate-300 dark:text-slate-600'
                      : 'text-amber-400'
                  }`}
                  fill={fill === 'full' ? 'currentColor' : 'none'}
                  strokeWidth={1.75}
                />
                {fill === 'half' ? (
                  <div className="absolute left-0 top-0 h-full w-1/2 overflow-hidden pointer-events-none">
                    <Star
                      size={18}
                      className="absolute left-1 top-1/2 -translate-y-1/2 text-amber-400"
                      fill="currentColor"
                      strokeWidth={1.75}
                    />
                  </div>
                ) : null}
                {!readOnly ? (
                  <>
                    <button
                      type="button"
                      className="absolute left-0 top-0 h-full w-1/2 z-10 rounded-l-sm hover:bg-amber-400/10"
                      aria-label={`${label} ${star - 0.5}`}
                      onClick={() => pick(star - 0.5)}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full w-1/2 z-10 rounded-r-sm hover:bg-amber-400/10"
                      aria-label={`${label} ${star}`}
                      onClick={() => pick(star)}
                    />
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
        <span className="w-8 text-right text-[11px] font-semibold tabular-nums text-black dark:text-white">
          {hasValue ? current.toFixed(1) : '—'}
        </span>
      </div>
    </div>
  );
}
