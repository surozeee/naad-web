'use client';

import type { KundaliChart, PlanetPosition } from '@/app/lib/kundali.types';

const SIZE = 420;
const RASHI_NUM = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०', '११', '१२'];

/** House label anchor points for classic North Indian diamond chart. */
const HOUSE_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 210, y: 95 },
  2: { x: 315, y: 55 },
  3: { x: 365, y: 155 },
  4: { x: 315, y: 210 },
  5: { x: 365, y: 265 },
  6: { x: 315, y: 365 },
  7: { x: 210, y: 325 },
  8: { x: 105, y: 365 },
  9: { x: 55, y: 265 },
  10: { x: 105, y: 210 },
  11: { x: 55, y: 155 },
  12: { x: 105, y: 55 },
};

function planetsByHouse(planets: PlanetPosition[]): Map<number, PlanetPosition[]> {
  const map = new Map<number, PlanetPosition[]>();
  for (let h = 1; h <= 12; h++) map.set(h, []);
  for (const p of planets) {
    const list = map.get(p.house) ?? [];
    list.push(p);
    map.set(p.house, list);
  }
  return map;
}

function rashiNumber(lagnaSignIndex: number, house: number): string {
  const idx = (lagnaSignIndex + house - 1) % 12;
  return RASHI_NUM[idx] ?? String(idx + 1);
}

type Props = {
  chart: KundaliChart;
  className?: string;
};

/**
 * Custom North Indian (diamond) Kundali SVG — signs rotate with Lagna; houses fixed.
 */
export default function NorthIndianChart({ chart, className }: Props) {
  const byHouse = planetsByHouse(chart.planets);
  const stroke = 'currentColor';

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className ?? 'w-full h-auto text-slate-800 dark:text-slate-100'}
      role="img"
      aria-label={chart.summary?.title ?? 'North Indian Kundali'}
    >
      <rect x="10" y="10" width="400" height="400" fill="none" stroke={stroke} strokeWidth="2" />
      <line x1="10" y1="10" x2="410" y2="410" stroke={stroke} strokeWidth="1.5" />
      <line x1="410" y1="10" x2="10" y2="410" stroke={stroke} strokeWidth="1.5" />
      <polygon
        points="210,10 410,210 210,410 10,210"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
      />

      {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
        const c = HOUSE_CENTERS[house];
        const planets = byHouse.get(house) ?? [];
        const isLagna = house === 1;
        return (
          <g key={house}>
            <text
              x={c.x}
              y={c.y - 18}
              textAnchor="middle"
              className="fill-amber-700 dark:fill-amber-400"
              fontSize="11"
              fontWeight={isLagna ? 700 : 500}
            >
              {rashiNumber(chart.lagnaSignIndex, house)}
            </text>
            {isLagna && (
              <text
                x={c.x}
                y={c.y - 32}
                textAnchor="middle"
                fontSize="9"
                className="fill-rose-600 dark:fill-rose-400"
                fontWeight={700}
              >
                Asc
              </text>
            )}
            {planets.map((p, idx) => (
              <text
                key={p.code}
                x={c.x}
                y={c.y + 2 + idx * 14}
                textAnchor="middle"
                fontSize="12"
                fontWeight={600}
                className={p.retrograde ? 'fill-violet-700 dark:fill-violet-300' : 'fill-current'}
              >
                {p.glyph}
                {p.retrograde ? 'ʳ' : ''}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
