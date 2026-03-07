/**
 * Customer API client – list customers.
 * Calls Next.js API route /api/customers (proxy to backend when available).
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type { CustomerResponse, CustomerCreateRequest, PaginationRequest } from '@/app/lib/customer-api.types';

interface GlobalResponse<T = unknown> {
  data?: T;
  message?: string;
  status?: string;
  code?: string;
}

function listBody(params?: PaginationRequest): Record<string, unknown> {
  if (!params) return {};
  const body: Record<string, unknown> = {
    pageNo: params.pageNo ?? 0,
    pageSize: params.pageSize ?? 1000,
  };
  if (params.sortBy != null) body.sortBy = params.sortBy;
  if (params.sortDirection != null) body.sortDirection = params.sortDirection;
  if (params.search != null && String(params.search).trim() !== '') body.search = String(params.search).trim();
  return body;
}

function normalizeList(res: GlobalResponse<unknown>): CustomerResponse[] {
  const d = res?.data;
  if (d != null && typeof d === 'object') {
    const obj = d as Record<string, unknown>;
    if (Array.isArray(obj.result)) return obj.result as CustomerResponse[];
    if (Array.isArray(obj.content)) return obj.content as CustomerResponse[];
  }
  if (Array.isArray(d)) return d as CustomerResponse[];
  return [];
}

async function apiRequest<T>(method: string, path: string, options: { body?: object } = {}): Promise<GlobalResponse<T>> {
  const url = path.startsWith('/') ? path : `/api/${path}`;
  const res = await fetchWithAuth(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as GlobalResponse<T>;
  if (!res.ok) {
    throw new Error(json.message || json.code || `HTTP ${res.status}`);
  }
  return json;
}

export const customerApi = {
  list: (params?: PaginationRequest) =>
    apiRequest<unknown>('POST', 'customers', { body: listBody(params) }).then((r) => normalizeList(r)),
  create: (body: CustomerCreateRequest) =>
    apiRequest<unknown>('POST', 'customers/create', { body: body as object }),
};
