/**
 * CRM service – CRUD for Music, Music Type, Puja, Horoscope Scope, Zodiac Sign, Event, Event Category, Category, Item, Event Image.
 * Calls /api/crm/* (proxy to backend /api/v2/crm/*).
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

async function request<T>(
  method: string,
  path: string,
  options: { body?: object; headers?: Record<string, string> } = {}
): Promise<GlobalResponse<T>> {
  const url = `${BASE}/${path.replace(/^\//, '')}`;
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
  entityPath: string
) {
  return {
    create: (body: TCreate) =>
      request<void>('POST', `${entityPath}/create`, { body: body as object }),

    update: (id: string, body: TUpdate) =>
      request<void>('PUT', `${entityPath}/update`, {
        body: body as object,
        headers: { id },
      }),

    changeStatus: (id: string, status: StatusEnum) =>
      request<void>('PATCH', `${entityPath}/change-status`, {
        headers: { id, status },
      }),

    getById: (id: string) =>
      request<T>('GET', `${entityPath}/get-by-id`, { headers: { id } }),

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
        { body: body as object }
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
      const r = await request<T[] | { data?: T[] }>('GET', `${entityPath}/list-active`);
      const data = Array.isArray(r) ? r : (r as { data?: T[] }).data;
      return { data: data ?? [] };
    },

    delete: (id: string) =>
      request<void>('DELETE', `${entityPath}/delete`, { headers: { id } }),
  };
}

export const horoscopeScopeApi = crud<unknown, HoroscopeScopeRequest, HoroscopeScopeRequest, HoroscopeScopeListRequest>('horoscope-scope');
export const zodiacSignApi = crud<unknown, ZodiacSignRequest, ZodiacSignRequest, ZodiacSignListRequest>('zodiac-sign');
export const musicTypeApi = crud<unknown, MusicTypeRequest, MusicTypeRequest, MusicTypeListRequest>('music-type');
export const musicApi = crud<unknown, MusicRequest, MusicRequest, MusicListRequest>('music');
export const pujaApi = crud<unknown, PujaRequest, PujaRequest, PujaListRequest>('puja');
export const eventCategoryApi = crud<unknown, EventCategoryRequest, EventCategoryRequest, EventCategoryListRequest>('event-category');
export const categoryApi = crud<unknown, CategoryRequest, CategoryRequest, CategoryListRequest>('category');
export const itemApi = crud<unknown, ItemRequest, ItemRequest, ItemListRequest>('item');
export const eventApi = crud<unknown, EventRequest, EventRequest, EventListRequest>('event');
export const eventImageApi = crud<unknown, EventImageRequest, EventImageRequest, EventImageListRequest>('event-image');
