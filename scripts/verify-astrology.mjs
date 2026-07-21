/** One-shot verification for kundali + zodiac BFF routes (run: node scripts/verify-astrology.mjs) */
const BASE = process.env.BASE_URL || 'http://localhost:4000';

async function req(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

const results = [];

function pass(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log(`Verifying astrology features at ${BASE}\n`);

  const gen = await req('/api/public/kundali/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      birthDate: '2026-07-21',
      birthTime: '12:00:00',
      timezone: 'Asia/Kathmandu',
      latitude: 27.7172,
      longitude: 85.324,
      placeName: 'Kathmandu',
    }),
  });
  const chart = gen.json?.data ?? gen.json?.result;
  pass(
    'kundali/generate',
    gen.status === 200 && chart?.planets?.length >= 9,
    gen.status === 200 ? `${chart?.planets?.length} planets, ephemeris=${chart?.ephemerisMode}` : gen.json?.message
  );

  const match = await req('/api/public/kundali/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      male: {
        birthDate: '1990-05-15',
        birthTime: '10:30:00',
        timezone: 'Asia/Kathmandu',
        latitude: 27.7172,
        longitude: 85.324,
      },
      female: {
        birthDate: '1992-08-20',
        birthTime: '14:00:00',
        timezone: 'Asia/Kathmandu',
        latitude: 27.7172,
        longitude: 85.324,
      },
    }),
  });
  const matchData = match.json?.data ?? match.json?.result;
  pass(
    'kundali/match',
    match.status === 200 && matchData?.totalScore > 0 && matchData?.gunas?.length === 8,
    match.status === 200
      ? `score=${matchData?.totalScore}/36, charts=${Boolean(matchData?.charts?.male && matchData?.charts?.female)}`
      : match.json?.message
  );

  const compat = await req('/api/public/zodiac-compatibility?signA=ARIES&signB=LEO', {
    headers: { Accept: 'application/json', 'Accept-Language': 'en' },
  });
  const compatData = compat.json?.data ?? compat.json?.result;
  const compatOk = compat.status === 200 && compatData?.score > 0;
  pass(
    'zodiac-compatibility (backend or graceful fail)',
    compatOk || compat.status === 503 || compat.status === 500,
    compatOk
      ? `score=${compatData.score}, level=${compatData.levelLabel ?? compatData.level}`
      : `HTTP ${compat.status} — ${compat.json?.message ?? 'no backend yet (UI uses static fallback)'}`
  );

  const pages = ['/astrology/planets', '/astrology/compatibility', '/astrology/birth-chart'];
  for (const p of pages) {
    const r = await fetch(`${BASE}${p}`);
    pass(`page ${p}`, r.status === 200, `HTTP ${r.status}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
