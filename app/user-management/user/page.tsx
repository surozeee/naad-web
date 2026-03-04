'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchWithAuth } from '@/app/lib/auth-fetch';

const SUBTITLE_INFO = 'Add, edit, and manage user accounts (same API as erp-web)';
const PAGE_SIZES = [10, 25, 50, 100];

/** Backend GlobalResponse: data.result (user list) or data.content (paginated) or data array. */
function normalizeList(res: unknown): unknown[] {
  if (res == null) return [];
  const d = (res as Record<string, unknown>)?.data;
  if (d != null && typeof d === 'object') {
    const obj = d as Record<string, unknown>;
    if (Array.isArray(obj.result)) return obj.result;
    if (Array.isArray(obj.content)) return obj.content;
  }
  if (Array.isArray(d)) return d;
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && 'items' in (res as Record<string, unknown>)) return (res as { items: unknown[] }).items ?? [];
  return [];
}

function getTotalElements(res: unknown): number {
  const d = (res as Record<string, unknown>)?.data;
  if (d != null && typeof d === 'object' && 'totalElements' in (d as object))
    return Number((d as { totalElements?: number }).totalElements) || 0;
  return 0;
}

function getUserDisplay(user: Record<string, unknown>) {
  const detail = user?.userDetail as Record<string, unknown> | undefined;
  return {
    name: String(detail?.name ?? user?.name ?? user?.fullName ?? user?.username ?? '—'),
    email: String(user?.emailAddress ?? user?.email ?? '—'),
    role: String(user?.roleName ?? user?.role?.name ?? user?.role ?? '—'),
    status: String(user?.status ?? (user?.enabled === true ? 'ACTIVE' : user?.enabled === false ? 'INACTIVE' : user?.accountNonLocked === false ? 'Locked' : '—')),
  };
}

export default function UserPage() {
  const [list, setList] = useState<unknown[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [detailUser, setDetailUser] = useState<Record<string, unknown> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/csrf-token', { credentials: 'same-origin' });
      const res = await fetchWithAuth('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          pageNo,
          pageSize,
          ...(searchDebounced && { search: searchDebounced }),
        }),
      });
      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        const msg = (errData as { message?: string })?.message;
        setError(msg?.includes('XSRF') ? `${msg} Set NEXTAUTH_XSRF_TOKEN in .env (encrypted value).` : `Forbidden (403). ${msg || ''}`);
        setList([]);
        setTotalElements(0);
        return;
      }
      if (!res.ok) {
        setError(res.status === 401 ? 'Unauthorized' : `Failed to load (${res.status})`);
        setList([]);
        setTotalElements(0);
        return;
      }
      const data = await res.json();
      setList(normalizeList(data));
      setTotalElements(getTotalElements(data));
    } catch (e) {
      setError((e as Error)?.message ?? 'Failed to load users');
      setList([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize, searchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const canPrev = pageNo > 0;
  const canNext = pageNo < totalPages - 1;

  const handleRowClick = (user: Record<string, unknown>, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDetailUser(user);
  };

  const closeDetail = () => {
    setDetailUser(null);
  };

  const closeCreate = () => {
    setCreateOpen(false);
  };

  const handleCreated = () => {
    closeCreate();
    load();
  };

  const handleUpdated = () => {
    closeDetail();
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page title + info icon (subtitle in tooltip) */}
        <div className="mb-8 flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 cursor-help text-sm font-medium"
            title={SUBTITLE_INFO}
          >
            i
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          {/* Toolbar: search left (wider), Add right; no extra space; line below */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-200 dark:border-slate-700">
            <div className="flex-1 min-w-[200px] max-w-xl">
              <input
                type="search"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shrink-0"
            >
              Add User
            </button>
          </div>

          {error && <p className="text-red-600 dark:text-red-400 mt-3">{error}</p>}

          {/* Table: header a bit smaller, body loads after API */}
          <div className="overflow-x-auto mt-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-800 dark:text-white">Name</th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-800 dark:text-white">Email</th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-800 dark:text-white">Role</th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-800 dark:text-white">Status</th>
                  <th className="text-left py-2 px-4 text-sm font-semibold text-gray-800 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && list.length === 0 && !error && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  list.map((user: Record<string, unknown>, idx: number) => {
                    const { name, email, role, status } = getUserDisplay(user);
                    return (
                      <tr
                        key={String(user?.id ?? idx)}
                        onClick={(e) => handleRowClick(user, e)}
                        className="border-b border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-800 dark:text-white font-medium">{name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{email}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{role}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              status.toLowerCase() === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailUser(user)}
                              className="text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailUser(user)}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && (list.length > 0 || totalElements > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPageNo(0);
                  }}
                  className="rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white px-2 py-1 text-sm"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {totalElements} total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={() => setPageNo((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pageNo + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setPageNo((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View / Edit detail modal */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={closeDetail}
          onSaved={handleUpdated}
        />
      )}

      {/* Create user modal */}
      {createOpen && (
        <UserCreateModal
          onClose={closeCreate}
          onCreated={handleCreated}
        />
      )}
    </DashboardLayout>
  );
}

function UserDetailModal({
  user,
  onClose,
  onSaved,
}: {
  user: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const detail = user?.userDetail as Record<string, unknown> | undefined;
  const { name, email, role, status } = getUserDisplay(user);
  const mobile = user?.mobileNumber ?? detail?.phoneNumber ?? '—';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">User details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
            <p className="font-medium text-gray-800 dark:text-white">{name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
            <p className="font-medium text-gray-800 dark:text-white">{email}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Mobile</span>
            <p className="font-medium text-gray-800 dark:text-white">{String(mobile)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
            <p className="font-medium text-gray-800 dark:text-white">{role}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <p className="font-medium text-gray-800 dark:text-white">{status}</p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => { onSaved(); }}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
          >
            Edit (placeholder)
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add User</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6 text-gray-600 dark:text-gray-400 text-sm">
          Create user form (placeholder). Wire to backend create API when ready.
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreated}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
          >
            Create (placeholder)
          </button>
        </div>
      </div>
    </div>
  );
}
