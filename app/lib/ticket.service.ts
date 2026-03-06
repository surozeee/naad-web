/**
 * Support API – Ticket, FAQ, FAQ Category. Calls /api/support/* (proxy to /api/v2/support/*).
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type {
  TicketRequest,
  TicketResponse,
  FaqCategoryRequest,
  FaqCategoryResponse,
  FaqRequest,
  FaqResponse,
  PaginationRequest,
  SupportPaginationResponse,
} from '@/app/lib/ticket.types';

interface GlobalResponse<T> {
  data?: T;
  message?: string;
  code?: string;
}

const BASE = '/api/support';

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

export const ticketService = {
  create: (body: TicketRequest) => request<TicketResponse>('POST', 'ticket/create', { body: body as object }),
  update: (id: string, body: TicketRequest) =>
    request<TicketResponse>('PUT', 'ticket/update', { body: body as object, headers: { id } }),
  getById: (id: string) => request<TicketResponse>('GET', 'ticket/get-by-id', { headers: { id } }),
  getByCaseId: (caseId: string) =>
    request<TicketResponse>('GET', 'ticket/get-by-case-id', { headers: { caseId } }),
  list: (params?: PaginationRequest) =>
    request<SupportPaginationResponse<TicketResponse>>('POST', 'ticket/list-paginate', {
      body: {
        pageNo: params?.pageNo ?? 0,
        pageSize: params?.pageSize ?? 10,
        sortBy: params?.sortBy ?? 'createdAt',
        sortDirection: params?.sortDirection ?? 'desc',
      } as object,
    }),
  listActive: () => request<TicketResponse[]>('GET', 'ticket/list-active'),
  getByStatus: (status: string) =>
    request<TicketResponse[]>('GET', 'ticket/get-by-status', { headers: { status } }),
  getByAssignedTo: (assignedTo: string) =>
    request<TicketResponse[]>('GET', 'ticket/get-by-assigned-to', { headers: { assignedTo } }),
  delete: (id: string) => request<void>('DELETE', 'ticket/delete', { headers: { id } }),
};

export const faqCategoryService = {
  create: (body: FaqCategoryRequest) =>
    request<FaqCategoryResponse>('POST', 'faq-category/create', { body: body as object }),
  update: (id: string, body: FaqCategoryRequest) =>
    request<FaqCategoryResponse>('PUT', 'faq-category/update', {
      body: body as object,
      headers: { id },
    }),
  getById: (id: string) =>
    request<FaqCategoryResponse>('GET', 'faq-category/get-by-id', { headers: { id } }),
  getBySlug: (slug: string) =>
    request<FaqCategoryResponse>('GET', 'faq-category/get-by-slug', { headers: { slug } }),
  list: (params?: PaginationRequest) =>
    request<SupportPaginationResponse<FaqCategoryResponse>>('POST', 'faq-category/list-paginate', {
      body: {
        pageNo: params?.pageNo ?? 0,
        pageSize: params?.pageSize ?? 100,
        sortBy: params?.sortBy ?? 'displayOrder',
        sortDirection: params?.sortDirection ?? 'asc',
      } as object,
    }),
  listActive: () => request<FaqCategoryResponse[]>('GET', 'faq-category/list-active'),
  getRootCategories: () => request<FaqCategoryResponse[]>('GET', 'faq-category/get-root-categories'),
  getByParentId: (parentId: string) =>
    request<FaqCategoryResponse[]>('GET', 'faq-category/get-by-parent-id', { headers: { parentId } }),
  delete: (id: string) => request<void>('DELETE', 'faq-category/delete', { headers: { id } }),
};

export const faqService = {
  create: (body: FaqRequest) => request<FaqResponse>('POST', 'faq/create', { body: body as object }),
  update: (id: string, body: FaqRequest) =>
    request<FaqResponse>('PUT', 'faq/update', { body: body as object, headers: { id } }),
  getById: (id: string) => request<FaqResponse>('GET', 'faq/get-by-id', { headers: { id } }),
  list: (params?: PaginationRequest) =>
    request<SupportPaginationResponse<FaqResponse>>('POST', 'faq/list-paginate', {
      body: {
        pageNo: params?.pageNo ?? 0,
        pageSize: params?.pageSize ?? 10,
        sortBy: params?.sortBy ?? 'displayOrder',
        sortDirection: params?.sortDirection ?? 'asc',
      } as object,
    }),
  listActive: () => request<FaqResponse[]>('GET', 'faq/list-active'),
  getByType: (faqType: string) =>
    request<FaqResponse[]>('GET', 'faq/get-by-type', { headers: { faqType } }),
  getPublished: () => request<FaqResponse[]>('GET', 'faq/get-published'),
  delete: (id: string) => request<void>('DELETE', 'faq/delete', { headers: { id } }),
};
