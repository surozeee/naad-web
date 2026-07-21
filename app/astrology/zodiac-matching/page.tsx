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
      return 'zm-level zm-level--excellent';
    case 'GOOD':
      return 'zm-level zm-level--good';
    case 'MODERATE':
      return 'zm-level zm-level--moderate';
    case 'CHALLENGING':
      return 'zm-level zm-level--challenging';
    default:
      return 'zm-level';
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
    const saved = new Set(
      locales
        .map((l) => normalizeLanguageEnumCode(l.language) ?? String(l.language).toUpperCase())
        .filter(Boolean)
    );
    return localeLanguageOptions.filter((o) => !saved.has(o.value));
  }, [locales, localeLanguageOptions]);

  // Keep add-form language on an unsaved option when saved list changes
  useEffect(() => {
    if (!localeMode || editingLocaleId) return;
    const current = normalizeLanguageEnumCode(localeForm.language) ?? localeForm.language.toUpperCase();
    const stillAvailable = missingLocaleOptions.some((o) => o.value === current);
    if (!stillAvailable) {
      setLocaleForm((p) => ({
        ...p,
        language: missingLocaleOptions[0]?.value ?? '',
      }));
    }
  }, [localeMode, editingLocaleId, missingLocaleOptions, localeForm.language]);

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
    setLocaleForm({ language: '', summary: '', loveAdvice: '', friendshipAdvice: '', workAdvice: '' });
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
      const saved = new Set(
        list
          .map((l) => normalizeLanguageEnumCode(l.language) ?? String(l.language).toUpperCase())
          .filter(Boolean)
      );
      const firstAvailable =
        localeLanguageOptions.find((o) => !saved.has(o.value))?.value ??
        ['NE', 'HI'].find((code) => !saved.has(code)) ??
        '';
      setLocaleForm({
        language: firstAvailable,
        summary: '',
        loveAdvice: '',
        friendshipAdvice: '',
        workAdvice: '',
      });
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
      const nextLang =
        missingLocaleOptions.find((o) => o.value !== lang)?.value ?? '';
      setLocaleForm({
        language: nextLang,
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
      <div className="organization-page space-y-5">
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
            <button type="button" onClick={() => fetchItems()} className="btn-secondary btn-small">
              <RefreshCw size={16} /> Refresh
            </button>
            <button type="button" onClick={openCreate} className="btn-primary btn-small">
              <Plus size={16} /> Add Pair
            </button>
          </div>
        </PageHeaderWithInfo>

        <div className="table-container" style={{ padding: '1rem' }}>
          <div className="search-section" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 0 }}>
            <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setPage(0);
                  setSearchTerm(e.target.value);
                }}
                placeholder="Search summary / advice…"
                className="search-input"
              />
            </div>
            <Select
              className="min-w-[160px] text-sm"
              classNamePrefix="lang-select"
              isClearable
              placeholder="Filter sign"
              options={ZODIAC_SIGN_OPTIONS}
              value={ZODIAC_SIGN_OPTIONS.find((o) => o.value === filterSign) ?? null}
              onChange={(opt) => {
                setPage(0);
                setFilterSign(opt?.value ?? '');
              }}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 1000002 }) }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
            />
            <Select
              className="min-w-[160px] text-sm"
              classNamePrefix="lang-select"
              isClearable
              placeholder="Filter level"
              options={LEVEL_OPTIONS}
              value={LEVEL_OPTIONS.find((o) => o.value === filterLevel) ?? null}
              onChange={(opt) => {
                setPage(0);
                setFilterLevel(opt?.value ?? '');
              }}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 1000002 }) }}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
            />
          </div>
        </div>

        {error && (
          <div
            className="form-error"
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--naad-error) 40%, transparent)',
              background: 'color-mix(in srgb, var(--naad-error) 12%, transparent)',
            }}
          >
            {error}
          </div>
        )}

        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Summary (EN)</th>
                  <th>Locales</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="dash-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      <p>No pairs found. Restart naad-app to seed EN/NE/HI initial data, or add a pair.</p>
                    </td>
                  </tr>
                )}
                {!loading &&
                  items.map((row) => (
                    <tr key={row.id}>
                      <td className="org-name" style={{ whiteSpace: 'nowrap' }}>
                        {row.signALabel ?? row.signA} × {row.signBLabel ?? row.signB}
                      </td>
                      <td>{row.score}</td>
                      <td>
                        <span className={`status-badge ${levelBadgeClass(row.level)}`}>
                          {row.levelLabel ?? row.level}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }} className="dash-muted" title={row.summary}>
                        {row.summary
                          ? row.summary.length > 60
                            ? `${row.summary.slice(0, 60)}…`
                            : row.summary
                          : '—'}
                      </td>
                      <td className="dash-muted">
                        {(row.locales ?? [])
                          .map((l) => String(l.language).toUpperCase())
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{String(row.status ?? 'ACTIVE').toLowerCase()}</td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <ActionTooltip text="Edit EN">
                            <button type="button" className="btn-icon-edit" onClick={() => openEdit(row.id)}>
                              <Edit size={16} />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip text="Translations">
                            <button type="button" className="btn-icon-edit" onClick={() => openLocales(row.id)}>
                              <Languages size={16} />
                            </button>
                          </ActionTooltip>
                          <ActionTooltip text="Delete">
                            <button type="button" className="btn-icon-delete" onClick={() => handleDelete(row.id)}>
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
          <div className="pagination-container" style={{ padding: '12px 16px' }}>
            <span className="pagination-label">
              {total} pair{total === 1 ? '' : 's'} · page {page + 1}/{totalPages}
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="pagination-btn"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} role="presentation">
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: '48rem', width: '92vw', borderRadius: '0.75rem' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-header"
              style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--naad-card-bg)' }}
            >
              <h2>
                {localeMode
                  ? `Translations · ${pairLabel}`
                  : editingId
                    ? `Edit pair · ${pairLabel}`
                    : 'Add zodiac matching pair'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="modal-close-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {!localeMode ? (
              <form onSubmit={handleSubmit} className="organization-form" style={{ display: 'grid', gap: 16 }}>
                <p className="dash-muted" style={{ fontSize: 12, margin: 0 }}>
                  Default language (English) fields. Use the Languages action to manage Nepali / Hindi translations.
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sign A</label>
                    <Select
                      classNamePrefix="lang-select"
                      options={ZODIAC_SIGN_OPTIONS}
                      value={ZODIAC_SIGN_OPTIONS.find((o) => o.value === formData.signA)}
                      onChange={(opt) => opt && setFormData((p) => ({ ...p, signA: opt.value }))}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1000002 }) }}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sign B</label>
                    <Select
                      classNamePrefix="lang-select"
                      options={ZODIAC_SIGN_OPTIONS}
                      value={ZODIAC_SIGN_OPTIONS.find((o) => o.value === formData.signB)}
                      onChange={(opt) => opt && setFormData((p) => ({ ...p, signB: opt.value }))}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1000002 }) }}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Score (0–100)</label>
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
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Level</label>
                    <Select
                      classNamePrefix="lang-select"
                      options={LEVEL_OPTIONS}
                      value={LEVEL_OPTIONS.find((o) => o.value === formData.level)}
                      onChange={(opt) => opt && setFormData((p) => ({ ...p, level: opt.value }))}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1000002 }) }}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  </div>
                </div>
                {(
                  [
                    ['summary', 'Summary'],
                    ['loveAdvice', 'Love advice'],
                    ['friendshipAdvice', 'Friendship advice'],
                    ['workAdvice', 'Work advice'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <textarea
                      rows={3}
                      value={(formData[key] as string) ?? ''}
                      onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                ))}
                <div className="form-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="organization-form" style={{ display: 'grid', gap: 20 }}>
                <div className="dash-info-panel" style={{ marginBottom: 0 }}>
                  <strong className="dash-info-panel__title" style={{ fontSize: 14 }}>
                    EN summary:
                  </strong>{' '}
                  <span className="dash-muted">{formData.summary || '—'}</span>
                </div>

                <div>
                  <h3 className="dash-section-label" style={{ marginBottom: 8, fontSize: 15, color: 'var(--naad-fg)' }}>
                    Saved translations
                  </h3>
                  {locales.length === 0 && <p className="dash-locale-empty">No locale rows yet.</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {locales.map((loc) => (
                      <div
                        key={String(loc.id)}
                        className="dash-locale-row"
                        style={{ alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="dash-locale-row__code" style={{ color: 'var(--naad-primary)', marginBottom: 4 }}>
                            {loc.language}
                          </div>
                          <p className="dash-muted" style={{ margin: 0, fontSize: 13 }}>
                            {loc.summary}
                          </p>
                        </div>
                        <div className="action-buttons">
                          <button type="button" className="btn-secondary btn-small" onClick={() => selectLocaleForEdit(loc)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-small"
                            style={{ color: 'var(--naad-error)' }}
                            onClick={() => loc.id && handleLocaleDelete(String(loc.id))}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--naad-line)', paddingTop: 16, display: 'grid', gap: 12 }}>
                  <h3 className="dash-section-label" style={{ fontSize: 15, color: 'var(--naad-fg)' }}>
                    {editingLocaleId ? 'Edit translation' : 'Add translation'}
                  </h3>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <Select
                      classNamePrefix="lang-select"
                      options={
                        editingLocaleId
                          ? localeLanguageOptions.filter(
                              (o) =>
                                o.value ===
                                (normalizeLanguageEnumCode(localeForm.language) ??
                                  localeForm.language.toUpperCase())
                            )
                          : missingLocaleOptions
                      }
                      isDisabled={
                        Boolean(editingLocaleId) || (!editingLocaleId && missingLocaleOptions.length === 0)
                      }
                      placeholder={
                        missingLocaleOptions.length === 0 && !editingLocaleId
                          ? 'All languages already saved'
                          : 'Select language'
                      }
                      value={
                        editingLocaleId
                          ? localeLanguageOptions.find(
                              (o) =>
                                o.value ===
                                (normalizeLanguageEnumCode(localeForm.language) ??
                                  localeForm.language.toUpperCase())
                            ) ?? null
                          : missingLocaleOptions.find((o) => o.value === localeForm.language) ?? null
                      }
                      onChange={(opt) => opt && setLocaleForm((p) => ({ ...p, language: opt.value }))}
                      noOptionsMessage={() => 'No languages left to add'}
                      styles={{ menuPortal: (base) => ({ ...base, zIndex: 1000002 }) }}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                    />
                  </div>
                  {(
                    [
                      ['summary', 'Summary'],
                      ['loveAdvice', 'Love advice'],
                      ['friendshipAdvice', 'Friendship advice'],
                      ['workAdvice', 'Work advice'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="form-group">
                      <label className="form-label">{label}</label>
                      <textarea
                        rows={2}
                        value={localeForm[key]}
                        onChange={(e) => setLocaleForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  ))}
                  <div className="form-actions" style={{ marginBottom: 0 }}>
                    {editingLocaleId && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingLocaleId(null);
                          setLocaleForm({
                            language: missingLocaleOptions[0]?.value ?? '',
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
                      className="btn-primary"
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
