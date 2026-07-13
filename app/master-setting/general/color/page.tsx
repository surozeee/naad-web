'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Select from 'react-select';
import {
  Palette,
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
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { ActionTooltip } from '@/app/components/common/ActionTooltip';
import { masterService, colorLocaleApi } from '@/app/lib/master.service';
import type { ColorLocaleResponse, ColorRequest, StatusEnum } from '@/app/lib/master.types';
import { COLOR_NE_FALLBACK } from '@/app/lib/color-i18n';

interface ColorRow {
  id: string;
  name: string;
  hexCode: string;
  isSystem: boolean;
  sortOrder: number | null;
  status: 'active' | 'inactive' | 'deleted';
  locales: ColorLocaleResponse[];
}

type SortKey = 'name' | 'hexCode' | 'isSystem' | 'sortOrder' | 'status';
type LangSelectOption = { value: string; label: string };

function normalizeHex(value: string): string {
  const raw = value.trim();
  const match = raw.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return raw;
  return `#${match[1].toUpperCase()}`;
}

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

function mapApiLocales(raw: unknown): ColorLocaleResponse[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = item as Record<string, unknown>;
      return {
        id: o.id != null ? String(o.id) : undefined,
        language: String(o.language ?? 'EN'),
        name: String(o.name ?? ''),
      };
    })
    .filter((l) => String(l.language).toUpperCase() !== 'EN');
}

function localesSummary(locales: ColorLocaleResponse[]): string {
  if (!locales.length) return '—';
  return locales
    .map((l) => `${l.language}: ${l.name}`)
    .join(' · ');
}

function defaultLocaleName(language: string, colorName: string): string {
  const lang = language.toUpperCase();
  if (lang === 'EN') return colorName;
  if (lang === 'NE') return COLOR_NE_FALLBACK[colorName.toLowerCase()] ?? '';
  return '';
}

function mapApiToColor(raw: Record<string, unknown>): ColorRow {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    hexCode: normalizeHex(String(raw.hexCode ?? '')),
    isSystem: Boolean(raw.isSystem),
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : null,
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
    locales: mapApiLocales(raw.locales),
  };
}

export default function ColorSetupPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    hexCode: '#6366F1',
    sortOrder: '',
  });
  const [localeOnlyMode, setLocaleOnlyMode] = useState(false);
  const [colorLocalesApi, setColorLocalesApi] = useState<ColorLocaleResponse[]>([]);
  const [editingColorLocaleId, setEditingColorLocaleId] = useState<string | null>(null);
  const [localeForm, setLocaleForm] = useState<{ language: string; name: string }>({
    language: 'NE',
    name: '',
  });
  const [localeLanguageOptions, setLocaleLanguageOptions] = useState<LangSelectOption[]>([]);
  const [localeLanguagesLoading, setLocaleLanguagesLoading] = useState(false);
  const [localeSubmitting, setLocaleSubmitting] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const localeLanguageOptionsRef = useRef<LangSelectOption[]>([]);
  localeLanguageOptionsRef.current = localeLanguageOptions;

  const fetchColors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.color.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? res.data?.content ?? []) as unknown as Record<
        string,
        unknown
      >[];
      setColors(Array.isArray(list) ? list.map(mapApiToColor) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load colors');
      setColors([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const lastFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchTerm;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchColors();
  }, [fetchColors, searchTerm]);

  const resetForm = () => {
    setFormData({ name: '', hexCode: '#6366F1', sortOrder: '' });
    setErrors({});
    setEditingId(null);
    setLocaleOnlyMode(false);
    setColorLocalesApi([]);
    setEditingColorLocaleId(null);
    setLocaleForm({ language: 'NE', name: '' });
    setFetchingDetail(false);
  };

  const localeOptionsForColorModal = useMemo(() => {
    // Always offer every active non-EN language so remaining ones stay selectable.
    return localeLanguageOptions;
  }, [localeLanguageOptions]);

  const handleColorLocaleLanguageChange = (language: string) => {
    const code = normalizeLanguageEnumCode(language) ?? language.toUpperCase();
    if (code === 'EN') return;
    const existing = colorLocalesApi.find((l) => String(l.language).toUpperCase() === code);
    if (existing?.id) {
      setEditingColorLocaleId(existing.id);
      setLocaleForm({ language: code, name: existing.name });
      return;
    }
    setEditingColorLocaleId(null);
    setLocaleForm({
      language: code,
      name: defaultLocaleName(code, formData.name),
    });
  };

  const refreshColorLocales = async (colorId: string) => {
    const list = (await colorLocaleApi.getByColorId(colorId)).filter(
      (l) => String(l.language).toUpperCase() !== 'EN'
    );
    setColorLocalesApi(list);
    return list;
  };

  const handleAddColorLocale = async () => {
    if (!editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      const addedLang = localeForm.language;
      await colorLocaleApi.create({
        colorId: editingId,
        language: normalizeLanguageEnumCode(localeForm.language) ?? localeForm.language.toUpperCase(),
        name: localeForm.name.trim(),
      });
      const list = await refreshColorLocales(editingId);
      const opts = localeLanguageOptionsRef.current;
      const savedCodes = new Set(list.map((l) => String(l.language).toUpperCase()));
      const nextMissing = opts.find((o) => !savedCodes.has(o.value));
      if (nextMissing) {
        setEditingColorLocaleId(null);
        setLocaleForm({
          language: nextMissing.value,
          name: defaultLocaleName(nextMissing.value, formData.name),
        });
      } else {
        const match =
          list.find((l) => String(l.language).toUpperCase() === addedLang.toUpperCase()) ?? list[0];
        if (match?.id) {
          setEditingColorLocaleId(match.id);
          setLocaleForm({ language: String(match.language), name: match.name });
        }
      }
      lastFetchKeyRef.current = null;
      await fetchColors();
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to add translation',
        icon: 'error',
      });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleUpdateColorLocale = async () => {
    if (!editingColorLocaleId || !editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      await colorLocaleApi.update(editingColorLocaleId, {
        colorId: editingId,
        language: normalizeLanguageEnumCode(localeForm.language) ?? localeForm.language.toUpperCase(),
        name: localeForm.name.trim(),
      });
      await refreshColorLocales(editingId);
      lastFetchKeyRef.current = null;
      await fetchColors();
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to update translation',
        icon: 'error',
      });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleDeleteColorLocale = async (localeId: string) => {
    const result = await Swal.fire({
      title: 'Remove translation?',
      text: 'This removes the localized color name for that language.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
    });
    if (!result.isConfirmed || !editingId) return;
    setLocaleSubmitting(true);
    try {
      await colorLocaleApi.delete(localeId);
      const list = await refreshColorLocales(editingId);
      const first = list[0];
      if (first?.id) {
        setEditingColorLocaleId(first.id);
        setLocaleForm({ language: String(first.language), name: first.name });
      } else {
        setEditingColorLocaleId(null);
        setLocaleForm({
          language: localeLanguageOptions[0]?.value ?? 'NE',
          name: defaultLocaleName(localeLanguageOptions[0]?.value ?? 'NE', formData.name),
        });
      }
      lastFetchKeyRef.current = null;
      await fetchColors();
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to remove translation',
        icon: 'error',
      });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showAddModal || !localeOnlyMode || !editingId) return;
    setLocaleLanguagesLoading(true);
    masterService.language
      .listActive()
      .then((res) => {
        const raw = Array.isArray(res?.data) ? res.data : [];
        const opts: LangSelectOption[] = [];
        const seen = new Set<string>();
        for (const item of raw as Array<Record<string, unknown>>) {
          const code = normalizeLanguageEnumCode(item.code, item.name ?? item.nativeName);
          // EN is the default on color.name — only non-default languages go in color_language.
          if (!code || code === 'EN' || seen.has(code)) continue;
          seen.add(code);
          const name = String(item.nativeName ?? item.name ?? code);
          opts.push({
            value: code,
            label: `${name} (${code})`,
          });
        }
        setLocaleLanguageOptions(opts);
      })
      .catch(() => setLocaleLanguageOptions([]))
      .finally(() => setLocaleLanguagesLoading(false));
  }, [showAddModal, localeOnlyMode, editingId]);

  useEffect(() => {
    if (!localeOnlyMode || !showAddModal) return;
    if (localeLanguageOptions.length === 0) return;

    const saved = new Set(colorLocalesApi.map((l) => String(l.language).toUpperCase()));
    const firstMissing = localeLanguageOptions.find((o) => !saved.has(o.value));

    // Prefer add mode for the next missing active language.
    if (firstMissing && !editingColorLocaleId) {
      setLocaleForm((prev) => {
        if (prev.language === firstMissing.value && !saved.has(prev.language.toUpperCase())) {
          return prev;
        }
        if (prev.language && !saved.has(prev.language.toUpperCase())) {
          // Already on a valid missing language
          if (localeLanguageOptions.some((o) => o.value === prev.language)) return prev;
        }
        return {
          language: firstMissing.value,
          name: defaultLocaleName(firstMissing.value, formData.name),
        };
      });
      return;
    }

    // All active languages already saved — keep/edit an existing one.
    if (!firstMissing && colorLocalesApi.length > 0 && !editingColorLocaleId) {
      const first = colorLocalesApi[0];
      if (first?.id) {
        setEditingColorLocaleId(first.id);
        setLocaleForm({ language: String(first.language), name: first.name });
      }
    }
  }, [
    localeLanguageOptions,
    localeOnlyMode,
    showAddModal,
    colorLocalesApi,
    editingColorLocaleId,
    formData.name,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = 'Color name is required';
    if (!/^#?[0-9A-Fa-f]{6}$/.test(formData.hexCode.trim())) {
      next.hexCode = 'Enter a valid hex color (e.g. #DC2626)';
    }
    if (formData.sortOrder.trim() && Number.isNaN(Number(formData.sortOrder))) {
      next.sortOrder = 'Sort order must be a number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);

    const body: ColorRequest = {
      name: formData.name.trim(),
      hexCode: normalizeHex(formData.hexCode),
      sortOrder: formData.sortOrder.trim() ? Number(formData.sortOrder) : undefined,
    };

    try {
      if (editingId) await masterService.color.update(editingId, body);
      else await masterService.color.create(body);
      lastFetchKeyRef.current = null;
      await fetchColors();
      setShowAddModal(false);
      resetForm();
      await Swal.fire({
        title: editingId ? 'Updated' : 'Created',
        text: editingId ? 'Color updated successfully.' : 'Color created successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Operation failed',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (color: ColorRow, openLocales = false) => {
    setErrors({});
    setFormData({
      name: color.name,
      hexCode: color.hexCode,
      sortOrder: color.sortOrder != null ? String(color.sortOrder) : '',
    });
    setEditingId(color.id);
    setShowAddModal(true);
    setLocaleOnlyMode(openLocales);
    if (!openLocales) {
      setColorLocalesApi([]);
      setEditingColorLocaleId(null);
      setLocaleForm({ language: 'NE', name: '' });
      return;
    }
    setFetchingDetail(true);
    try {
      const raw =
        color.locales?.length > 0 ? color.locales : await colorLocaleApi.getByColorId(color.id);
      const list = raw.filter((l) => String(l.language).toUpperCase() !== 'EN');
      setColorLocalesApi(list);
      // Start in add mode so remaining active languages stay selectable.
      setEditingColorLocaleId(null);
      setLocaleForm({
        language: 'NE',
        name: defaultLocaleName('NE', color.name),
      });
    } catch {
      setColorLocalesApi([]);
      setEditingColorLocaleId(null);
      setLocaleForm({ language: 'NE', name: defaultLocaleName('NE', color.name) });
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleChangeStatus = async (color: ColorRow) => {
    const newStatus: StatusEnum = color.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${color.name}"</strong> to <strong>${newLabel}</strong>?<br/><span style="font-size:12px;color:#64748b">Only active colors appear in horoscope lucky-color pickers.</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.color.changeStatus(color.id, newStatus);
      lastFetchKeyRef.current = null;
      await fetchColors();
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Status update failed',
        icon: 'error',
      });
    }
  };

  const handleDelete = async (color: ColorRow) => {
    if (color.isSystem) {
      await Swal.fire({
        title: 'Protected color',
        text: 'System palette colors cannot be deleted. Set them inactive instead.',
        icon: 'info',
      });
      return;
    }
    const result = await Swal.fire({
      title: 'Delete color?',
      text: `Delete "${color.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.color.delete(color.id);
      lastFetchKeyRef.current = null;
      await fetchColors();
      await Swal.fire({
        title: 'Deleted',
        text: 'Color deleted successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Delete failed',
        icon: 'error',
      });
    }
  };

  const filteredColors = colors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.hexCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      localesSummary(c.locales).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedColors = [...filteredColors].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const aStr =
      typeof aVal === 'boolean'
        ? aVal
          ? 1
          : 0
        : aVal == null
          ? ''
          : String(aVal).toLowerCase();
    const bStr =
      typeof bVal === 'boolean'
        ? bVal
          ? 1
          : 0
        : bVal == null
          ? ''
          : String(bVal).toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedColors.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedColors = sortedColors.slice(startIndex, endIndex);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children }: { columnKey: SortKey; children: React.ReactNode }) => (
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
        {sortBy === columnKey ? (
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
        <Breadcrumb
          items={[
            { label: 'Master Setting', href: '/master-setting' },
            { label: 'General', href: '/master-setting/general' },
            { label: 'Color' },
          ]}
        />

        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Color Setup
            </h1>
            <div
              style={{ marginTop: -6, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="Color setup information"
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  padding: 2,
                  borderRadius: 999,
                  cursor: 'help',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#334155',
                }}
              >
                <Info size={18} />
              </button>
              {showInfoTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 'calc(100% + 10px)',
                    transform: 'translateY(-50%)',
                    zIndex: 1200,
                    width: 280,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid #dbe2ea',
                    background: '#ffffff',
                    color: '#334155',
                    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  Manage lucky-color palette (name + hex) and <strong>multi-language labels</strong>. Only{' '}
                  <strong>Active</strong> colors appear in horoscope forms.
                </div>
              )}
            </div>
          </div>
          <button
            className="btn-primary btn-small"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus size={16} />
            <span>Add Color</span>
          </button>
        </div>

        {error && (
          <div
            className="error-message"
            style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}
          >
            {error}
          </div>
        )}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name, hex, or locales..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">Color</SortableTh>
                <SortableTh columnKey="hexCode">Hex</SortableTh>
                <th>Locales</th>
                <SortableTh columnKey="sortOrder">Order</SortableTh>
                <SortableTh columnKey="isSystem">Type</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    Loading colors...
                  </td>
                </tr>
              ) : sortedColors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <p>No colors found</p>
                  </td>
                </tr>
              ) : (
                paginatedColors.map((color) => (
                  <tr key={color.id}>
                    <td>
                      <div className="org-name-cell" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            background: color.hexCode,
                            border: '1px solid rgba(15,23,42,0.15)',
                            flexShrink: 0,
                          }}
                        />
                        <div className="org-name">{color.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="org-code">{color.hexCode}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#475569' }} title={localesSummary(color.locales)}>
                        {localesSummary(color.locales)}
                      </span>
                    </td>
                    <td>{color.sortOrder ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${color.isSystem ? 'active' : 'inactive'}`}>
                        {color.isSystem ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td
                      onClick={() => handleChangeStatus(color)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleChangeStatus(color)}
                      title={`Set to ${color.status === 'active' ? 'Inactive' : 'Active'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className={`status-badge ${color.status}`}>
                        {color.status === 'active' ? <Check size={14} /> : <X size={14} />}
                        <span>
                          {color.status === 'active'
                            ? 'Active'
                            : color.status === 'deleted'
                              ? 'Deleted'
                              : 'Inactive'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <ActionTooltip text="Edit">
                          <button type="button" className="btn-icon-edit" onClick={() => handleEdit(color)}>
                            <Edit size={18} />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text="Multi-language labels">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={() => handleEdit(color, true)}
                            disabled={fetchingDetail}
                          >
                            <Languages size={18} />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text={color.isSystem ? 'System colors cannot be deleted' : 'Delete'}>
                          <button
                            type="button"
                            className="btn-icon-delete"
                            onClick={() => handleDelete(color)}
                            disabled={color.isSystem}
                            style={color.isSystem ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                          >
                            <Trash2 size={18} />
                          </button>
                        </ActionTooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && filteredColors.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-color" className="pagination-label">
                          Show:
                        </label>
                        <select
                          id="items-per-page-color"
                          className="pagination-select"
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredColors.length)} of{' '}
                        {filteredColors.length} colors
                      </div>
                      <div className="pagination-controls">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={18} />
                          <span>Previous</span>
                        </button>
                        <div className="pagination-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              type="button"
                              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span>Next</span>
                          <ChevronRight size={18} />
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
          <div
            className="modal-overlay"
            onClick={() => {
              if (submitting || localeSubmitting) return;
              setShowAddModal(false);
              resetForm();
            }}
          >
            {localeOnlyMode ? (
              <div
                className="modal-content color-modal color-locale-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="color-locale-modal-title"
              >
                <div className="color-modal-header">
                  <div className="color-modal-title-row">
                    <span className="color-modal-icon" aria-hidden>
                      <Languages size={18} />
                    </span>
                    <div>
                      <h2 id="color-locale-modal-title">Multi-language labels</h2>
                      <p className="color-modal-subtitle">
                        Add translations for non-English languages. English uses the color name.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="color-modal-close"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    aria-label="Close"
                    disabled={localeSubmitting}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="color-locale-modal-body">
                  {errors.submit ? <div className="form-error">{errors.submit}</div> : null}
                  {fetchingDetail ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      Loading...
                    </div>
                  ) : (
                    <>
                      <div className="color-locale-subject">
                        <span
                          className="color-locale-subject-swatch"
                          style={{ background: formData.hexCode }}
                        />
                        <div className="color-locale-subject-meta">
                          <div className="color-locale-subject-label">Color</div>
                          <div className="color-locale-subject-name">
                            {formData.name?.trim() || '—'}
                          </div>
                          <div className="color-locale-subject-hex">{formData.hexCode}</div>
                        </div>
                      </div>

                      <p className="color-locale-hint">
                        Default language (EN) is the color name above. Only add other languages here.
                      </p>

                      <div className="color-locale-fields">
                        <div className="form-group">
                          <label className="form-label" htmlFor="color-locale-language">
                            Language
                          </label>
                          <Select<LangSelectOption, false>
                            inputId="color-locale-language"
                            isSearchable
                            options={localeOptionsForColorModal}
                            value={
                              localeOptionsForColorModal.find(
                                (o) => o.value === localeForm.language
                              ) ??
                              localeLanguageOptions.find((o) => o.value === localeForm.language) ??
                              null
                            }
                            onChange={(opt) => opt && handleColorLocaleLanguageChange(opt.value)}
                            isLoading={localeLanguagesLoading}
                            isDisabled={localeLanguagesLoading || localeSubmitting}
                            placeholder="Select language..."
                            noOptionsMessage={() =>
                              localeLanguagesLoading
                                ? 'Loading...'
                                : localeOptionsForColorModal.length === 0
                                  ? 'No active languages'
                                  : 'No match'
                            }
                            classNamePrefix="lang-select"
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: 42,
                                fontSize: 14,
                                borderRadius: 8,
                                borderColor: '#e2e8f0',
                              }),
                              valueContainer: (base) => ({ ...base, padding: '0 10px' }),
                              menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                            }}
                            menuPortalTarget={
                              typeof document !== 'undefined' ? document.body : undefined
                            }
                            menuPosition="fixed"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="color-locale-name">
                            Local name
                          </label>
                          <input
                            id="color-locale-name"
                            type="text"
                            value={localeForm.name}
                            onChange={(e) =>
                              setLocaleForm((p) => ({ ...p, name: e.target.value }))
                            }
                            className="form-input"
                            placeholder="Name in this language"
                            disabled={localeSubmitting}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="color-locale-list-title">Saved translations</div>
                        <div className="color-locale-list">
                          {colorLocalesApi.length === 0 ? (
                            <div className="color-locale-empty">
                              No translations yet. Choose a language, enter the local name, then
                              save.
                            </div>
                          ) : (
                            colorLocalesApi.map((loc) => {
                              const isActive =
                                editingColorLocaleId != null &&
                                loc.id != null &&
                                editingColorLocaleId === loc.id;
                              return (
                                <div
                                  key={loc.id ?? `${loc.language}-${loc.name}`}
                                  className={`color-locale-row${isActive ? ' is-active' : ''}`}
                                >
                                  <div className="color-locale-row-main">
                                    <span className="color-locale-lang-badge">
                                      {String(loc.language)}
                                    </span>
                                    <span className="color-locale-row-name">{loc.name}</span>
                                  </div>
                                  <div className="color-locale-row-actions">
                                    <ActionTooltip text="Edit">
                                      <button
                                        type="button"
                                        className="btn-icon-edit"
                                        onClick={() =>
                                          handleColorLocaleLanguageChange(String(loc.language))
                                        }
                                        disabled={localeSubmitting}
                                      >
                                        <Edit size={14} />
                                      </button>
                                    </ActionTooltip>
                                    <ActionTooltip text="Remove">
                                      <button
                                        type="button"
                                        className="btn-icon-delete"
                                        onClick={() => handleDeleteColorLocale(String(loc.id))}
                                        disabled={localeSubmitting || !loc.id}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </ActionTooltip>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="color-modal-footer">
                        {editingColorLocaleId ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={localeSubmitting}
                            onClick={() => handleDeleteColorLocale(editingColorLocaleId)}
                          >
                            <Trash2 size={16} />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={localeSubmitting}
                            onClick={() => {
                              setShowAddModal(false);
                              resetForm();
                            }}
                          >
                            Close
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={localeSubmitting || !localeForm.name.trim()}
                          onClick={
                            editingColorLocaleId ? handleUpdateColorLocale : handleAddColorLocale
                          }
                        >
                          <Save size={16} />
                          <span>
                            {localeSubmitting
                              ? 'Saving…'
                              : editingColorLocaleId
                                ? 'Update'
                                : 'Save'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="modal-content color-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="color-modal-title"
              >
                <div className="modal-header color-modal-header">
                  <div className="color-modal-title-row">
                    <span className="color-modal-icon" aria-hidden>
                      <Palette size={18} />
                    </span>
                    <div>
                      <h2 id="color-modal-title">{editingId ? 'Edit Color' : 'Add Color'}</h2>
                      <p className="color-modal-subtitle">
                        {editingId
                          ? 'Update name, hex, or sort order'
                          : 'Define a color for lucky color and UI use'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => {
                      if (submitting) return;
                      setShowAddModal(false);
                      resetForm();
                    }}
                    aria-label="Close"
                    disabled={submitting}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="organization-form color-modal-form">
                  <div className="form-group">
                    <label htmlFor="color-name" className="form-label">
                      Name <span className="required">*</span>
                    </label>
                    <input
                      id="color-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="e.g. Coral"
                      autoFocus
                      disabled={submitting}
                    />
                    {errors.name ? <span className="form-error">{errors.name}</span> : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="color-hex" className="form-label">
                      Hex code <span className="required">*</span>
                    </label>
                    <div className="color-hex-field">
                      <label
                        className="color-swatch-picker"
                        title="Pick a color"
                        style={{
                          backgroundColor: normalizeHex(formData.hexCode).match(/^#[0-9A-Fa-f]{6}$/)
                            ? normalizeHex(formData.hexCode)
                            : '#6366F1',
                        }}
                      >
                        <input
                          type="color"
                          aria-label="Color picker"
                          value={
                            normalizeHex(formData.hexCode).match(/^#[0-9A-Fa-f]{6}$/)
                              ? normalizeHex(formData.hexCode)
                              : '#6366F1'
                          }
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              hexCode: e.target.value.toUpperCase(),
                            }))
                          }
                          disabled={submitting}
                        />
                      </label>
                      <input
                        id="color-hex"
                        name="hexCode"
                        value={formData.hexCode}
                        onChange={handleInputChange}
                        className={`form-input color-hex-input ${errors.hexCode ? 'error' : ''}`}
                        placeholder="#DC2626"
                        spellCheck={false}
                        disabled={submitting}
                      />
                    </div>
                    {errors.hexCode ? <span className="form-error">{errors.hexCode}</span> : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="color-sort" className="form-label">
                      Sort order
                    </label>
                    <input
                      id="color-sort"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      className={`form-input ${errors.sortOrder ? 'error' : ''}`}
                      placeholder="Optional — lower numbers appear first"
                      disabled={submitting}
                    />
                    {errors.sortOrder ? <span className="form-error">{errors.sortOrder}</span> : null}
                  </div>

                  {errors.submit ? <p className="form-error">{errors.submit}</p> : null}

                  <div className="color-modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={submitting}
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      <Save size={16} />
                      <span>{submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
