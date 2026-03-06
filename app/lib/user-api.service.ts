/**
 * User-Service API client – CRUD for Menu, Permission, PermissionGroup, Role, User
 * Calls Next.js API routes (/api/users, /api/roles, etc.) which proxy to backend.
 */

import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type {
  GlobalResponse,
  PaginationRequest,
  PaginationResponse,
  StatusEnum,
  MenuRequest,
  MenuResponse,
  MenuLocaleRequest,
  MenuLocaleResponse,
  PermissionRequest,
  PermissionResponse,
  PermissionGroupRequest,
  PermissionGroupResponse,
  PermissionGroupTreeResponse,
  RoleRequest,
  RoleResponse,
  UserRequest,
  UserResponse,
} from '@/app/lib/user-api.types';

function toArray<T>(data: PaginationResponse<T> | T[] | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.result ?? []);
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

async function apiRequest<T>(
  method: string,
  path: string,
  options: { body?: object; headers?: Record<string, string> } = {}
): Promise<GlobalResponse<T>> {
  const url = path.startsWith('/') ? path : `/api/${path}`;
  const res = await fetchWithAuth(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as GlobalResponse<T>;
  if (!res.ok) {
    throw new Error(json.message || json.code || `HTTP ${res.status}`);
  }
  return json;
}

/** Normalize list response: backend may return data.result, data.content, or data as array */
function normalizeList<T>(res: GlobalResponse<unknown>): T[] {
  const d = res?.data;
  if (d != null && typeof d === 'object') {
    const obj = d as Record<string, unknown>;
    if (Array.isArray(obj.result)) return obj.result as T[];
    if (Array.isArray(obj.content)) return obj.content as T[];
  }
  if (Array.isArray(d)) return d as T[];
  return [];
}

// ---------- User ----------
export const userApi = {
  list: (params?: PaginationRequest) =>
    apiRequest<unknown>('POST', 'users', { body: listBody(params) }).then((r) => normalizeList<UserResponse>(r)),
  getById: (id: string) =>
    apiRequest<UserResponse>('GET', `users/${encodeURIComponent(id)}`).then((r) => r.data as UserResponse),
  create: (body: UserRequest) => apiRequest('POST', 'users/create', { body }),
  update: (id: string, body: UserRequest) => apiRequest('PUT', `users/${encodeURIComponent(id)}`, { body }),
  changeStatus: (id: string, status: StatusEnum) =>
    apiRequest('PATCH', `users/${encodeURIComponent(id)}`, { body: { status } }),
  delete: (id: string) => apiRequest('DELETE', `users/${encodeURIComponent(id)}`),
};

// ---------- Role ----------
export const roleApi = {
  list: (params?: PaginationRequest) =>
    apiRequest<unknown>('POST', 'roles', { body: listBody(params) }).then((r) => normalizeList<RoleResponse>(r)),
  getById: (id: string) =>
    apiRequest<RoleResponse>('GET', `roles/${encodeURIComponent(id)}`).then((r) => r.data as RoleResponse),
  create: (body: RoleRequest) => apiRequest('POST', 'roles/create', { body }),
  update: (id: string, body: RoleRequest) => apiRequest('PUT', `roles/${encodeURIComponent(id)}`, { body }),
  changeStatus: (id: string, status: StatusEnum) =>
    apiRequest('PATCH', `roles/${encodeURIComponent(id)}`, { body: { status } }),
  delete: (id: string) => apiRequest('DELETE', `roles/${encodeURIComponent(id)}`),
};

// ---------- Permission ----------
export const permissionApi = {
  list: (params?: PaginationRequest) =>
    apiRequest<unknown>('POST', 'permissions', { body: listBody(params) }).then((r) => normalizeList<PermissionResponse>(r)),
  getById: (id: string) =>
    apiRequest<PermissionResponse>('GET', `permissions/${encodeURIComponent(id)}`).then((r) => r.data as PermissionResponse),
  listActive: () =>
    apiRequest<PermissionResponse[] | PermissionResponse>('GET', 'permissions/list-active').then((r) => {
      const d = r?.data;
      return Array.isArray(d) ? d : [];
    }),
  listAvailable: (params: { pageNo: number; pageSize: number; search?: string; sortBy?: string; sortDirection?: string }) =>
    apiRequest<{ result?: PermissionResponse[]; totalElements?: number }>('POST', 'permissions/list-available', { body: params }).then((r) => {
      const data = r?.data as { result?: PermissionResponse[]; totalElements?: number } | undefined;
      return {
        result: data?.result ?? [],
        totalElements: data?.totalElements ?? 0,
      };
    }),
  create: (body: PermissionRequest) => apiRequest('POST', 'permissions/create', { body }),
  update: (id: string, body: PermissionRequest) => apiRequest('PUT', `permissions/${encodeURIComponent(id)}`, { body }),
  changeStatus: (id: string, status: StatusEnum) =>
    apiRequest('PATCH', `permissions/${encodeURIComponent(id)}`, { body: { status } }),
  delete: (id: string) => apiRequest('DELETE', `permissions/${encodeURIComponent(id)}`),
};

// ---------- Permission Group ----------
export const permissionGroupApi = {
  list: (params?: PaginationRequest) =>
    apiRequest<unknown>('POST', 'permission-groups', { body: listBody(params) }).then((r) => normalizeList<PermissionGroupResponse>(r)),
  getById: (id: string) =>
    apiRequest<PermissionGroupResponse>('GET', `permission-groups/${encodeURIComponent(id)}`).then((r) => r.data as PermissionGroupResponse),
  getRoot: () =>
    apiRequest<PermissionGroupResponse[]>('GET', 'permission-groups/get-parent').then((r) => (Array.isArray(r?.data) ? r.data : [])),
  getByParentId: (parentId: string) =>
    apiRequest<PermissionGroupResponse[]>('POST', 'permission-groups/get-by-parent-id', { body: { parentId } }).then((r) =>
      Array.isArray(r?.data) ? r.data : []
    ),
  getActiveTree: () =>
    apiRequest<PermissionGroupTreeResponse[]>('GET', 'permission-groups/active-tree').then((r) =>
      (Array.isArray(r?.data) ? r.data : []) as PermissionGroupTreeResponse[]
    ),
  getActiveLastChild: (params?: PaginationRequest) =>
    apiRequest<PermissionGroupResponse[] | PaginationResponse<PermissionGroupResponse>>('POST', 'permission-groups/get-active-last-child', {
      body: listBody(params),
    }).then((r) => toArray(r?.data)),
  create: (body: PermissionGroupRequest) => apiRequest('POST', 'permission-groups/create', { body }),
  update: (id: string, body: PermissionGroupRequest) => apiRequest('PUT', `permission-groups/${encodeURIComponent(id)}`, { body }),
  changeStatus: (id: string, status: StatusEnum) =>
    apiRequest('PATCH', `permission-groups/${encodeURIComponent(id)}`, { body: { status } }),
  delete: (id: string) => apiRequest('DELETE', `permission-groups/${encodeURIComponent(id)}`),
  removePermission: (permissionGroupId: string, permissionId: string) =>
    apiRequest('DELETE', 'permission-groups/remove-permission', {
      headers: { permissionGroupId, permissionId },
    }),
};

// ---------- Menu ----------
export type MenuListPaginateRequest = {
  pageNo: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
};

export const menuApi = {
  list: (params?: PaginationRequest) =>
    apiRequest<unknown>('POST', 'menus', { body: listBody(params) }).then((r) => normalizeList<MenuResponse>(r)),
  listPaginate: (body: MenuListPaginateRequest) =>
    apiRequest<unknown>('POST', 'menus', { body }).then((r) => normalizeList<MenuResponse>(r)),
  getById: (id: string) =>
    apiRequest<MenuResponse>('GET', `menus/${encodeURIComponent(id)}`).then((r) => r.data as MenuResponse),
  create: (body: MenuRequest) => apiRequest('POST', 'menus/create', { body }),
  update: (id: string, body: MenuRequest) => apiRequest('PUT', `menus/${encodeURIComponent(id)}`, { body }),
  changeStatus: (id: string, status: StatusEnum) =>
    apiRequest('PATCH', `menus/${encodeURIComponent(id)}`, { body: { status } }),
  delete: (id: string) => apiRequest('DELETE', `menus/${encodeURIComponent(id)}`),
};

// ---------- Menu Locale ----------
export const menuLocaleApi = {
  getByMenuId: (menuId: string) =>
    apiRequest<MenuLocaleResponse[]>('POST', 'menu-locale/get-by-menu-id', { body: { menuId } }).then((r) =>
      Array.isArray(r?.data) ? r.data : []
    ),
  getById: (id: string) =>
    apiRequest<MenuLocaleResponse>('GET', `menu-locale/${id}`).then((r) => r.data as MenuLocaleResponse),
  create: (body: MenuLocaleRequest) =>
    apiRequest<MenuLocaleResponse>('POST', 'menu-locale/create', { body }).then((r) => r.data as MenuLocaleResponse),
  update: (id: string, body: MenuLocaleRequest) =>
    apiRequest<MenuLocaleResponse>('PUT', `menu-locale/${id}`, { body }).then((r) => r.data as MenuLocaleResponse),
  delete: (id: string) => apiRequest('DELETE', `menu-locale/${id}`),
};
