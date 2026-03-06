/**
 * Communication service – Message, Support Email, Bulk Send.
 * Calls /api/communication/* (proxy to backend /api/v2/communication/*).
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type {
  MessageResponse,
  MessageRequest,
  MessageDataRequest,
  MessageDetailRequest,
  MessageStatusEnum,
  SupportEmailRequest,
  SupportEmailDataRequest,
  SupportEmailReplyRequest,
  SupportEmailResponse,
  BulkSendRequest,
  BulkSendResultResponse,
  DatapaginationResponse,
} from '@/app/lib/communication.types';

interface GlobalResponse<T> {
  data?: T;
  message?: string;
  code?: string;
}

const BASE = '/api/communication';

async function request<T>(
  method: string,
  path: string,
  options: { body?: object; headers?: Record<string, string>; skipAuth?: boolean } = {}
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

export const messageService = {
  create: (body: MessageRequest) => request<void>('POST', 'message/create', { body: body as object }),
  update: (id: string, body: MessageRequest) =>
    request<void>('PUT', 'message/update', { body: body as object, headers: { id } }),
  getById: (id: string) => request<MessageResponse>('GET', 'message/detail', { headers: { id } }),
  list: (body: MessageDataRequest) =>
    request<DatapaginationResponse<MessageResponse>>('POST', 'message/list', { body: body as object }),
  delete: (id: string) => request<void>('DELETE', 'message/delete', { headers: { id } }),
  changeStatus: (id: string, status: MessageStatusEnum) =>
    request<void>('PUT', 'message/change-status', { headers: { id, status } }),
  updateDetail: (detailId: string, body: MessageDetailRequest) =>
    request<void>('PUT', 'message-detail/update', { body: body as object, headers: { id: detailId } }),
  createDetail: (messageId: string, body: MessageDetailRequest) =>
    request<void>('POST', 'message-detail/create', { body: body as object, headers: { messageId } }),
};

export const supportEmailService = {
  create: (body: SupportEmailRequest) =>
    request<SupportEmailResponse>('POST', 'support-email/create', { body: body as object }),
  list: (body: SupportEmailDataRequest) =>
    request<DatapaginationResponse<SupportEmailResponse>>('POST', 'support-email/list', { body: body as object }),
  getById: (id: string) => request<SupportEmailResponse>('GET', 'support-email/detail', { headers: { id } }),
  addReply: (supportEmailId: string, body: SupportEmailReplyRequest) =>
    request<void>('POST', 'support-email/reply', { body: body as object, headers: { supportEmailId } }),
};

export const bulkSendService = {
  send: (body: BulkSendRequest) =>
    request<BulkSendResultResponse>('POST', 'bulk/send', { body: body as object }),
};
