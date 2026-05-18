import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type {
  AstrologerMeetingCreateRequest,
  GlobalMeetingResponse,
  MeetingResponse,
} from '@/app/lib/meeting-api.types';

async function apiRequest<T>(method: string, path: string, options: { body?: object } = {}): Promise<T> {
  const res = await fetchWithAuth(path.startsWith('/') ? path : `/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as GlobalMeetingResponse<T>;
  if (!res.ok) {
    throw new Error(json.message || json.code || `HTTP ${res.status}`);
  }
  return json.data as T;
}

export const meetingApi = {
  create: (body: AstrologerMeetingCreateRequest) =>
    apiRequest<MeetingResponse>('POST', '/api/meetings/create', { body }),

  listMine: async () => {
    const data = await apiRequest<MeetingResponse[] | { result?: MeetingResponse[] }>('GET', '/api/meetings/my');
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as { result?: MeetingResponse[] }).result)) {
      return (data as { result: MeetingResponse[] }).result;
    }
    return [];
  },

  getById: (id: string) => apiRequest<MeetingResponse>('GET', `/api/meetings/${encodeURIComponent(id)}`),
};
