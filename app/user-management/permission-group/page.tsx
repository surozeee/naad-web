'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchWithAuth } from '@/app/lib/auth-fetch';

/** Backend GlobalResponse: data may be array or paginated { content: [] }. */
function normalizeList(res: unknown): unknown[] {
  if (res == null) return [];
  const d = (res as Record<string, unknown>)?.data;
  if (d != null && typeof d === 'object' && 'content' in (d as object))
    return ((d as { content: unknown[] }).content ?? []) as unknown[];
  if (Array.isArray(d)) return d;
  if (Array.isArray(res)) return res;
  if (typeof res === 'object' && 'items' in (res as Record<string, unknown>)) return (res as { items: unknown[] }).items ?? [];
  return [];
}

export default function PermissionGroupPage() {
  const [list, setList] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWithAuth('/api/permission-groups', {
        method: 'POST',
        body: JSON.stringify({ pageNo: 0, pageSize: 100 }),
      })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setError(res.status === 401 ? 'Unauthorized' : `Failed to load (${res.status})`);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setList(normalizeList(data));
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load permission groups');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Permission Group Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage permission groups (same API as erp-web)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Permission Groups
            </h2>
          </div>

          {loading && (
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          )}
          {error && (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          )}
          {!loading && !error && list.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400">No permission groups found.</p>
          )}
          {!loading && !error && list.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {list.map((item: Record<string, unknown>, idx: number) => (
                <div key={String(item?.id ?? idx)} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {String(item?.name ?? item?.label ?? item?.code ?? '—')}
                      </h3>
                      {(item?.description != null || item?.descriptionEn != null) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {String(item?.description ?? item?.descriptionEn ?? '')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                      Edit
                    </button>
                    <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
