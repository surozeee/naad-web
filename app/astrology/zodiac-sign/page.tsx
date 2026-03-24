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
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { PageHeaderWithInfo } from '../../components/common/PageHeaderWithInfo';
import { ActionTooltip } from '../../components/common/ActionTooltip';
import { zodiacSignApi } from '@/app/lib/crm.service';
import type {
  ZodiacSignRequest,
  ZodiacSignEnum,
  ZodiacSignLocaleRequest,
  ZodiacSignLocaleResponse,
  ZodiacSignResponse,
  LanguageEnumCode,
} from '@/app/lib/crm.types';

const LANGUAGE_OPTIONS: { value: LanguageEnumCode; label: string }[] = [
  { value: 'EN', label: 'English' },
  { value: 'NE', label: 'Nepali' },
];

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

interface ZodiacSignItem {
  id: string;
  name: string;
  zodiacSign: string;
  description: string;
  logoUrl: string;
  startingName: string;
  daysRange: string;
  status: 'active' | 'inactive' | 'deleted';
  locales: ZodiacSignLocaleResponse[];
}

interface LocaleFormRow {
  key: string;
  language: LanguageEnumCode;
  name: string;
  startingName: string;
}

function createLocaleRow(language: LanguageEnumCode = 'EN'): LocaleFormRow {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, language, name: '', startingName: '' };
}

function defaultLocaleRows(): LocaleFormRow[] {
  return [createLocaleRow('EN'), createLocaleRow('NE')];
}

function mapApiLocales(raw: unknown): ZodiacSignLocaleResponse[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const o = x as Record<string, unknown>;
    return {
      id: o.id != null ? String(o.id) : undefined,
      language: String(o.language ?? 'EN') as LanguageEnumCode,
      name: String(o.name ?? ''),
      startingName: o.startingName != null ? String(o.startingName) : undefined,
    };
  });
}

function localesSummary(locales: ZodiacSignLocaleResponse[]): string {
  if (!locales.length) return '—';
  return locales
    .filter((l) => l.name?.trim())
    .map((l) => `${l.language}: ${l.name}`)
    .join(' · ') || '—';
}

function mapApiToItem(raw: Record<string, unknown>): ZodiacSignItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    zodiacSign: String(raw.zodiacSign ?? ''),
    description: String(raw.description ?? ''),
    logoUrl: String(raw.logoUrl ?? ''),
    startingName: String(raw.startingName ?? ''),
    daysRange: String(raw.daysRange ?? ''),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
    locales: mapApiLocales(raw.locales),
  };
}

function buildLocalesPayload(rows: LocaleFormRow[]): ZodiacSignLocaleRequest[] {
  return rows
    .filter((r) => r.language && r.name.trim())
    .map((r) => ({
      language: r.language,
      name: r.name.trim(),
      startingName: r.startingName.trim() || undefined,
    }));
}

export default function ZodiacSignPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<ZodiacSignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ZodiacSignRequest>({
    name: '',
    zodiacSign: 'ARIES',
    description: '',
    logoUrl: '',
    startingName: '',
    daysRange: '',
  });
  /** Base64 of newly selected logo file (for API). When set, sent as logoImageBase64; backend uploads and sets logoUrl. */
  const [logoImageBase64, setLogoImageBase64] = useState<string | null>(null);
  /** Full data URL for selected file preview (e.g. data:image/jpeg;base64,...). */
  const [logoPreviewDataUrl, setLogoPreviewDataUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localeRows, setLocaleRows] = useState<LocaleFormRow[]>(() => defaultLocaleRows());
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [filterZodiacSign, setFilterZodiacSign] = useState<string>('');
  const [sortKey, setSortKey] = useState<'name' | 'startingName' | 'daysRange' | 'zodiacSign' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await zodiacSignApi.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        zodiacSign: (filterZodiacSign || undefined) as ZodiacSignEnum | undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setItems(list.map(mapApiToItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load zodiac signs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterZodiacSign]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setLogoImageBase64(base64);
      setLogoPreviewDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const clearLogoFile = () => {
    setLogoImageBase64(null);
    setLogoPreviewDataUrl(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.zodiacSign) newErrors.zodiacSign = 'Zodiac sign is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    const body: ZodiacSignRequest = {
      name: formData.name.trim(),
      zodiacSign: formData.zodiacSign,
      description: formData.description?.trim() || undefined,
      startingName: formData.startingName?.trim() || undefined,
      daysRange: formData.daysRange?.trim() || undefined,
      locales: buildLocalesPayload(localeRows),
    };
    if (logoImageBase64) {
      body.logoImageBase64 = logoImageBase64;
    } else if (formData.logoUrl?.trim()) {
      body.logoUrl = formData.logoUrl.trim();
    }
    try {
      if (editingId) {
        await zodiacSignApi.update(editingId, body);
        await Swal.fire({ title: 'Updated', text: 'Zodiac sign updated.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await zodiacSignApi.create(body);
        await Swal.fire({ title: 'Created', text: 'Zodiac sign created.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', zodiacSign: 'ARIES', description: '', logoUrl: '', startingName: '', daysRange: '' });
    setLocaleRows(defaultLocaleRows());
    setLogoImageBase64(null);
    setLogoPreviewDataUrl(null);
    setErrors({});
    setEditingId(null);
    setFetchingDetail(false);
  };

  const handleEdit = async (row: ZodiacSignItem) => {
    setErrors({});
    setFetchingDetail(true);
    setShowAddModal(true);
    setEditingId(row.id);
    try {
      const res = await zodiacSignApi.getById(row.id);
      const d = res.data;
      if (!d || typeof d !== 'object') {
        throw new Error('Could not load zodiac sign');
      }
      const detail = d as ZodiacSignResponse;
      setFormData({
        name: detail.name ?? row.name,
        zodiacSign: (detail.zodiacSign || row.zodiacSign || 'ARIES') as ZodiacSignEnum,
        description: detail.description ?? row.description ?? '',
        logoUrl: detail.logoUrl ?? row.logoUrl ?? '',
        startingName: detail.startingName ?? row.startingName ?? '',
        daysRange: detail.daysRange ?? row.daysRange ?? '',
      });
      if (detail.locales?.length) {
        setLocaleRows(
          detail.locales.map((l, i) => ({
            key: `edit-${i}-${l.language}`,
            language: l.language,
            name: l.name ?? '',
            startingName: l.startingName ?? '',
          }))
        );
      } else {
        setLocaleRows(defaultLocaleRows());
      }
      setLogoImageBase64(null);
      setLogoPreviewDataUrl(null);
    } catch (err) {
      setShowAddModal(false);
      setEditingId(null);
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to load zodiac sign',
        icon: 'error',
      });
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleChangeStatus = async (row: ZodiacSignItem) => {
    const newStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${row.name}"</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await zodiacSignApi.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete zodiac sign?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await zodiacSignApi.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Zodiac sign deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.startingName && i.startingName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.daysRange && i.daysRange.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.zodiacSign && i.zodiacSign.toLowerCase().includes(searchTerm.toLowerCase())) ||
      localesSummary(i.locales).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const aVal = String(a[sortKey] ?? '').toLowerCase();
    const bVal = String(b[sortKey] ?? '').toLowerCase();
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? cmp : -cmp;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);
  const hasNoData = filtered.length === 0;

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
        <Breadcrumb items={[{ label: 'Astrology', href: '/astrology' }, { label: 'Zodiac Sign' }]} />
        <PageHeaderWithInfo
          title="Zodiac Sign"
          infoText="Manage zodiac signs: default fields plus per-language name and starting name (English, Nepali, etc.)."
        >
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Zodiac Sign</span>
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
              placeholder="Search by name, locales, description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
          <select
            className="form-input"
            style={{ width: 200 }}
            value={filterZodiacSign}
            onChange={(e) => { setFilterZodiacSign(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All zodiac signs</option>
            {ZODIAC_SIGN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">Name</SortableTh>
                <SortableTh columnKey="zodiacSign">Zodiac Sign</SortableTh>
                <th>Description</th>
                <SortableTh columnKey="startingName">Starting Name</SortableTh>
                <SortableTh columnKey="daysRange">Days Range</SortableTh>
                <th>Locales</th>
                <th>Logo</th>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    <p>{items.length === 0 ? 'No zodiac signs found' : 'No zodiac signs match your search'}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name}</span>
                      </div>
                    </td>
                    <td>{ZODIAC_SIGN_OPTIONS.find((o) => o.value === row.zodiacSign)?.label ?? row.zodiacSign ?? '—'}</td>
                    <td style={{ maxWidth: 180 }}>{row.description ? (row.description.length > 50 ? row.description.slice(0, 50) + '…' : row.description) : '—'}</td>
                    <td>{row.startingName || '—'}</td>
                    <td>{row.daysRange || '—'}</td>
                    <td style={{ maxWidth: 220, fontSize: 12 }} title={localesSummary(row.locales)}>
                      {localesSummary(row.locales)}
                    </td>
                    <td>
                      {row.logoUrl ? (
                        <img
                          src={row.logoUrl}
                          alt={`${row.name} logo`}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        '—'
                      )}
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
                  <td colSpan={9}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-zs" className="pagination-label">Show:</label>
                        <select id="items-per-page-zs" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
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
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Zodiac Sign' : 'Add Zodiac Sign'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {fetchingDetail && (
                  <div style={{ marginBottom: 12, padding: 10, background: '#f1f5f9', borderRadius: 8, fontSize: 14 }}>
                    Loading details…
                  </div>
                )}
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Aries" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="zodiacSign" className="form-label">Zodiac Sign <span className="required">*</span></label>
                  <select id="zodiacSign" name="zodiacSign" value={formData.zodiacSign} onChange={handleInputChange} className={`form-input ${errors.zodiacSign ? 'error' : ''}`}>
                    {ZODIAC_SIGN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.zodiacSign && <span className="form-error">{errors.zodiacSign}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea id="description" name="description" value={formData.description ?? ''} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="startingName" className="form-label">Starting Name</label>
                  <input type="text" id="startingName" name="startingName" value={formData.startingName ?? ''} onChange={handleInputChange} className="form-input" placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="daysRange" className="form-label">Days Range</label>
                  <input type="text" id="daysRange" name="daysRange" value={formData.daysRange ?? ''} onChange={handleInputChange} className="form-input" placeholder="e.g. Mar 21 - Apr 19" />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Localized labels</label>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      onClick={() => setLocaleRows((prev) => [...prev, createLocaleRow('EN')])}
                      disabled={fetchingDetail}
                    >
                      <Plus size={14} />
                      <span>Add language</span>
                    </button>
                  </div>
                  <p style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                    One row per language (e.g. EN / NE). Empty rows are ignored on save. Saving replaces all locale rows for this sign.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {localeRows.map((row) => (
                      <div
                        key={row.key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '100px 1fr 1fr auto',
                          gap: 8,
                          alignItems: 'end',
                          padding: 12,
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#fafafa',
                        }}
                      >
                        <div>
                          <label className="form-label" style={{ fontSize: 12 }}>Language</label>
                          <select
                            className="form-input"
                            value={row.language}
                            onChange={(e) => {
                              const v = e.target.value as LanguageEnumCode;
                              setLocaleRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, language: v } : r)));
                            }}
                            disabled={fetchingDetail}
                          >
                            {LANGUAGE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 12 }}>Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={row.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLocaleRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, name: v } : r)));
                            }}
                            placeholder="Localized name"
                            disabled={fetchingDetail}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 12 }}>Starting name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={row.startingName}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLocaleRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, startingName: v } : r)));
                            }}
                            placeholder="Optional"
                            disabled={fetchingDetail}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-icon-delete"
                          title="Remove row"
                          disabled={fetchingDetail || localeRows.length <= 1}
                          onClick={() => setLocaleRows((prev) => prev.filter((r) => r.key !== row.key))}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Logo (image)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        id="logoFile"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="form-input"
                        style={{ maxWidth: 240 }}
                      />
                      {(logoImageBase64 !== null || formData.logoUrl) && (
                        <button type="button" className="btn-secondary btn-small" onClick={clearLogoFile}>
                          Clear image
                        </button>
                      )}
                    </div>
                    {(logoPreviewDataUrl || formData.logoUrl) && (
                      <div style={{ marginTop: 4 }}>
                        <img
                          src={logoPreviewDataUrl || formData.logoUrl || ''}
                          alt="Logo preview"
                          style={{ maxWidth: 80, maxHeight: 80, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={fetchingDetail}>
                    <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
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
