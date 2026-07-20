'use client';

import { Star } from 'lucide-react';

function starFill(value: number, star: number): 'full' | 'half' | 'empty' {
  if (value >= star) return 'full';
  if (value >= star - 0.5) return 'half';
  return 'empty';
}

export function AstrologerStarDisplay({
  value,
  size = 14,
  className = '',
}: {
  value?: number | null;
  size?: number;
  className?: string;
}) {
  const n = value == null || Number.isNaN(Number(value)) ? 0 : Number(value);
  const hasValue = n > 0;

  return (
    <span className={`naad-stars ${className}`} aria-label={hasValue ? `${n.toFixed(1)} of 5` : 'No rating'}>
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const fill = hasValue ? starFill(n, star) : 'empty';
        return (
          <span key={star} className="naad-star-wrap">
            <Star
              size={size}
              className={fill === 'empty' ? 'naad-star-empty' : 'naad-star-on'}
              fill={fill === 'full' ? 'currentColor' : 'none'}
              strokeWidth={1.75}
              aria-hidden
            />
            {fill === 'half' ? (
              <span className="naad-star-half">
                <Star size={size} className="naad-star-on" fill="currentColor" strokeWidth={1.75} aria-hidden />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

export function formatAstrologerRating(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(1);
}
