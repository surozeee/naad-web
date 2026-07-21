'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Plus, Search, Edit, Trash2, X, Languages, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { PageHeaderWithInfo } from '../../components/common/PageHeaderWithInfo';
import { ActionTooltip } from '../../components/common/ActionTooltip';
import { zodiacCompatibilityApi, zodiacCompatibilityLocaleApi } from '@/app/lib/crm.service';
import type {
  ZodiacCompatibilityDetailResponse,
  ZodiacCompatibilityLevelEnum,
  ZodiacCompatibilityLocaleResponse,
  ZodiacCompatibilityRequest,
  ZodiacSignEnum,
} from '@/app/lib/crm.types';
import { masterService } from '@/app/lib/master.service';

const ZODIAC_SIGN_OPTIONS: { value: ZodiacSignEnum; label: string }[] = [
  { value: 'ARIES', label: 'Aries' },
  { value: 'TAURUS', label: 'Taurus' },
  { value: 'GEMINI', label: 'Gemini' },
  { value: 'CANCER', label: 'Cancer' },
  { value: 'LEO', label: 'Leo' },
  { value: 'VIRGO', label: 'Virgo' },
  { value: 'LIBRA', label: 'Libra' },
  { value: 'SCORPIO', label: 'Scorpio' },
  { value: 'SAGITTARIUS', label: 'Sagittarius' },
  { value: 'CAPRICORN', label: 'Capricorn' },
  { value: 'AQUARIUS', label: 'Aquarius' },
  { value: 'PISCES', label: 'Pisces' },
];

const LEVEL_OPTIONS: { value: ZodiacCompatibilityLevelEnum; label: string }[] = [
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'CHALLENGING', label: 'Challenging' },
];

type LangOption = { value: string; label: string };

function normalizeLanguageEnumCode(raw: unknown, nameHint?: unknown): string | null {
  const fromCode = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  if (fromCode === 'NP' || fromCode === 'NEP' || fromCode === 'NEPALI') return 'NE';
  if (fromCode === 'ENG' || fromCode === 'ENGLISH') return 'EN';
  if (fromCode === 'HIN' || fromCode === 'HINDI') return 'HI';
  if (/^[A-Z]{2,3}$/.test(fromCode)) return fromCode;

  const name = String(nameHint ?? '')
    .trim()
    .toLowerCase();
  if (name === 'nepali' || name === 'नेपाली') return 'NE';
  if (name === 'english') return 'EN';
  if (name === 'hindi' || name === 'हिन्दी' || name === 'हिंदी') return 'HI';
  return null;
}

function levelBadgeClass(level?: string): string {
  switch (level) {
    case 'EXCELLENT':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case 'GOOD':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200';
    case 'MODERATE':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case 'CHALLENGING':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200';
  }
}

const emptyForm = (): ZodiacCompatibilityRequest => ({
  signA: 'ARIES',
  signB: 'TAURUS',
  score: 70,
  level: 'GOOD',
  summary: '',
  loveAdvice: '',
  friendshipAdvice: '',
  workAdvice: '',
});

export default function ZodiacMatchingPage() {
  const [items, setItems] = useState<ZodiacCompatibilityDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSign, setFilterSign] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ZodiacCompatibilityRequest>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const [localeMode, setLocaleMode] = useState(false);
  const [locales, setLocales] = useState<ZodiacCompatibilityLocaleResponse[]>([]);
  const [localeForm, setLocaleForm] = useState({
    language: 'NE',
    summary: '',
    loveAdvice: '',
    friendshipAdvice: '',
    workAdvice: '',
  });
  const [editingLocaleId, setEditingLocaleId] = useState<string | null>(null);
  const [localeLanguageOptions, setLocaleLanguageOptions] = useState<LangOption[]>([]);
  const [localeSubmitting, setLocaleSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await zodiacCompatibilityApi.list({
        pageNo: page,
        pageSize,
        searchKey: searchTerm || undefined,
        signA: (filterSign || undefined) as ZodiacSignEnum | undefined,
        level: (filterLevel || undefined) as ZodiacCompatibilityLevelEnum | undefined,
        sortBy: 'signA',
        sortDirection: 'asc',
      });
      const list = (res.result ?? res.content ?? []) as ZodiacCompatibilityDetailResponse[];
      setItems(list);
      setTotal(Number(res.totalElements ?? list.length));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load zodiac matching data');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, filterSign, filterLevel]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (!showModal) return;
    masterService.language
      .listActive()
      .then((res: { data?: unknown }) => {
        const raw = res?.data;
        const arr = Array.isArray(raw) ? raw : [];
        const options = arr
          .map((item: Record<string, unknown>) => {
            const code = normalizeLanguageEnumCode(item.code, item.name ?? item.nativeName);
            if (!code || code === 'EN') return null;
            const name = String(item.name ?? item.nativeName ?? item.code ?? code);
            return { value: code, label: `${name} (${code})` };
          })
          .filter((o): o is LangOption => o != null);
        // Ensure NE/HI appear even if master temporarily empty
        const ensure = (code: string, label: string) => {
          if (!options.some((o) => o.value === code)) options.push({ value: code, label });
        };
        ensure('NE', 'Nepali (NE)');
        ensure('HI', 'Hindi (HI)');
        setLocaleLanguageOptions(options);
      })
      .catch(() =>
        setLocaleLanguageOptions([
          { value: 'NE', label: 'Nepali (NE)' },
          { value: 'HI', label: 'Hindi (HI)' },
        ])
      );
  }, [showModal]);

  const refreshLocales = useCallback(async () => {
    if (!editingId) {
      setLocales([]);
      return;
    }
    try {
      const list = await zodiacCompatibilityLocaleApi.getByCompatibilityId(editingId);
      setLocales(list);
    } catch {
      setLocales([]);
    }
  }, [editingId]);

  useEffect(() => {
    if (localeMode && editingId) {
      void refreshLocales();
    }
  }, [localeMode, editingId, refreshLocales]);

  const missingLocaleOptions = useMemo(() => {
    const saved = new Set(locales.map((l) => String(l.language).toUpperCase()));
    return localeLanguageOptions.filter((o) => !saved.has(o.value));
  }, [locales, localeLanguageOptions]);

  const openCreate = () => {
    setEditingId(null);
    setLocaleMode(false);
    setFormData(emptyForm());
    setLocales([]);
    setShowModal(true);
  };

  const openEdit = async (id: string) => {
    setLocaleMode(false);
    setEditingId(id);
    setShowModal(true);
    try {
      const res = await zodiacCompatibilityApi.getById(id);
      const d = (res.data ?? res) as ZodiacCompatibilityDetailResponse;
      setFormData({
        signA: d.signA,
        signB: d.signB,
        score: d.score,
        level: d.level,
        summary: d.summary ?? '',
        loveAdvice: d.loveAdvice ?? '',
        friendshipAdvice: d.friendshipAdvice ?? '',
        workAdvice: d.workAdvice ?? '',
      });
      setLocales(d.locales ?? []);
    } catch (err) {
      await Swal.fire('Error', err instanceof Error ? err.message : 'Failed to load detail', 'error');
      setShowModal(false);
    }
  };

  const openLocales = async (id: string) => {
    setEditingId(id);
    setLocaleMode(true);
    setShowModal(true);
    setEditingLocaleId(null);
    setLocaleForm({ language: 'NE', summary: '', loveAdvice: '', friendshipAdvice: '', workAdvice: '' });
    try {
      const res = await zodiacCompatibilityApi.getById(id);
      const d = (res.data ?? res) as ZodiacCompatibilityDetailResponse;
      setFormData({
        signA: d.signA,
        signB: d.signB,
        score: d.score,
        level: d.level,
        summary: d.summary ?? '',
        loveAdvice: d.loveAdvice ?? '',
        friendshipAdvice: d.friendshipAdvice ?? '',
        workAdvice: d.workAdvice ?? '',
      });
      const list = await zodiacCompatibilityLocaleApi.getByCompatibilityId(id);
      setLocales(list);
    } catch (err) {
      await Swal.fire('Error', err instanceof Error ? err.message : 'Failed to load locales', 'error');
      setShowModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.signA === formData.signB && formData.score == null) {
      /* same-sign allowed */
    }
    setSubmitting(true);
    try {
      const payload: ZodiacCompatibilityRequest = {
        ...formData,
        summary: formData.summary?.trim() || undefined,
        loveAdvice: formData.loveAdvice?.trim() || undefined,
        friendshipAdvice: formData.friendshipAdvice?.trim() || undefined,
        workAdvice: formData.workAdvice?.trim() || undefined,
      };
      if (editingId) {
        await zodiacCompatibilityApi.update(editingId, payload);
        await Swal.fire('Updated', 'Zodiac matching pair updated.', 'success');
      } else {
        await zodiacCompatibilityApi.create(payload);
        await Swal.fire('Created', 'Zodiac matching pair created.', 'success');
      }
      setShowModal(false);
      await fetchItems();
    } catch (err) {
      await Swal.fire('Error', err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Delete pair?',
      text: 'This soft-deletes the zodiac matching record.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });
    if (!confirm.isConfirmed) return;
    try {
      await zodiacCompatibilityApi.delete(id);
      await fetchItems();
    } catch (err) {
      await Swal.fire('Error', err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const selectLocaleForEdit = (locale: ZodiacCompatibilityLocaleResponse) => {
    setEditingLocaleId(String(locale.id));
    setLocaleForm({
      language: String(locale.language).toUpperCase(),
      summary: locale.summary ?? '',
      loveAdvice: locale.loveAdvice ?? '',
      friendshipAdvice: locale.friendshipAdvice ?? '',
      workAdvice: locale.workAdvice ?? '',
    });
  };

  const handleLocaleSave = async () => {
    if (!editingId) return;
    const lang = normalizeLanguageEnumCode(localeForm.language) ?? localeForm.language.toUpperCase();
    if (lang === 'EN') {
      await Swal.fire('Note', 'English content is edited on the main pair form, not as a locale.', 'info');
      return;
    }
    if (!localeForm.summary.trim()) {
      await Swal.fire('Validation', 'Summary is required for a locale.', 'warning');
      return;
    }
    setLocaleSubmitting(true);
    try {
      const body = {
        compatibilityId: editingId,
        language: lang,
        summary: localeForm.summary.trim(),
        loveAdvice: localeForm.loveAdvice.trim() || undefined,
        friendshipAdvice: localeForm.friendshipAdvice.trim() || undefined,
        workAdvice: localeForm.workAdvice.trim() || undefined,
      };
      if (editingLocaleId) {
        await zodiacCompatibilityLocaleApi.update(editingLocaleId, body);
      } else {
        await zodiacCompatibilityLocaleApi.create(body);
      }
      await refreshLocales();
      setEditingLocaleId(null);
      setLocaleForm({
        language: missingLocaleOptions[0]?.value ?? 'NE',
        summary: '',
        loveAdvice: '',
        friendshipAdvice: '',
        workAdvice: '',
      });
      await fetchItems();
    } catch (err) {
      await Swal.fire('Error', err instanceof Error ? err.message : 'Locale save failed', 'error');
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleLocaleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Delete translation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });
    if (!confirm.isConfirmed) return;
    try {
      await zodiacCompatibilityLocaleApi.delete(id);
      await refreshLocales();
      await fetchItems();
    } catch (err) {
      await Swal.fire('Error', err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pairLabel = `${formData.signA} × ${formData.signB}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Astrology', href: '/astrology' },
            { label: 'Zodiac Matching' },
          ]}
        />
        <PageHeaderWithInfo
          title="Zodiac Sign Matching"
          infoText="Manage sun-sign compatibility pairs (78 seeded). English content lives on the main row; Nepali/Hindi (and other active languages) are locale translations. Seeded on backend startup."
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchItems()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              <Plus size={16} /> Add Pair
            </button>
          </div>
        </PageHeaderWithInfo>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => {
                setPage(0);
                setSearchTerm(e.target.value);
              }}
              placeholder="Search summary / advice…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <Select
            className="min-w-[160px] text-sm"
            classNamePrefix="rs"
            isClearable
            placeholder="Filter sign"
            options={ZODIAC_SIGN_OPTIONS}
            value={ZODIAC_SIGN_OPTIONS.find((o) => o.value === filterSign) ?? null}
            onChange={(opt) => {
              setPage(0);
              setFilterSign(opt?.value ?? '');
            }}
          />
          <Select
            className="min-w-[160px] text-sm"
            classNamePrefix="rs"
            isClearable
            placeholder="Filter level"
            options={LEVEL_OPTIONS}
            value={LEVEL_OPTIONS.find((o) => o.value === filterLevel) ?? null}
            onChange={(opt) => {
              setPage(0);
              setFilterLevel(opt?.value ?? '');
            }}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pair</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Summary (EN)</th>
                  <th className="px-4 py-3 font-semibold">Locales</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No pairs found. Restart naad-app to seed EN/NE/HI initial data, or add a pair.
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100 dark:border-slate-700">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white whitespace-nowrap">
                        {row.signALabel ?? row.signA} × {row.signBLabel ?? row.signB}
                      </td>
                      <td className="px-4 py-3">{row.score}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${levelBadgeClass(row.level)}`}>
                          {row.levelLabel ?? row.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-600 dark:text-gray-300" title={row.summary}>
                        {row.summary || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {(row.locales ?? [])
                          .map((l) => String(l.language).toUpperCase())
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 capitalize">{String(row.status ?? 'ACTIVE').toLowerCase()}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <ActionTooltip text="Edit EN">
                            <button
                              type="button"
                              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                              onClick={() => openEdit(row.id)}
                            >
                              <Edit size={16} />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip text="Translations">
                            <button
                              type="button"
                              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                              onClick={() => openLocales(row.id)}
                            >
                              <Languages size={16} />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip text="Delete">
                            <button
                              type="button"
                              className="p-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </ActionTooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700 text-sm">
            <span className="text-gray-500">
              {total} pair{total === 1 ? '' : 's'} · page {page + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded border disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {localeMode
                  ? `Translations · ${pairLabel}`
                  : editingId
                    ? `Edit pair · ${pairLabel}`
                    : 'Add zodiac matching pair'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>

            {!localeMode ? (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Default language (English) fields. Use the Languages action to manage Nepali / Hindi translations.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Sign A</span>
                    <Select
                      options={ZODIAC_SIGN_OPTIONS}
                      value={ZODIAC_SIGN_OPTIONS.find((o) => o.value === formData.signA)}
                      onChange={(opt) => opt && setFormData((p) => ({ ...p, signA: opt.value }))}
                    />
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Sign B</span>
                    <Select
                      options={ZODIAC_SIGN_OPTIONS}
                      value={ZODIAC_SIGN_OPTIONS.find((o) => o.value === formData.signB)}
                      onChange={(opt) => opt && setFormData((p) => ({ ...p, signB: opt.value }))}
                    />
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Score (0–100)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.score ?? 70}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          score: Number(e.target.value),
                          level:
                            Number(e.target.value) >= 80
                              ? 'EXCELLENT'
                              : Number(e.target.value) >= 65
                                ? 'GOOD'
                                : Number(e.target.value) >= 50
                                  ? 'MODERATE'
                                  : 'CHALLENGING',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium">Level</span>
                    <Select
                      options={LEVEL_OPTIONS}
                      value={LEVEL_OPTIONS.find((o) => o.value === formData.level)}
                      onChange={(opt) => opt && setFormData((p) => ({ ...p, level: opt.value }))}
                    />
                  </label>
                </div>
                {(
                  [
                    ['summary', 'Summary'],
                    ['loveAdvice', 'Love advice'],
                    ['friendshipAdvice', 'Friendship advice'],
                    ['workAdvice', 'Work advice'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm space-y-1">
                    <span className="font-medium">{label}</span>
                    <textarea
                      rows={3}
                      value={(formData[key] as string) ?? ''}
                      onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </label>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
                  >
                    {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-5">
                <div className="rounded-lg bg-gray-50 dark:bg-slate-900/50 p-3 text-sm text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-800 dark:text-white">EN summary:</strong> {formData.summary || '—'}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">Saved translations</h3>
                  {locales.length === 0 && <p className="text-sm text-gray-500">No locale rows yet.</p>}
                  {locales.map((loc) => (
                    <div
                      key={String(loc.id)}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-gray-200 dark:border-slate-600 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-indigo-600 dark:text-indigo-300">{loc.language}</div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{loc.summary}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded border"
                          onClick={() => selectLocaleForEdit(loc)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded border text-rose-600"
                          onClick={() => loc.id && handleLocaleDelete(String(loc.id))}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {editingLocaleId ? 'Edit translation' : 'Add translation'}
                  </h3>
                  <label className="block text-sm space-y-1">
                    <span className="font-medium">Language</span>
                    <Select
                      options={
                        editingLocaleId
                          ? localeLanguageOptions.filter((o) => o.value === localeForm.language)
                          : missingLocaleOptions
                      }
                      isDisabled={Boolean(editingLocaleId) && missingLocaleOptions.length === 0}
                      value={
                        localeLanguageOptions.find((o) => o.value === localeForm.language) ??
                        missingLocaleOptions.find((o) => o.value === localeForm.language) ??
                        null
                      }
                      onChange={(opt) => opt && setLocaleForm((p) => ({ ...p, language: opt.value }))}
                    />
                  </label>
                  {(
                    [
                      ['summary', 'Summary'],
                      ['loveAdvice', 'Love advice'],
                      ['friendshipAdvice', 'Friendship advice'],
                      ['workAdvice', 'Work advice'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="block text-sm space-y-1">
                      <span className="font-medium">{label}</span>
                      <textarea
                        rows={2}
                        value={localeForm[key]}
                        onChange={(e) => setLocaleForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </label>
                  ))}
                  <div className="flex justify-end gap-2">
                    {editingLocaleId && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg border text-sm"
                        onClick={() => {
                          setEditingLocaleId(null);
                          setLocaleForm({
                            language: missingLocaleOptions[0]?.value ?? 'NE',
                            summary: '',
                            loveAdvice: '',
                            friendshipAdvice: '',
                            workAdvice: '',
                          });
                        }}
                      >
                        Cancel edit
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={localeSubmitting || (!editingLocaleId && missingLocaleOptions.length === 0)}
                      onClick={handleLocaleSave}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60"
                    >
                      {localeSubmitting ? 'Saving…' : editingLocaleId ? 'Update locale' : 'Add locale'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
