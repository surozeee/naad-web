'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Save,
  Languages,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { ActionTooltip } from '@/app/components/common/ActionTooltip';
import { horoscopeScopeApi } from '@/app/lib/crm.service';
import type { HoroscopeScopeLocaleRequest, HoroscopeScopeRequest, HoroscopeScopeEnum, LanguageEnumCode, ZodiacSignEnum } from '@/app/lib/crm.types';

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

const SCOPE_OPTIONS: { value: HoroscopeScopeEnum; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUALLY', label: 'Semi-Annually' },
  { value: 'YEARLY', label: 'Yearly' },
];

interface HoroscopeScopeItem {
  id: string;
  zodiacSign: string;
  scope: string;
  name: string;
  description: string;
  locales: HoroscopeScopeLocaleRequest[];
  status: 'active' | 'inactive' | 'deleted';
}

function mapApiLocales(raw: unknown): HoroscopeScopeLocaleRequest[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const o = x as Record<string, unknown>;
    return {
      language: String(o.language ?? 'EN') as LanguageEnumCode,
      name: String(o.name ?? ''),
      description: String(o.description ?? ''),
    };
  });
}

function localesSummary(locales: HoroscopeScopeLocaleRequest[]): string {
  if (!locales?.length) return '—';
  return (
    locales
      .filter((l) => (l.name ?? '').trim())
      .map((l) => `${l.language}: ${l.name}`)
      .join(' · ') || '—'
  );
}

function mapApiToItem(raw: Record<string, unknown>): HoroscopeScopeItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const status: HoroscopeScopeItem['status'] =
    statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive';
  return {
    id: String(raw.id ?? ''),
    zodiacSign: String(raw.zodiacSign ?? ''),
    scope: String(raw.scope ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    locales: mapApiLocales(raw.locales),
    status,
  };
}

const LANGUAGE_OPTIONS: { value: LanguageEnumCode; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'NE', label: 'Nepali' },
];

interface LocaleFormRow {
  key: string;
  language: LanguageEnumCode;
  name: string;
  description: string;
}

function createLocaleRow(language: LanguageEnumCode = 'EN'): LocaleFormRow {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, language, name: '', description: '' };
}

function defaultLocaleRows(): LocaleFormRow[] {
  return [createLocaleRow('EN'), createLocaleRow('NE')];
}

function buildLocalesPayload(rows: LocaleFormRow[]): HoroscopeScopeLocaleRequest[] {
  return rows
    .filter((r) => r.language && r.name.trim())
    .map((r) => ({ language: r.language, name: r.name.trim(), description: r.description.trim() }));
}

export default function HoroscopeScopePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [items, setItems] = useState<HoroscopeScopeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<HoroscopeScopeRequest>({ zodiacSign: 'ARIES', scope: 'DAILY', name: '', description: undefined });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localeRows, setLocaleRows] = useState<LocaleFormRow[]>(() => defaultLocaleRows());
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [sortKey, setSortKey] = useState<'scope' | 'description' | 'status'>('scope');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [submitting, setSubmitting] = useState(false);

  // UI state: multi-language editor form (menu-like UX)
  const [showLocaleForm, setShowLocaleForm] = useState(true);
  const [showMultiLocaleSection, setShowMultiLocaleSection] = useState(true);
  const [editingLocaleKey, setEditingLocaleKey] = useState<string | null>(null);
  const [localeForm, setLocaleForm] = useState<{ language: LanguageEnumCode; name: string; description: string }>({
    language: 'EN',
    name: '',
    description: '',
  });

  const getMissingLanguages = (rows: LocaleFormRow[]): LanguageEnumCode[] => {
    const existing = new Set(rows.map((r) => r.language));
    return LANGUAGE_OPTIONS.map((o) => o.value).filter((code) => !existing.has(code));
  };

  const openAddLocaleForm = () => {
    const missing = getMissingLanguages(localeRows);
    if (!missing.length) return;
    setEditingLocaleKey(null);
    setLocaleForm({ language: missing[0], name: '', description: '' });
    setShowLocaleForm(true);
    setShowMultiLocaleSection(true);
  };

  const openEditLocaleForm = (row: LocaleFormRow) => {
    setEditingLocaleKey(row.key);
    setLocaleForm({ language: row.language, name: row.name ?? '', description: row.description ?? '' });
    setShowLocaleForm(true);
    setShowMultiLocaleSection(true);
  };

  // Language dropdown shows all supported languages.
  // Save will merge into the existing locale row by language (no duplicates).

  const saveLocaleForm = () => {
    const name = localeForm.name.trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, submit: 'Localized name is required' }));
      return;
    }
    const description = localeForm.description.trim();
    const language = localeForm.language;

    setLocaleRows((prev) => {
      // Prevent duplicate language: merge into existing row if needed.
      const existingForLang = prev.find((r) => r.language === language);
      if (editingLocaleKey) {
        const duplicateOther = prev.find((r) => r.language === language && r.key !== editingLocaleKey);
        const cleaned = duplicateOther ? prev.filter((r) => r.key !== duplicateOther.key) : prev;
        return cleaned.map((r) => (r.key === editingLocaleKey ? { ...r, language, name, description } : r));
      }
      if (existingForLang) {
        return prev.map((r) => (r.key === existingForLang.key ? { ...r, language, name, description } : r));
      }
      return [...prev, { ...createLocaleRow(language), name, description }];
    });

    // Keep the editor open; the main scope modal still controls the save/update.
  };

  const removeLocaleRow = (key: string) => {
    setLocaleRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.key !== key);
    });
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await horoscopeScopeApi.list({
        pageNo: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchKey: searchTerm || undefined,
        sortBy: sortKey,
        sortDirection,
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setItems(list.map(mapApiToItem));
      setTotalElements(res.totalElements ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load horoscope scopes');
      setItems([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortKey, sortDirection]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // In edit mode, keep root name/description in sync with EN locale row.
  useEffect(() => {
    if (!editingId) return;
    const enRow = localeRows.find((r) => r.language === 'EN');
    if (!enRow) return;
    setFormData((prev) => ({
      ...prev,
      name: enRow.name,
      description: enRow.description?.trim() || undefined,
    }));
  }, [editingId, localeRows]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.scope?.trim()) newErrors.scope = 'Scope is required';
    if (editingId) {
      if (!localeRows.some((r) => r.name.trim())) newErrors.submit = 'Enter at least one localized name (e.g. EN)';
    } else {
      if (!formData.name?.trim()) newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    setSubmitting(true);
    const enRow = localeRows.find((r) => r.language === 'EN');
    const firstNamedRow = localeRows.find((r) => r.name.trim());
    const localesPayload = buildLocalesPayload(localeRows);
    const body: HoroscopeScopeRequest = editingId
      ? {
          zodiacSign: formData.zodiacSign,
          scope: formData.scope,
          name: firstNamedRow?.name?.trim() || formData.name.trim(),
          description: enRow?.description?.trim() || undefined,
          locales: localesPayload,
        }
      : {
          zodiacSign: formData.zodiacSign,
          scope: formData.scope,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          locales: undefined,
        };

    try {
      if (editingId) {
        await horoscopeScopeApi.update(editingId, body);
        await Swal.fire({ title: 'Updated', text: 'Horoscope scope updated.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await horoscopeScopeApi.create(body);
        await Swal.fire({ title: 'Created', text: 'Horoscope scope created.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ zodiacSign: 'ARIES', scope: 'DAILY', name: '', description: undefined });
    setLocaleRows(defaultLocaleRows());
    setErrors({});
    setEditingId(null);
    setFetchingDetail(false);
    setShowLocaleForm(true);
    setEditingLocaleKey(null);
    setLocaleForm({ language: 'EN', name: '', description: '' });
    setShowMultiLocaleSection(true);
  };

  const handleEdit = async (row: HoroscopeScopeItem) => {
    setErrors({});
    setFetchingDetail(true);
    setShowAddModal(true);
    setEditingId(row.id);
    try {
      const res = await horoscopeScopeApi.getById(row.id);
      const d = (res.data ?? {}) as Record<string, unknown>;

      setFormData({
        zodiacSign: String(d.zodiacSign ?? row.zodiacSign ?? 'ARIES') as ZodiacSignEnum,
        scope: String(d.scope ?? row.scope ?? 'DAILY') as HoroscopeScopeEnum,
        name: String(d.name ?? row.name ?? ''),
        description: String(d.description ?? row.description ?? ''),
      });

      const apiLocales = (d.locales as unknown as HoroscopeScopeLocaleRequest[] | undefined) ?? row.locales ?? [];
      const localeNameMap = new Map(apiLocales.map((l) => [l.language, l.name ?? '']));
      const localeDescMap = new Map(apiLocales.map((l) => [l.language, l.description ?? '']));

      const fallback = defaultLocaleRows();
      fallback.forEach((r) => {
        const n = localeNameMap.get(r.language);
        const desc = localeDescMap.get(r.language);
        if (n != null) r.name = n;
        if (desc != null) r.description = desc;
      });

      setLocaleRows(fallback);
    } catch {
      // Fallback to existing row snapshot if backend fetch fails.
      setFormData({
        zodiacSign: (row.zodiacSign || 'ARIES') as ZodiacSignEnum,
        scope: row.scope as HoroscopeScopeEnum,
        name: row.name ?? '',
        description: row.description || '',
      });
      setLocaleRows(defaultLocaleRows());
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleChangeStatus = async (row: HoroscopeScopeItem) => {
    const newStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${row.scope}"</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await horoscopeScopeApi.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete horoscope scope?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await horoscopeScopeApi.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Horoscope scope deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const hasNoData = items.length === 0 && !loading;

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children }: { columnKey: typeof sortKey; children: React.ReactNode }) => (
    <th
      role="button"
      tabIndex={0}
      onClick={() => handleSort(columnKey)}
      onKeyDown={(e) => e.key === 'Enter' && handleSort(columnKey)}
      className="sortable-th"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey === columnKey ? (
          sortDirection === 'asc' ? (
            <ChevronUp size={14} color="#2563eb" strokeWidth={2.4} />
          ) : (
            <ChevronDown size={14} color="#2563eb" strokeWidth={2.4} />
          )
        ) : (
          <ArrowUpDown size={14} color="#94a3b8" strokeWidth={1.9} />
        )}
      </span>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Horoscope Scope' }]} />
        <PageHeaderWithInfo
          title="Horoscope Scope"
          infoText="Manage horoscope scopes (Daily, Weekly, Monthly, etc.). Used for horoscope and zodiac sign configuration."
        >
          <button type="button" className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Horoscope Scope</span>
          </button>
        </PageHeaderWithInfo>
        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        )}
        <div className="search-section" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by scope or description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
        </div>
        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh columnKey="scope">Scope</SortableTh>
                <SortableTh columnKey="description">Description</SortableTh>
                <th>Locales</th>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <p>{items.length === 0 ? 'No horoscope scopes found' : 'No scopes match your search'}</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{SCOPE_OPTIONS.find((o) => o.value === row.scope)?.label ?? row.scope}</span>
                      </div>
                    </td>
                    <td>{row.description || '—'}</td>
                    <td>
                      <span style={{ display: 'inline-block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={localesSummary(row.locales)}>
                        {localesSummary(row.locales)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${row.status}`}>
                        {row.status === 'active' && <Check size={14} />}
                        {row.status === 'inactive' && <X size={14} />}
                        {row.status === 'deleted' && <Trash2 size={14} />}
                        <span>{row.status === 'active' ? 'Active' : row.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <ActionTooltip text="Edit">
                          <button type="button" className="btn-icon-edit" onClick={() => handleEdit(row)}>
                            <Edit size={18} />
                          </button>
                        </ActionTooltip>
                <ActionTooltip text="Multi-language labels">
                  <button
                    type="button"
                    className="btn-icon-edit"
                    onClick={() => handleEdit(row)}
                    disabled={fetchingDetail}
                  >
                    <Languages size={18} />
                  </button>
                </ActionTooltip>
                        <ActionTooltip text="Delete">
                          <button type="button" className="btn-icon-delete" onClick={() => handleDelete(row.id)}>
                            <Trash2 size={18} />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text={row.status === 'active' ? 'Deactivate' : 'Activate'}>
                          <button type="button" className="btn-icon-edit" onClick={() => handleChangeStatus(row)}>
                            {row.status === 'active' ? <X size={18} /> : <Check size={18} />}
                          </button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && (
              <tfoot>
                <tr>
                  <td colSpan={5}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <span className="pagination-label">{PAGE_SIZE} per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, totalElements)} of {totalElements}
                      </div>
                      <div className="pagination-controls">
                        <button type="button" className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                          <ChevronLeft size={18} /><span>Previous</span>
                        </button>
                        <div className="pagination-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              type="button"
                              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                              aria-current={currentPage === page ? 'page' : undefined}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button type="button" className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                          <span>Next</span><ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Horoscope Scope' : 'Add Horoscope Scope'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="scope" className="form-label">Scope <span className="required">*</span></label>
                  <select
                    id="scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleInputChange}
                    className={`form-input ${errors.scope ? 'error' : ''}`}
                  >
                    {SCOPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.scope && <span className="form-error">{errors.scope}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    value={formData.name ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((p) => ({ ...p, name: v }));
                      if (editingId) {
                        setLocaleRows((prev) => {
                          const en = prev.find((r) => r.language === 'EN');
                          if (en) return prev.map((r) => (r.language === 'EN' ? { ...r, name: v } : r));
                          return [...prev, { ...createLocaleRow('EN'), name: v, description: '' }];
                        });
                      }
                    }}
                    placeholder="e.g. Daily Horoscope"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-input"
                    rows={2}
                    value={formData.description ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((p) => ({ ...p, description: v }));
                      if (editingId) {
                        setLocaleRows((prev) => {
                          const en = prev.find((r) => r.language === 'EN');
                          if (en) return prev.map((r) => (r.language === 'EN' ? { ...r, description: v } : r));
                          return [...prev, { ...createLocaleRow('EN'), name: formData.name, description: v }];
                        });
                      }
                    }}
                    placeholder="Optional"
                  />
                </div>

                {editingId && showMultiLocaleSection && (
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Languages size={20} />
                      <span className="form-label" style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Multi-language labels</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Add/update localized Name + Description</span>
                  </div>

                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'end' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 12 }}>Language</label>
                        <select
                          className="form-input"
                          value={localeForm.language}
                          onChange={(e) => {
                            const next = e.target.value as LanguageEnumCode;
                            const existing = localeRows.find((r) => r.language === next);
                            setEditingLocaleKey(existing?.key ?? null);
                            setLocaleForm({
                              language: next,
                              name: existing?.name ?? '',
                              description: existing?.description ?? '',
                            });
                          }}
                          disabled={submitting}
                        >
                          {LANGUAGE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 12 }}>Local name</label>
                        <input
                          className="form-input"
                          value={localeForm.name}
                          onChange={(e) => setLocaleForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Localized name"
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <label className="form-label" style={{ fontSize: 12 }}>Local description</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={localeForm.description}
                        onChange={(e) => setLocaleForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Localized description (optional)"
                        disabled={submitting}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-primary btn-small"
                        disabled={!showLocaleForm || submitting || !localeForm.language || !localeForm.name.trim()}
                        onClick={saveLocaleForm}
                      >
                        <Save size={16} />
                        <span>{editingLocaleKey ? 'Update' : 'Save'}</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                    Saved translations
                  </div>
                  {localeRows.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#64748b', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                      No translations yet. Select a language above, enter Local name, and click Save.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {localeRows.map((row) => (
                        <div
                          key={row.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                            <span style={{ fontWeight: 600, color: '#475569', minWidth: 36 }}>{row.language}</span>
                            <span style={{ color: '#0f172a', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row.name?.trim() ? row.name : '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <ActionTooltip text="Edit">
                              <button
                                type="button"
                                className="btn-icon-edit"
                                onClick={() => {
                                  setEditingLocaleKey(row.key);
                                  setLocaleForm({ language: row.language, name: row.name ?? '', description: row.description ?? '' });
                                }}
                                disabled={submitting}
                              >
                                <Edit size={14} />
                              </button>
                            </ActionTooltip>
                            <ActionTooltip text="Remove">
                              <button
                                type="button"
                                className="btn-icon-delete"
                                onClick={() => removeLocaleRow(row.key)}
                                disabled={submitting || localeRows.length <= 1}
                              >
                                <Trash2 size={14} />
                              </button>
                            </ActionTooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      disabled={submitting}
                      onClick={() => setShowMultiLocaleSection(false)}
                      aria-label="Close multi-language editor"
                    >
                      Close
                    </button>
                  </div>
                </div>
                )}
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="form-spinner" style={{ marginRight: 6 }} />
                        <span>{editingId ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
