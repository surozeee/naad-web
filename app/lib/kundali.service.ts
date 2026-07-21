/**
 * Public kundali helpers — Swiss Ephemeris chart via BFF.
 */

import type { GlobalResponse } from '@/app/lib/master.types';
import type {
  KundaliChart,
  KundaliGenerateRequest,
  KundaliMatchRequest,
  KundaliMatchResult,
  TransitGenerateRequest,
  TransitSnapshot,
} from '@/app/lib/kundali.types';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { getStoredUiLanguage } from '@/app/lib/ui-language';

async function publicFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) headers.set('Accept', '*/*');
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getStoredUiLanguage());
  }
  const xsrf = getXsrfToken();
  if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);
  return fetch(input, {
    ...init,
    credentials: 'same-origin',
    headers,
  });
}

function formatApiError(json: { message?: string; code?: string }, status: number): string {
  if (typeof json.message === 'string' && json.message.trim()) return json.message.trim();
  if (typeof json.code === 'string' && json.code.trim()) return json.code.trim();
  return `HTTP ${status}`;
}

export const kundaliApi = {
  generate: async (body: KundaliGenerateRequest): Promise<KundaliChart> => {
    const res = await publicFetch('/api/public/kundali/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: getStoredUiLanguage(),
        ayanamsa: 'LAHIRI',
        houseSystem: 'WHOLE_SIGN',
        chartStyle: 'NORTH_INDIAN',
        timezone: 'Asia/Kathmandu',
        ...body,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<KundaliChart> & {
      result?: KundaliChart;
    };
    if (!res.ok) throw new Error(formatApiError(json, res.status));
    const chart = json.data ?? json.result;
    if (!chart) throw new Error('Empty kundali response');
    return chart;
  },

  match: async (body: KundaliMatchRequest): Promise<KundaliMatchResult> => {
    const res = await publicFetch('/api/public/kundali/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: getStoredUiLanguage(),
        ayanamsa: 'LAHIRI',
        houseSystem: 'WHOLE_SIGN',
        includeCharts: body.includeCharts !== false,
        ...body,
        male: {
          timezone: 'Asia/Kathmandu',
          ...body.male,
          birthTime:
            body.male.birthTime && body.male.birthTime.length === 5
              ? `${body.male.birthTime}:00`
              : body.male.birthTime,
        },
        female: {
          timezone: 'Asia/Kathmandu',
          ...body.female,
          birthTime:
            body.female.birthTime && body.female.birthTime.length === 5
              ? `${body.female.birthTime}:00`
              : body.female.birthTime,
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<KundaliMatchResult> & {
      result?: KundaliMatchResult;
    };
    if (!res.ok) throw new Error(formatApiError(json, res.status));
    const match = json.data ?? json.result;
    if (!match) throw new Error('Empty kundali match response');
    return match;
  },

  transits: async (body: TransitGenerateRequest = {}): Promise<TransitSnapshot> => {
    const res = await publicFetch('/api/public/kundali/transits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: getStoredUiLanguage(),
        ayanamsa: 'LAHIRI',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kathmandu',
        latitude: 27.7172,
        longitude: 85.324,
        placeName: 'Kathmandu',
        daysAhead: 120,
        ...body,
        time:
          body.time && body.time.length === 5 ? `${body.time}:00` : body.time,
        natalBirthTime:
          body.natalBirthTime && body.natalBirthTime.length === 5
            ? `${body.natalBirthTime}:00`
            : body.natalBirthTime,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<TransitSnapshot> & {
      result?: TransitSnapshot;
    };
    if (!res.ok) throw new Error(formatApiError(json, res.status));
    const snapshot = json.data ?? json.result;
    if (!snapshot) throw new Error('Empty transit response');
    return snapshot;
  },
};
