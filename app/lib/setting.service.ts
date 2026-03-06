/**
 * Setting service – Setting, SettingCategory, SettingDetail.
 * Calls Next.js API routes /api/communication/* which proxy to backend /api/v2/communication/*.
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type {
  SettingResponse,
  SettingListRequest,
  SettingCategoryResponse,
  SettingCategoryListRequest,
  SettingDetailResponse,
  SettingDetailListRequest,
  SettingDetailBulkUpdateRequest,
  DatapaginationResponse,
} from '@/app/lib/setting.types';

interface GlobalResponse<T> {
  data?: T;
  message?: string;
  code?: string;
}

const BASE = '/api/communication';

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

export const settingService = {
  list: (body: SettingListRequest) =>
    request<DatapaginationResponse<SettingResponse>>('POST', 'setting/list', { body: body as object }),
  getById: (id: string) =>
    request<SettingResponse>('GET', 'setting/get-by-id', { headers: { id } }),
};

export const settingCategoryService = {
  list: (body: SettingCategoryListRequest) =>
    request<DatapaginationResponse<SettingCategoryResponse>>('POST', 'setting-category/list', {
      body: body as object,
    }),
  getById: (id: string) =>
    request<SettingCategoryResponse>('GET', 'setting-category/get-by-id', { headers: { id } }),
};

export const settingDetailService = {
  list: (body: SettingDetailListRequest) =>
    request<DatapaginationResponse<SettingDetailResponse>>('POST', 'setting-detail/list', {
      body: body as object,
    }),
  getById: (id: string) =>
    request<SettingDetailResponse>('GET', 'setting-detail/get-by-id', { headers: { id } }),
  bulkUpdate: (body: SettingDetailBulkUpdateRequest) =>
    request<void>('PUT', 'setting-detail/bulk-update', { body: body as object }),
};
