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
  ZodiacSignRequest,
  ZodiacSignListRequest,
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
export const zodiacSignApi = crud<unknown, ZodiacSignRequest, ZodiacSignRequest, ZodiacSignListRequest>('zodiac-sign', EVENT_BASE);
/** Bucket-Service: /api/v2/bucket/music-type/* and /api/v2/bucket/music/* */
export const musicTypeApi = crud<unknown, MusicTypeRequest, MusicTypeRequest, MusicTypeListRequest>('music-type', BUCKET_BASE);

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

export const musicApi = {
  ...crud<unknown, MusicRequest, MusicRequest, MusicListRequest>('music', BUCKET_BASE),
  /** Multipart file upload: formData must include 'file' (File) and 'name' (string); optional: description, musicTypeId, durationSeconds */
  upload: musicUploadRequest,
};
export const pujaApi = crud<unknown, PujaRequest, PujaRequest, PujaListRequest>('puja');
export const eventCategoryApi = crud<unknown, EventCategoryRequest, EventCategoryRequest, EventCategoryListRequest>('event-category', EVENT_BASE);
export const categoryApi = crud<unknown, CategoryRequest, CategoryRequest, CategoryListRequest>('category');
export const itemApi = crud<unknown, ItemRequest, ItemRequest, ItemListRequest>('item');
/** Event controller uses /api/v2/event + /create, /update, etc. (no extra /event segment). */
export const eventApi = crud<unknown, EventRequest, EventRequest, EventListRequest>('', EVENT_BASE);
export const eventImageApi = crud<unknown, EventImageRequest, EventImageRequest, EventImageListRequest>('event-image');
