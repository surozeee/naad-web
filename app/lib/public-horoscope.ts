/**
 * Public (unauthenticated) horoscope read helpers.
 * Uses /api/public/* BFF routes — no NextAuth session required.
 */

import type { GlobalResponse, PaginationResponse, NepaliCalendarResponse, ColorResponse } from '@/app/lib/master.types';
import type {
  HoroscopeListRequest,
  HoroscopeResponse,
  ZodiacSignResponse,
} from '@/app/lib/crm.types';
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

function unwrapArray<T>(json: GlobalResponse<T[]> & { result?: T[] }): T[] {
  const raw =
    (Array.isArray(json.data) ? json.data : null) ??
    (Array.isArray(json.result) ? json.result : null) ??
    (Array.isArray(json) ? (json as unknown as T[]) : null);
  return raw ?? [];
}

export const publicHoroscopeApi = {
  list: async (
    body: Partial<HoroscopeListRequest> = {}
  ): Promise<{
    content: HoroscopeResponse[];
    result: HoroscopeResponse[];
    totalElements: number;
  }> => {
    const res = await publicFetch('/api/public/horoscope/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageNo: 0,
        pageSize: 50,
        sortBy: 'zodiacSign',
        sortDirection: 'asc',
        ...body,
        publishStatus: 'PUBLISHED',
        status: 'ACTIVE',
      }),
    });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<PaginationResponse<HoroscopeResponse>> & {
      result?: HoroscopeResponse[];
      content?: HoroscopeResponse[];
      totalElements?: number;
    };
    if (!res.ok) throw new Error(formatApiError(json, res.status));
    const payload = json.data ?? json;
    const items =
      (payload as PaginationResponse<HoroscopeResponse>)?.result ??
      (payload as { content?: HoroscopeResponse[] })?.content ??
      json.result ??
      json.content ??
      [];
    return {
      content: items,
      result: items,
      totalElements:
        (payload as PaginationResponse<HoroscopeResponse>)?.totalElements ?? json.totalElements ?? items.length,
    };
  },
};

export const publicZodiacSignApi = {
  listActive: async (): Promise<{ data?: ZodiacSignResponse[] }> => {
    const res = await publicFetch('/api/public/zodiac-sign/list-active', { method: 'GET' });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<ZodiacSignResponse[]> & {
      result?: ZodiacSignResponse[];
    };
    if (!res.ok) return { data: [] };
    return { data: unwrapArray(json) };
  },
};

export const publicColorApi = {
  listActive: async (): Promise<{ data?: ColorResponse[] }> => {
    const res = await publicFetch('/api/public/color/list-active', { method: 'GET' });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<ColorResponse[]> & {
      result?: ColorResponse[];
    };
    if (!res.ok) return { data: [] };
    return { data: unwrapArray(json) };
  },
};

export const publicNepaliCalendarApi = {
  listActive: async (): Promise<{ data?: NepaliCalendarResponse[] }> => {
    const res = await publicFetch('/api/public/nepali-calendar/list-active', { method: 'GET' });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<NepaliCalendarResponse[]> & {
      result?: NepaliCalendarResponse[];
    };
    if (!res.ok) return { data: [] };
    return { data: unwrapArray(json) };
  },
};
