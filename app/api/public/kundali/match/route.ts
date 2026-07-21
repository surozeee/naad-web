import { NextResponse } from 'next/server';
import { computeKundaliMatch } from '@/app/lib/kundali-match';
import type { KundaliChart, KundaliGenerateRequest } from '@/app/lib/kundali.types';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

type PersonInput = KundaliGenerateRequest & { birthTime?: string };

function pickPerson(raw: Record<string, unknown>, keys: string[]): PersonInput | null {
  for (const key of keys) {
    const v = raw[key];
    if (v && typeof v === 'object') return v as PersonInput;
  }
  return null;
}

function validatePerson(label: string, person: PersonInput): string | null {
  if (!person.birthDate?.trim()) return `${label}: date of birth is required`;
  if (Number.isNaN(Number(person.latitude)) || Number.isNaN(Number(person.longitude))) {
    return `${label}: birth place (latitude/longitude) is required`;
  }
  return null;
}

async function generateChart(
  person: PersonInput,
  defaults: { language: string; ayanamsa?: string; houseSystem?: string },
  acceptLanguage: string
): Promise<KundaliChart> {
  const body = {
    language: defaults.language,
    ayanamsa: person.ayanamsa ?? defaults.ayanamsa ?? 'LAHIRI',
    houseSystem: person.houseSystem ?? defaults.houseSystem ?? 'WHOLE_SIGN',
    chartStyle: person.chartStyle ?? 'NORTH_INDIAN',
    timezone: person.timezone ?? 'Asia/Kathmandu',
    ...person,
    birthTime:
      person.birthTime && person.birthTime.length === 5 ? `${person.birthTime}:00` : person.birthTime,
  };

  const res = await publicBackendRequest(
    ['/public/event/kundali/generate', '/mobile/public/kundali/generate'],
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Accept-Language': acceptLanguage.slice(0, 8) },
    }
  );

  const json = (await res.json().catch(() => ({}))) as {
    data?: KundaliChart;
    result?: KundaliChart;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(typeof json.message === 'string' ? json.message : `Kundali generate failed (${res.status})`);
  }
  const chart = json.data ?? json.result;
  if (!chart) throw new Error('Empty kundali chart from backend');
  return chart;
}

/** Proxy kundali matching — backend when available, else dual generate + Ashtakoot. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const language =
      (typeof body.language === 'string' && body.language) ||
      acceptLanguage.slice(0, 8) ||
      'en';

    const male = pickPerson(body, ['male', 'groom', 'boy', 'person1']);
    const female = pickPerson(body, ['female', 'bride', 'girl', 'person2']);

    if (!male || !female) {
      return NextResponse.json(
        { status: 'FAILED', message: 'Both male and female birth details are required' },
        { status: 400 }
      );
    }

    const maleErr = validatePerson('Groom', male);
    if (maleErr) return NextResponse.json({ status: 'FAILED', message: maleErr }, { status: 400 });
    const femaleErr = validatePerson('Bride', female);
    if (femaleErr) return NextResponse.json({ status: 'FAILED', message: femaleErr }, { status: 400 });

    const upstreamBody = {
      ...body,
      male,
      female,
      language,
    };

    const upstream = await publicBackendRequest(
      ['/public/event/kundali/match', '/mobile/public/kundali/match'],
      {
        method: 'POST',
        body: JSON.stringify(upstreamBody),
        headers: { 'Accept-Language': acceptLanguage.slice(0, 8) },
      }
    );

    const upstreamJson = await upstream.json().catch(() => ({}));
    const upstreamData =
      (upstreamJson as { data?: unknown }).data ?? (upstreamJson as { result?: unknown }).result;

    if (upstream.ok && upstreamData && typeof upstreamData === 'object') {
      return NextResponse.json(upstreamJson, { status: upstream.status });
    }

    const upstreamMsg =
      typeof (upstreamJson as { message?: string }).message === 'string'
        ? (upstreamJson as { message: string }).message
        : '';
    const backendMissing =
      upstream.status === 404 ||
      upstreamMsg.toLowerCase().includes('no static resource') ||
      upstreamMsg.toLowerCase().includes('not found');

    if (!backendMissing && !upstream.ok) {
      return NextResponse.json(upstreamJson, { status: upstream.status });
    }

    const defaults = {
      language,
      ayanamsa: typeof body.ayanamsa === 'string' ? body.ayanamsa : undefined,
      houseSystem: typeof body.houseSystem === 'string' ? body.houseSystem : undefined,
    };

    const [maleChart, femaleChart] = await Promise.all([
      generateChart(male, defaults, acceptLanguage),
      generateChart(female, defaults, acceptLanguage),
    ]);

    const includeCharts = body.includeCharts !== false;
    const match = computeKundaliMatch(maleChart, femaleChart, { includeCharts });

    return NextResponse.json({
      status: 'SUCCESS',
      data: match,
      source: 'computed',
    });
  } catch (error) {
    console.error('[Public] kundali match error:', error);
    const message = error instanceof Error ? error.message : 'Kundali matching unavailable';
    return NextResponse.json({ status: 'FAILED', message }, { status: 503 });
  }
}
