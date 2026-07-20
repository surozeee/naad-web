'use client';

import type { KundaliChart, PlanetPosition } from '@/app/lib/kundali.types';

const SIZE = 420;
const CELL = 100;
const ORIGIN = 10;

/**
 * Fixed South Indian sign grid (rashi indices):
 * Pi Ar Ta Ge
 * Aq -- -- Cn
 * Cp -- -- Le
 * Sa Sc Li Vi
 */
const GRID: (number | null)[][] = [
  [11, 0, 1, 2],
  [10, null, null, 3],
  [9, null, null, 4],
  [8, 7, 6, 5],
];

const RASHI_SHORT = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

function planetsBySign(planets: PlanetPosition[]): Map<number, PlanetPosition[]> {
  const map = new Map<number, PlanetPosition[]>();
  for (let i = 0; i < 12; i++) map.set(i, []);
  for (const p of planets) {
    const list = map.get(p.signIndex) ?? [];
    list.push(p);
    map.set(p.signIndex, list);
  }
  return map;
}

type Props = {
  chart: KundaliChart;
  className?: string;
};

/**
 * Custom South Indian Kundali SVG — signs fixed; houses rotate with Lagna.
 */
export default function SouthIndianChart({ chart, className }: Props) {
  const bySign = planetsBySign(chart.planets);
  const stroke = 'currentColor';

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className ?? 'w-full h-auto text-slate-800 dark:text-slate-100'}
      role="img"
      aria-label={chart.summary?.title ?? 'South Indian Kundali'}
    >
      <rect x={ORIGIN} y={ORIGIN} width={CELL * 4} height={CELL * 4} fill="none" stroke={stroke} strokeWidth="2" />
      {[1, 2, 3].map((i) => (
        <g key={i}>
          <line
            x1={ORIGIN + i * CELL}
            y1={ORIGIN}
            x2={ORIGIN + i * CELL}
            y2={ORIGIN + 4 * CELL}
            stroke={stroke}
            strokeWidth="1"
          />
          <line
            x1={ORIGIN}
            y1={ORIGIN + i * CELL}
            x2={ORIGIN + 4 * CELL}
            y2={ORIGIN + i * CELL}
            stroke={stroke}
            strokeWidth="1"
          />
        </g>
      ))}

      {GRID.map((row, r) =>
        row.map((signIndex, c) => {
          if (signIndex === null) return null;
          const x = ORIGIN + c * CELL;
          const y = ORIGIN + r * CELL;
          const house = ((signIndex - chart.lagnaSignIndex + 12) % 12) + 1;
          const isLagna = signIndex === chart.lagnaSignIndex;
          const planets = bySign.get(signIndex) ?? [];
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                fill={isLagna ? 'rgba(244, 63, 94, 0.08)' : 'transparent'}
              />
              <text
                x={x + 8}
                y={y + 16}
                fontSize="10"
                className="fill-amber-700 dark:fill-amber-400"
                fontWeight={600}
              >
                {RASHI_SHORT[signIndex]} · H{house}
              </text>
              {isLagna && (
                <text x={x + CELL - 8} y={y + 16} textAnchor="end" fontSize="9" className="fill-rose-600" fontWeight={700}>
                  Asc
                </text>
              )}
              {planets.map((p, idx) => (
                <text
                  key={p.code}
                  x={x + CELL / 2}
                  y={y + 40 + idx * 14}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight={600}
                  className={p.retrograde ? 'fill-violet-700 dark:fill-violet-300' : 'fill-current'}
                >
                  {p.glyph}
                  {p.retrograde ? 'ʳ' : ''}
                </text>
              ))}
            </g>
          );
        })
      )}
    </svg>
  );
}
