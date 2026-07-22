'use client';

import type {
  KundaliChart,
  KundaliInsights,
  LifeAreaInsight,
  MuhurtaActivity,
} from '@/app/lib/kundali.types';

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'good' | 'bad' | 'warn' | 'neutral' }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
      : tone === 'bad'
        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
        : tone === 'warn'
          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800/60 p-4 space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h3>
      {children}
    </section>
  );
}

function mangalikTone(severity: string): 'good' | 'bad' | 'warn' | 'neutral' {
  if (severity === 'NONE' || severity === 'CANCELLED') return 'good';
  if (severity === 'STRONG') return 'bad';
  if (severity === 'MILD') return 'warn';
  return 'neutral';
}

function timingTone(q: string): 'good' | 'bad' | 'warn' | 'neutral' {
  if (q === 'AUSPICIOUS') return 'good';
  if (q === 'INAUSPICIOUS') return 'bad';
  if (q === 'MIXED') return 'warn';
  return 'neutral';
}

function strengthTone(s: string): 'good' | 'bad' | 'warn' | 'neutral' {
  if (s === 'STRONG' || s === 'FAVOURABLE') return 'good';
  if (s === 'WEAK' || s === 'UNFAVOURABLE') return 'bad';
  if (s === 'MIXED' || s === 'MODERATE' || s === 'CAUTION') return 'warn';
  return 'neutral';
}

function lifeAreaList(insights?: KundaliInsights | null): LifeAreaInsight[] {
  if (!insights) return [];
  return [
    insights.family,
    insights.education,
    insights.marital,
    insights.abroad,
    insights.business,
    insights.health,
    insights.career,
    insights.finance,
    insights.children,
  ].filter((x): x is LifeAreaInsight => Boolean(x));
}

function InsightCard({ insight }: { insight: LifeAreaInsight }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-slate-600/80 bg-slate-50/80 dark:bg-slate-700/30 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{insight.title}</h4>
        <Badge tone={strengthTone(insight.strength)}>{insight.strength}</Badge>
        {insight.houseFocus?.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Houses {insight.houseFocus.join(', ')}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{insight.summary}</p>
      {insight.keyFactors?.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
          {insight.keyFactors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {insight.guidance?.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          {insight.guidance.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MuhurtaCard({ activity }: { activity: MuhurtaActivity }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-slate-600/80 bg-slate-50/80 dark:bg-slate-700/30 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{activity.title}</h4>
        <Badge tone={strengthTone(activity.suitability)}>{activity.suitability}</Badge>
        {activity.houseFocus?.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Houses {activity.houseFocus.join(', ')}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{activity.summary}</p>
      {activity.keyFactors?.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
          {activity.keyFactors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
      {activity.guidance?.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          {activity.guidance.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function KundaliDetailsPanel({ chart }: { chart: KundaliChart }) {
  const dignityByCode = new Map((chart.dignities ?? []).map((d) => [d.planetCode, d]));
  const lifeAreas = lifeAreaList(chart.insights);
  const goodTimes = chart.insights?.goodTimes;
  const birthMoment = goodTimes?.birthMoment ?? chart.insights?.goodTime ?? null;
  const muhurtaActivities = goodTimes?.activities ?? [];

  return (
    <div className="space-y-4">
      {(birthMoment || muhurtaActivities.length > 0) && (
        <Section title="Good times">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Birth-moment quality and natal leanings for starting business, journey, marriage, and other auspicious work.
          </p>
          {birthMoment && <InsightCard insight={birthMoment} />}
          {muhurtaActivities.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-2">
              {muhurtaActivities.map((activity) => (
                <MuhurtaCard key={activity.activity} activity={activity} />
              ))}
            </div>
          )}
        </Section>
      )}

      {lifeAreas.length > 0 && (
        <Section title="Life areas">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Family, education, marital life, abroad, business, health, career, finance, and children — house/significator reading.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {lifeAreas.map((insight) => (
              <InsightCard key={insight.area} insight={insight} />
            ))}
          </div>
        </Section>
      )}

      {chart.panchanga && (
        <Section title="Panchanga & timing">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={timingTone(chart.panchanga.timingQuality)}>{chart.panchanga.timingQuality}</Badge>
            <span className="text-sm text-gray-700 dark:text-gray-200">{chart.panchanga.timingSummary}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            <Detail label="Weekday" value={chart.panchanga.weekday} />
            <Detail
              label="Tithi"
              value={`${chart.panchanga.tithiName} (${chart.panchanga.paksha}, #${chart.panchanga.tithiNumber})`}
            />
            <Detail label="Yoga" value={`${chart.panchanga.yogaName} (#${chart.panchanga.yogaNumber})`} />
            <Detail label="Karana" value={chart.panchanga.karanaName} />
            <Detail
              label="Moon nakshatra"
              value={`${chart.panchanga.moonNakshatraLabel} · Pada ${chart.panchanga.moonPada}`}
            />
          </div>
          {chart.panchanga.guidance?.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {chart.panchanga.guidance.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {chart.mangalik && (
        <Section title="Mangalik (Mangal Dosha)">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={mangalikTone(chart.mangalik.severity)}>{chart.mangalik.severity}</Badge>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {chart.mangalik.present ? 'Manglik factors present' : 'Not indicated as Manglik'}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{chart.mangalik.summary}</p>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            <Detail label="Mars house (Lagna)" value={String(chart.mangalik.marsHouseFromLagna ?? '—')} />
            <Detail label="Mars house (Moon)" value={String(chart.mangalik.marsHouseFromMoon ?? '—')} />
            <Detail label="Mars house (Venus)" value={String(chart.mangalik.marsHouseFromVenus ?? '—')} />
          </div>
          {chart.mangalik.marsSignLabel && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mars in {chart.mangalik.marsSignLabel}
            </p>
          )}
          {chart.mangalik.notes?.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {chart.mangalik.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {chart.dasha && (
        <Section title="Vimshottari Dasha">
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <Detail
              label="Moon nakshatra"
              value={`${chart.dasha.moonNakshatraLabel} · Pada ${chart.dasha.moonPada}`}
            />
            <Detail
              label="Balance at birth"
              value={`${chart.dasha.balanceLordLabel} · ${chart.dasha.balanceYears.toFixed(2)} years`}
            />
            {chart.dasha.currentMahadasha && (
              <Detail
                label="Current Mahadasha"
                value={`${chart.dasha.currentMahadasha.planetLabel} (${chart.dasha.currentMahadasha.startDate} → ${chart.dasha.currentMahadasha.endDate})`}
              />
            )}
            {chart.dasha.currentAntardasha && (
              <Detail
                label="Current Antardasha"
                value={`${chart.dasha.currentAntardasha.planetLabel} (${chart.dasha.currentAntardasha.startDate} → ${chart.dasha.currentAntardasha.endDate})`}
              />
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Mahadasha periods</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-600 text-left text-gray-500">
                    <th className="py-1.5 pr-3">Lord</th>
                    <th className="py-1.5 pr-3">Start</th>
                    <th className="py-1.5 pr-3">End</th>
                    <th className="py-1.5">Years</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.dasha.mahadashas.map((d) => (
                    <tr
                      key={`${d.planetCode}-${d.startDate}`}
                      className={`border-b border-gray-100 dark:border-slate-700/50 ${
                        d.current ? 'bg-indigo-50/80 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <td className="py-1.5 pr-3 font-medium">
                        {d.planetLabel}
                        {d.current ? ' · now' : ''}
                      </td>
                      <td className="py-1.5 pr-3 font-mono text-xs">{d.startDate}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs">{d.endDate}</td>
                      <td className="py-1.5">{d.years.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {chart.dasha.antardashas?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Antardasha (within current Mahadasha)
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-600 text-left text-gray-500">
                      <th className="py-1.5 pr-3">Lord</th>
                      <th className="py-1.5 pr-3">Start</th>
                      <th className="py-1.5 pr-3">End</th>
                      <th className="py-1.5">Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.dasha.antardashas.map((d) => (
                      <tr
                        key={`a-${d.planetCode}-${d.startDate}`}
                        className={`border-b border-gray-100 dark:border-slate-700/50 ${
                          d.current ? 'bg-indigo-50/80 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <td className="py-1.5 pr-3 font-medium">
                          {d.planetLabel}
                          {d.current ? ' · now' : ''}
                        </td>
                        <td className="py-1.5 pr-3 font-mono text-xs">{d.startDate}</td>
                        <td className="py-1.5 pr-3 font-mono text-xs">{d.endDate}</td>
                        <td className="py-1.5">{d.years.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Planetary positions (Swiss Ephemeris)">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-600 text-left text-gray-500">
                <th className="py-2 pr-3">Planet</th>
                <th className="py-2 pr-3">Sign</th>
                <th className="py-2 pr-3">Degree</th>
                <th className="py-2 pr-3">House</th>
                <th className="py-2 pr-3">Nakshatra</th>
                <th className="py-2 pr-3">Speed</th>
                <th className="py-2">Dignity</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => {
                const dig = dignityByCode.get(p.code);
                return (
                  <tr key={p.code} className="border-b border-gray-100 dark:border-slate-700/60">
                    <td className="py-2 pr-3 font-medium">
                      {p.glyph} {p.name}
                      {p.retrograde ? ' (R)' : ''}
                    </td>
                    <td className="py-2 pr-3">{p.signLabel}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{p.formattedDegree}</td>
                    <td className="py-2 pr-3">{p.house}</td>
                    <td className="py-2 pr-3">
                      {p.nakshatraLabel} · Pada {p.pada}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{p.speed.toFixed(4)}°/d</td>
                    <td className="py-2">
                      {dig ? (
                        <span title={dig.note}>
                          {dig.status}
                          {dig.signLordLabel ? ` · lord ${dig.signLordLabel}` : ''}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="House cusps">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-600 text-left text-gray-500">
                <th className="py-2 pr-3">House</th>
                <th className="py-2 pr-3">Sign</th>
                <th className="py-2">Degree</th>
              </tr>
            </thead>
            <tbody>
              {chart.houses.map((h) => (
                <tr key={h.number} className="border-b border-gray-100 dark:border-slate-700/60">
                  <td className="py-2 pr-3 font-medium">{h.number}</td>
                  <td className="py-2 pr-3">{h.signLabel}</td>
                  <td className="py-2 font-mono text-xs">{h.formattedDegree}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Calculation meta">
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <Detail label="Birth" value={`${chart.birthDateTime} (${chart.timezone})`} />
          <Detail label="Julian Day (UT)" value={chart.julianDayUt.toFixed(6)} />
          <Detail label="Ayanamsa" value={`${chart.ayanamsaName} ${chart.ayanamsaDegrees.toFixed(4)}°`} />
          <Detail label="House system" value={chart.houseSystem} />
          <Detail label="Ephemeris" value={chart.ephemerisMode} />
          <Detail
            label="Coordinates"
            value={`${chart.latitude.toFixed(5)}, ${chart.longitude.toFixed(5)}`}
          />
        </div>
      </Section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="font-medium text-gray-800 dark:text-gray-100">{value}</div>
    </div>
  );
}
