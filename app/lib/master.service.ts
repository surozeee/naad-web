/**
 * Master service – CRUD for country, state, district, region, currency, local-unit, local-unit-type.
 * Calls Next.js API routes /api/master/* which proxy to backend /api/v2/master/*.
 * Uses fetchWithAuth: on 401, refresh token is tried once; if refresh fails, tokens are cleared and redirect to homepage.
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type {
  GlobalResponse,
  PaginationResponse,
  StatusEnum,
  MasterListRequest,
  CountryRequest,
  CountryListRequest,
  RegionListRequest,
  StateRequest,
  StateListRequest,
  DistrictRequest,
  DistrictListRequest,
  CurrencyRequest,
  CurrencyListRequest,
  LocalUnitRequest,
  LocalUnitListRequest,
  LocalUnitTypeRequest,
  LocalUnitTypeListRequest,
  LanguageRequest,
  LanguageListRequest,
  NepaliCalendarRequest,
  NepaliCalendarListRequest,
  NepaliCalendarResponse,
} from '@/app/lib/master.types';

const BASE = '/api/master';

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

function crud<T, TCreate, TUpdate = TCreate, TListReq extends MasterListRequest = MasterListRequest>(
  entityPath: string
) {
  const listPath = entityPath.replace(/\/$/, '');
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

export const countryApi = crud<unknown, CountryRequest, CountryRequest, CountryListRequest>('country');
export const regionApi = crud<unknown, { name: string; code?: string }, unknown, RegionListRequest>('region');
export const currencyApi = crud<unknown, CurrencyRequest, CurrencyRequest, CurrencyListRequest>('currency');
export const stateApi = crud<unknown, StateRequest, StateRequest, StateListRequest>('state');
export const districtApi = crud<unknown, DistrictRequest, DistrictRequest, DistrictListRequest>('district');
export const localUnitApi = crud<unknown, LocalUnitRequest, LocalUnitRequest, LocalUnitListRequest>('local-unit');
export const localUnitTypeApi = crud<unknown, LocalUnitTypeRequest, LocalUnitTypeRequest, LocalUnitTypeListRequest>('local-unit-type');
export const languageApi = crud<unknown, LanguageRequest, LanguageRequest, LanguageListRequest>('language');
export const nepaliCalendarApi = crud<NepaliCalendarResponse, NepaliCalendarRequest, NepaliCalendarRequest, NepaliCalendarListRequest>('nepali-calendar');

export const masterService = {
  country: countryApi,
  region: regionApi,
  currency: currencyApi,
  state: stateApi,
  district: districtApi,
  localUnit: localUnitApi,
  localUnitType: localUnitTypeApi,
  language: languageApi,
  nepaliCalendar: nepaliCalendarApi,
};

export default masterService;
