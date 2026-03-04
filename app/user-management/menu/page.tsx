'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchWithAuth } from '@/app/lib/auth-fetch';

interface MenuItem {
  id?: string;
  name?: string;
  code?: string;
  status?: string;
  children?: MenuItem[];
  [key: string]: unknown;
}

function normalizeTree(res: unknown): MenuItem[] {
  if (res == null) return [];
  const raw = (res as { data?: unknown })?.data ?? res;
  if (Array.isArray(raw)) return raw as MenuItem[];
  if (raw && typeof raw === 'object' && 'content' in (raw as object))
    return ((raw as { content: unknown[] }).content ?? []) as MenuItem[];
  return [];
}

function MenuTreeRow({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const name = item?.name ?? item?.code ?? '—';
  const status = item?.status ?? '—';
  const children = (item?.children ?? []) as MenuItem[];
  const hasChildren = children.length > 0;

  return (
    <>
      <tr className="border-b border-gray-200 dark:border-slate-700">
        <td className="py-2 px-4 text-gray-800 dark:text-white font-medium" style={{ paddingLeft: 16 + depth * 24 }}>
          <span className={hasChildren ? 'font-semibold' : ''}>{String(name)}</span>
        </td>
        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{String(status)}</td>
        <td className="py-2 px-4">
          <div className="flex gap-2">
            <button className="text-purple-600 dark:text-purple-400 hover:underline text-sm">Edit</button>
            <button className="text-red-600 dark:text-red-400 hover:underline text-sm">Delete</button>
          </div>
        </td>
      </tr>
      {children.map((child) => (
        <MenuTreeRow key={String(child?.id ?? child?.name)} item={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function MenuPage() {
  const [tree, setTree] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWithAuth('/api/menus?tree=1')
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
        setTree(normalizeTree(data));
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Failed to load menus');
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
            Menu Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage menus (same API as User-Service MenuController: root-tree)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Menu Tree
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Add Menu
            </button>
          </div>

          {loading && <p className="text-gray-600 dark:text-gray-400">Loading...</p>}
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
          {!loading && !error && tree.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400">No menus found.</p>
          )}
          {!loading && !error && tree.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tree.map((item) => (
                    <MenuTreeRow key={String(item?.id ?? item?.name)} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
