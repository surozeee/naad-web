'use client';

type PlanetDef = {
  id: string;
  /** Orbit radius from sun center */
  radius: number;
  /** Starting angle in degrees (0 = right, -90 = top) */
  startDeg: number;
  size: number;
  className: string;
  ring?: boolean;
  moon?: boolean;
  duration: string;
  reverse?: boolean;
};

const PLANETS: PlanetDef[] = [
  { id: 'mercury', radius: 46, startDeg: -40, size: 3.8, className: 'naad-planet--mercury', duration: '14s' },
  { id: 'venus', radius: 64, startDeg: 55, size: 5.4, className: 'naad-planet--venus', duration: '22s' },
  { id: 'earth', radius: 84, startDeg: -110, size: 6.2, className: 'naad-planet--earth', duration: '32s', moon: true },
  { id: 'mars', radius: 102, startDeg: 150, size: 4.8, className: 'naad-planet--mars', duration: '42s', reverse: true },
  { id: 'jupiter', radius: 122, startDeg: 20, size: 9.5, className: 'naad-planet--jupiter', duration: '58s' },
  { id: 'saturn', radius: 142, startDeg: -160, size: 7.8, className: 'naad-planet--saturn', duration: '74s', ring: true },
  { id: 'uranus', radius: 158, startDeg: 95, size: 5.6, className: 'naad-planet--uranus', duration: '96s', reverse: true },
  { id: 'neptune', radius: 174, startDeg: -70, size: 5.2, className: 'naad-planet--neptune', duration: '118s' },
];

const ORBIT_RADII = [46, 64, 84, 102, 122, 142, 158, 174];

function polar(cx: number, cy: number, radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  // Fixed precision avoids SSR/client float drift → hydration mismatch
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x: round(cx + Math.cos(rad) * radius),
    y: round(cy + Math.sin(rad) * radius),
  };
}

/** Professional cosmic hero visual — sun + multi-planet orbits + zodiac ring */
export default function HeroCosmicVisual() {
  const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

  return (
    <div className="naad-hero-visual" aria-hidden>
      <svg className="naad-cosmos" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="naad-sun-core" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="var(--naad-accent-bright)" stopOpacity="1" />
            <stop offset="55%" stopColor="var(--naad-accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--naad-primary)" stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id="naad-sun-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--naad-accent)" stopOpacity="0.45" />
            <stop offset="70%" stopColor="var(--naad-primary)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--naad-primary)" stopOpacity="0" />
          </radialGradient>
          <filter id="naad-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle className="naad-cosmos-halo" cx="200" cy="200" r="182" fill="url(#naad-sun-halo)" />

        {/* Orbital paths */}
        {ORBIT_RADII.map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            className={`naad-orbit-path${i === 2 || i === 5 ? ' naad-orbit-path--strong' : ''}`}
          />
        ))}

        {/* Asteroid belt accents between Mars & Jupiter */}
        <g className="naad-asteroid-belt">
          {Array.from({ length: 18 }, (_, i) => {
            const deg = i * 20 - 8;
            const radius = 110 + (i % 3) * 2.5;
            const p = polar(200, 200, radius, deg);
            return <circle key={i} cx={p.x} cy={p.y} r={i % 4 === 0 ? 1.4 : 0.9} className="naad-asteroid" />;
          })}
        </g>

        {/* Zodiac ring */}
        <g className="naad-zodiac-ring">
          {signs.map((sign, i) => {
            const angle = i * 30 - 90;
            const inner = polar(200, 200, 186, angle);
            const outer = polar(200, 200, 196, angle);
            const label = polar(200, 200, 191, angle);
            return (
              <g key={sign}>
                <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="naad-zodiac-spoke" />
                <text
                  x={label.x}
                  y={label.y}
                  className="naad-zodiac-glyph"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {sign}
                </text>
              </g>
            );
          })}
        </g>

        {/* Planets */}
        {PLANETS.map((planet) => {
          const pos = polar(200, 200, planet.radius, planet.startDeg);
          const moonPos = planet.moon
            ? polar(pos.x, pos.y, planet.size + 7, planet.startDeg - 35)
            : null;

          return (
            <g
              key={planet.id}
              className={`naad-orbit${planet.reverse ? ' is-reverse' : ''}`}
              style={{ animationDuration: planet.duration }}
            >
              <circle
                className={`naad-planet ${planet.className}`}
                cx={pos.x}
                cy={pos.y}
                r={planet.size}
                filter={planet.id === 'earth' || planet.id === 'jupiter' ? 'url(#naad-soft-glow)' : undefined}
              />
              {planet.ring ? (
                <ellipse
                  className="naad-saturn-ring"
                  cx={pos.x}
                  cy={pos.y}
                  rx={planet.size + 7}
                  ry={planet.size * 0.55}
                />
              ) : null}
              {moonPos ? (
                <circle className="naad-planet-moon" cx={moonPos.x} cy={moonPos.y} r={2} />
              ) : null}
            </g>
          );
        })}

        {/* Sun */}
        <g className="naad-sun" filter="url(#naad-soft-glow)">
          <circle className="naad-sun-pulse" cx="200" cy="200" r="32" fill="url(#naad-sun-halo)" />
          <circle cx="200" cy="200" r="16" fill="url(#naad-sun-core)" />
          <circle cx="195" cy="195" r="3.5" fill="var(--naad-hero-fg)" fillOpacity="0.35" />
        </g>
      </svg>
    </div>
  );
}
