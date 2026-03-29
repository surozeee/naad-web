/**
 * CRM service – CRUD for Music, Music Type, Puja, Horoscope Scope, Zodiac Sign, Event, Event Category, Category, Item, Event Image.
 * CRM entities call /api/crm/* (backend /api/v2/crm/*). Event and Event Category call /api/event/* (backend /api/v2/event/*).
 * Music and Music Type call /api/bucket/* (backend /api/v2/bucket/*).
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type { StatusEnum, GlobalResponse, PaginationResponse } from '@/app/lib/master.types';
import type {
  CrmListRequest,
  HoroscopeScopeRequest,
  HoroscopeScopeListRequest,
  HoroscopeScopeLocaleResponse,
  HoroscopeScopeLocaleUpsertPayload,
  ZodiacSignLocaleResponse,
  ZodiacSignLocaleUpsertPayload,
  ZodiacSignRequest,
  ZodiacSignListRequest,
  ZodiacSignResponse,
  MusicTypeRequest,
  MusicTypeListRequest,
  MusicRequest,
  MusicListRequest,
  PujaRequest,
  PujaListRequest,
  EventCategoryRequest,
  EventCategoryListRequest,
  CategoryRequest,
  CategoryListRequest,
  ItemRequest,
  ItemListRequest,
  EventRequest,
  EventListRequest,
  EventImageRequest,
  EventImageListRequest,
  HoroscopeRequest,
  HoroscopeListRequest,
  HoroscopeResponse,
  HoroscopePeriodRequest,
  HoroscopePeriodListRequest,
  HoroscopePeriodResponse,
  HoroscopeCsvImportResult,
} from '@/app/lib/crm.types';

const BASE = '/api/crm';
const EVENT_BASE = '/api/event';
const BUCKET_BASE = '/api/bucket';

async function request<T>(
  method: string,
  path: string,
  options: { body?: object; headers?: Record<string, string>; base?: string } = {}
): Promise<GlobalResponse<T>> {
  const base = options.base ?? BASE;
  delete (options as Record<string, unknown>).base;
  const url = `${base}/${path.replace(/^\//, '')}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const res = await fetchWithAuth(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  });
  const json = (await res.json().catch(() => ({}))) as GlobalResponse<T>;
  if (!res.ok) {
    throw new Error(json.message || json.code || `HTTP ${res.status}`);
  }
  return json;
}

function crud<T, TCreate, TUpdate = TCreate, TListReq extends CrmListRequest = CrmListRequest>(
  entityPath: string,
  baseUrl: string = BASE
) {
  const opts = (extra?: { headers?: Record<string, string>; body?: object }) => ({ ...extra, base: baseUrl });
  return {
    create: (body: TCreate) =>
      request<void>('POST', `${entityPath}/create`, { body: body as object, ...opts() }),

    update: (id: string, body: TUpdate) =>
      request<void>('PUT', `${entityPath}/update`, {
        body: body as object,
        headers: { id },
        ...opts(),
      }),

    changeStatus: (id: string, status: StatusEnum) =>
      request<void>('PATCH', `${entityPath}/change-status`, {
        headers: { id, status },
        ...opts(),
      }),

    getById: (id: string) =>
      request<T>('GET', `${entityPath}/get-by-id`, { headers: { id }, ...opts() }),

    list: async (
      body: TListReq
    ): Promise<
      GlobalResponse<PaginationResponse<T>> & {
        content: T[];
        result: T[];
        totalElements: number;
        data?: PaginationResponse<T>;
      }
    > => {
      const response = await request<PaginationResponse<T>>(
        'POST',
        `${entityPath}/list`,
        { body: body as object, ...opts() }
      );
      const payload = response.data ?? (response as unknown as { result?: T[]; totalElements?: number });
      const items = payload?.result ?? (payload as { content?: T[] })?.content ?? [];
      return {
        ...response,
        data: payload,
        content: items,
        result: items,
        totalElements: payload?.totalElements ?? 0,
      };
    },

    listActive: async (): Promise<{ data?: T[] }> => {
      const r = await request<T[] | { data?: T[] }>('GET', `${entityPath}/list-active`, opts());
      const data = Array.isArray(r) ? r : (r as { data?: T[] }).data;
      return { data: data ?? [] };
    },

    delete: (id: string) =>
      request<void>('DELETE', `${entityPath}/delete`, { headers: { id }, ...opts() }),
  };
}

/** Event-Service: /api/v2/event/horoscope-scope/* and /api/v2/event/zodiac-sign/* */
export const horoscopeScopeApi = crud<unknown, HoroscopeScopeRequest, HoroscopeScopeRequest, HoroscopeScopeListRequest>('horoscope-scope', EVENT_BASE);

const LOCALE_PATH = 'horoscope-scope-locale';

function unwrapList<T>(r: GlobalResponse<T[] | undefined>): T[] {
  const d = r.data;
  if (Array.isArray(d)) return d;
  const alt = (r as unknown as { result?: T[] }).result;
  return Array.isArray(alt) ? alt : [];
}

/** Event-Service: /api/v2/event/horoscope-scope-locale/* (separate from scope update body). */
export const horoscopeScopeLocaleApi = {
  getByScopeId: async (horoscopeScopeId: string): Promise<HoroscopeScopeLocaleResponse[]> => {
    const r = await request<HoroscopeScopeLocaleResponse[]>('POST', `${LOCALE_PATH}/get-by-scope-id`, {
      body: { horoscopeScopeId },
      base: EVENT_BASE,
    });
    return unwrapList(r);
  },
  create: async (body: HoroscopeScopeLocaleUpsertPayload): Promise<HoroscopeScopeLocaleResponse | undefined> => {
    const r = await request<HoroscopeScopeLocaleResponse>('POST', `${LOCALE_PATH}/create`, {
      body: body as object,
      base: EVENT_BASE,
    });
    return r.data ?? undefined;
  },
  update: async (id: string, body: HoroscopeScopeLocaleUpsertPayload): Promise<HoroscopeScopeLocaleResponse | undefined> => {
    const r = await request<HoroscopeScopeLocaleResponse>('PUT', `${LOCALE_PATH}/update`, {
      body: body as object,
      headers: { id },
      base: EVENT_BASE,
    });
    return r.data ?? undefined;
  },
  delete: (id: string) =>
    request<void>('DELETE', `${LOCALE_PATH}/delete`, { headers: { id }, base: EVENT_BASE }),
};
export const zodiacSignApi = crud<
  ZodiacSignResponse,
  ZodiacSignRequest,
  ZodiacSignRequest,
  ZodiacSignListRequest
>('zodiac-sign', EVENT_BASE);

const ZODIAC_LOCALE_PATH = 'zodiac-sign-locale';

/** Event-Service: /api/v2/event/zodiac-sign-locale/* */
export const zodiacSignLocaleApi = {
  getByZodiacSignId: async (zodiacSignId: string): Promise<ZodiacSignLocaleResponse[]> => {
    const r = await request<ZodiacSignLocaleResponse[]>('POST', `${ZODIAC_LOCALE_PATH}/get-by-zodiac-sign-id`, {
      body: { zodiacSignId },
      base: EVENT_BASE,
    });
    return unwrapList(r);
  },
  create: async (body: ZodiacSignLocaleUpsertPayload): Promise<ZodiacSignLocaleResponse | undefined> => {
    const r = await request<ZodiacSignLocaleResponse>('POST', `${ZODIAC_LOCALE_PATH}/create`, {
      body: body as object,
      base: EVENT_BASE,
    });
    return r.data ?? undefined;
  },
  update: async (id: string, body: ZodiacSignLocaleUpsertPayload): Promise<ZodiacSignLocaleResponse | undefined> => {
    const r = await request<ZodiacSignLocaleResponse>('PUT', `${ZODIAC_LOCALE_PATH}/update`, {
      body: body as object,
      headers: { id },
      base: EVENT_BASE,
    });
    return r.data ?? undefined;
  },
  delete: (id: string) =>
    request<void>('DELETE', `${ZODIAC_LOCALE_PATH}/delete`, { headers: { id }, base: EVENT_BASE }),
};
const horoscopeCrud = crud<HoroscopeResponse, HoroscopeRequest, HoroscopeRequest, HoroscopeListRequest>('horoscope', EVENT_BASE);

export const horoscopeApi = {
  ...horoscopeCrud,
  /**
   * Server-side CSV import (multipart). Requires Event-Service endpoint POST /horoscope/import-csv.
   * Until implemented, the UI falls back to client-side CSV → drafts → “Sync drafts to server”.
   */
  importCsv: async (file: File): Promise<HoroscopeCsvImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetchWithAuth(`${EVENT_BASE}/horoscope/import-csv`, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });
    const json = (await res.json().catch(() => ({}))) as GlobalResponse<HoroscopeCsvImportResult>;
    if (!res.ok) throw new Error(json.message ?? json.code ?? `HTTP ${res.status}`);
    const data = json.data ?? (json as unknown as HoroscopeCsvImportResult);
    return typeof data === 'object' && data !== null ? data : {};
  },
};
export const horoscopePeriodApi = crud<HoroscopePeriodResponse, HoroscopePeriodRequest, HoroscopePeriodRequest, HoroscopePeriodListRequest>('horoscope-period', EVENT_BASE);
/** Music type enum item from GET /music-type/enum */
export interface MusicTypeEnumItem {
  name: string;
  value: string;
}

/** Bucket-Service: /api/v2/bucket/music-type/* and /api/v2/bucket/music/* */
export const musicTypeApi = {
  ...crud<unknown, MusicTypeRequest, MusicTypeRequest, MusicTypeListRequest>('music-type', BUCKET_BASE),
  /** List music type enum values (name + value) from backend */
  listEnum: async (): Promise<MusicTypeEnumItem[]> => {
    const r = await request<MusicTypeEnumItem[]>('GET', 'music-type/enum', { base: BUCKET_BASE });
    const list = (r as { data?: MusicTypeEnumItem[] }).data ?? (r as { result?: MusicTypeEnumItem[] }).result;
    return Array.isArray(list) ? list : [];
  },
};

async function musicUploadRequest(formData: FormData): Promise<GlobalResponse<unknown>> {
  const res = await fetchWithAuth('/api/bucket/music/upload', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
  });
  const json = (await res.json().catch(() => ({}))) as GlobalResponse<unknown>;
  if (!res.ok) throw new Error(json.message ?? json.code ?? `HTTP ${res.status}`);
  return json;
}

async function musicUpdateWithFileRequest(id: string, formData: FormData): Promise<GlobalResponse<unknown>> {
  const name = (formData.get('name') as string) || undefined;
  const description = (formData.get('description') as string) || undefined;
  const musicTypeId = (formData.get('musicTypeId') as string) || undefined;
  const durationSeconds = formData.get('durationSeconds');
  const params = new URLSearchParams();
  if (name != null && name !== '') params.set('name', name);
  if (description != null && description !== '') params.set('description', description);
  if (musicTypeId != null && musicTypeId !== '') params.set('musicTypeId', musicTypeId);
  if (durationSeconds != null && durationSeconds !== '') params.set('durationSeconds', String(durationSeconds));
  const query = params.toString();
  const url = `/api/bucket/music/update${query ? `?${query}` : ''}`;
  const body = new FormData();
  const file = formData.get('file');
  if (file instanceof File && file.size > 0) body.append('file', file);
  const res = await fetchWithAuth(url, {
    method: 'PUT',
    headers: { id },
    body,
    credentials: 'same-origin',
  });
  const json = (await res.json().catch(() => ({}))) as GlobalResponse<unknown>;
  if (!res.ok) throw new Error(json.message ?? json.code ?? `HTTP ${res.status}`);
  return json;
}

export const musicApi = {
  ...crud<unknown, MusicRequest, MusicRequest, MusicListRequest>('music', BUCKET_BASE),
  /** Multipart file upload: formData must include 'file' (File) and 'name' (string); optional: description, musicTypeId */
  upload: musicUploadRequest,
  /** Multipart update: formData can include optional 'file' (File), and optional name, description, musicTypeId */
  updateWithFile: musicUpdateWithFileRequest,
};
export const pujaApi = crud<unknown, PujaRequest, PujaRequest, PujaListRequest>('puja');
export const eventCategoryApi = crud<unknown, EventCategoryRequest, EventCategoryRequest, EventCategoryListRequest>('event-category', EVENT_BASE);
export const categoryApi = crud<unknown, CategoryRequest, CategoryRequest, CategoryListRequest>('category');
export const itemApi = crud<unknown, ItemRequest, ItemRequest, ItemListRequest>('item');
/** Event controller uses /api/v2/event + /create, /update, etc. (no extra /event segment). */
export const eventApi = crud<unknown, EventRequest, EventRequest, EventListRequest>('', EVENT_BASE);
export const eventImageApi = crud<unknown, EventImageRequest, EventImageRequest, EventImageListRequest>('event-image');
