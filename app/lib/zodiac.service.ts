/**
 * Public zodiac compatibility (sun-sign, no DOB).
 */

import type { GlobalResponse } from '@/app/lib/master.types';
import type { ZodiacSignEnum } from '@/app/lib/crm.types';
import type { ZodiacCompatibilityResult } from '@/app/lib/zodiac-sun-sign';
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

export const zodiacApi = {
  getCompatibility: async (
    signA: ZodiacSignEnum,
    signB: ZodiacSignEnum
  ): Promise<ZodiacCompatibilityResult | null> => {
    const qs = new URLSearchParams({ signA, signB }).toString();
    const res = await publicFetch(`/api/public/zodiac-compatibility?${qs}`, { method: 'GET' });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<ZodiacCompatibilityResult> & {
      result?: ZodiacCompatibilityResult;
    };
    if (!res.ok) return null;
    return json.data ?? json.result ?? null;
  },
};
