'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Select from 'react-select';
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
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { PageHeaderWithInfo } from '../../components/common/PageHeaderWithInfo';
import { ActionTooltip } from '../../components/common/ActionTooltip';
import { zodiacSignApi, zodiacSignLocaleApi } from '@/app/lib/crm.service';
import type {
  ZodiacSignRequest,
  ZodiacSignEnum,
  ZodiacSignLocaleResponse,
  ZodiacSignResponse,
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

type ZodiacLangSelectOption = { value: string; label: string };

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

function mapApiLocales(raw: unknown): ZodiacSignLocaleResponse[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => {
    const o = x as Record<string, unknown>;
    return {
      id: o.id != null ? String(o.id) : undefined,
      language: String(o.language ?? 'EN'),
      name: String(o.name ?? ''),
      startingName: o.startingName != null ? String(o.startingName) : undefined,
    };
  });
}

function localesSummary(locales: ZodiacSignLocaleResponse[]): string {
  if (!locales.length) return '—';
  return (
    locales
      .filter((l) => l.name?.trim())
      .map((l) => `${l.language}: ${l.name}`)
      .join(' · ') || '—'
  );
}

function mapApiToItem(raw: ZodiacSignResponse): ZodiacSignItem {
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
  const [logoImageBase64, setLogoImageBase64] = useState<string | null>(null);
  const [logoPreviewDataUrl, setLogoPreviewDataUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [filterZodiacSign, setFilterZodiacSign] = useState<string>('');
  const [sortKey, setSortKey] = useState<'name' | 'startingName' | 'daysRange' | 'zodiacSign' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [submitting, setSubmitting] = useState(false);

  const [localeOnlyMode, setLocaleOnlyMode] = useState(false);
  const [zodiacLocalesApi, setZodiacLocalesApi] = useState<ZodiacSignLocaleResponse[]>([]);
  const [editingZodiacLocaleId, setEditingZodiacLocaleId] = useState<string | null>(null);
  const [localeForm, setLocaleForm] = useState<{ language: string; name: string; startingName: string }>({
    language: 'EN',
    name: '',
    startingName: '',
  });
  const [localeLanguageOptions, setLocaleLanguageOptions] = useState<ZodiacLangSelectOption[]>([]);
  const [localeLanguagesLoading, setLocaleLanguagesLoading] = useState(false);
  const [localeSubmitting, setLocaleSubmitting] = useState(false);
  const localeLanguageOptionsRef = useRef<ZodiacLangSelectOption[]>([]);
  localeLanguageOptionsRef.current = localeLanguageOptions;

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
      const list = (res.result ?? res.content ?? []) as ZodiacSignResponse[];
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

  const refreshZodiacLocales = useCallback(async (): Promise<ZodiacSignLocaleResponse[]> => {
    if (!editingId) return [];
    try {
      const list = await zodiacSignLocaleApi.getByZodiacSignId(editingId);
      setZodiacLocalesApi(list);
      return list;
    } catch {
      setZodiacLocalesApi([]);
      return [];
    }
  }, [editingId]);

  const syncZodiacHeaderFromGetById = useCallback(async () => {
    if (!editingId) return;
    try {
      const res = await zodiacSignApi.getById(editingId);
      const d = res.data as ZodiacSignResponse | undefined;
      if (!d) return;
      setFormData((prev) => ({
        ...prev,
        name: String(d.name ?? prev.name),
        startingName: d.startingName != null ? String(d.startingName) : prev.startingName,
      }));
    } catch {
      /* keep */
    }
  }, [editingId]);

  const handleZodiacLocaleLanguageChange = (language: string) => {
    const existing = zodiacLocalesApi.find((l) => String(l.language).toUpperCase() === language.toUpperCase());
    if (existing) {
      setEditingZodiacLocaleId(String(existing.id));
      setLocaleForm({
        language: String(existing.language),
        name: existing.name ?? '',
        startingName: existing.startingName ?? '',
      });
    } else {
      setEditingZodiacLocaleId(null);
      setLocaleForm({ language, name: '', startingName: '' });
    }
  };

  const zodiacLocaleMissingOptions = useMemo(() => {
    const saved = new Set(zodiacLocalesApi.map((l) => String(l.language).toUpperCase()));
    return localeLanguageOptions.filter((o) => !saved.has(o.value));
  }, [zodiacLocalesApi, localeLanguageOptions]);

  const localeOptionsForZodiacModal = useMemo(() => {
    if (!editingZodiacLocaleId) {
      return zodiacLocaleMissingOptions;
    }
    const cur = localeLanguageOptions.find((o) => o.value === localeForm.language);
    if (zodiacLocaleMissingOptions.length === 0) {
      return cur ? [cur] : [];
    }
    const order: ZodiacLangSelectOption[] = [];
    if (cur) order.push(cur);
    for (const o of zodiacLocaleMissingOptions) {
      if (o.value !== cur?.value) order.push(o);
    }
    return order;
  }, [editingZodiacLocaleId, localeForm.language, localeLanguageOptions, zodiacLocaleMissingOptions]);

  const zodiacLocaleLanguageSelectLocked =
    Boolean(editingZodiacLocaleId) && zodiacLocaleMissingOptions.length === 0;

  const zodiacInfoSubtitle = useMemo(() => {
    return ZODIAC_SIGN_OPTIONS.find((o) => o.value === formData.zodiacSign)?.label ?? formData.zodiacSign;
  }, [formData.zodiacSign]);

  const handleAddZodiacLocale = async () => {
    if (!editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      const addedLang = localeForm.language;
      const created = await zodiacSignLocaleApi.create({
        zodiacSignId: editingId,
        language: localeForm.language,
        name: localeForm.name.trim(),
        startingName: localeForm.startingName.trim() || undefined,
      });
      const list = await refreshZodiacLocales();
      await fetchItems();
      await syncZodiacHeaderFromGetById();

      const opts = localeLanguageOptionsRef.current;
      const savedCodes = new Set(list.map((l) => String(l.language).toUpperCase()));
      const nextMissing = opts.find((o) => !savedCodes.has(o.value));
      if (nextMissing) {
        setEditingZodiacLocaleId(null);
        setLocaleForm({ language: nextMissing.value, name: '', startingName: '' });
      } else {
        const match =
          list.find((l) => String(l.language).toUpperCase() === addedLang.toUpperCase()) ??
          (created?.id ? list.find((l) => String(l.id) === String(created.id)) : undefined);
        if (match) {
          setEditingZodiacLocaleId(String(match.id));
          setLocaleForm({
            language: String(match.language),
            name: match.name ?? '',
            startingName: match.startingName ?? '',
          });
        }
      }

      await Swal.fire({ title: 'Saved', text: 'Translation saved.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed to add translation', icon: 'error' });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleUpdateZodiacLocale = async () => {
    if (!editingZodiacLocaleId || !editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      await zodiacSignLocaleApi.update(editingZodiacLocaleId, {
        zodiacSignId: editingId,
        language: localeForm.language,
        name: localeForm.name.trim(),
        startingName: localeForm.startingName.trim() || undefined,
      });
      await refreshZodiacLocales();
      await fetchItems();
      await syncZodiacHeaderFromGetById();
      await Swal.fire({ title: 'Updated', text: 'Translation updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed to update', icon: 'error' });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleDeleteZodiacLocale = async (localeId: string) => {
    const result = await Swal.fire({
      title: 'Remove translation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    setLocaleSubmitting(true);
    try {
      await zodiacSignLocaleApi.delete(localeId);
      const list = await refreshZodiacLocales();
      await fetchItems();
      await syncZodiacHeaderFromGetById();
      const first = list[0];
      if (first) {
        setEditingZodiacLocaleId(String(first.id));
        setLocaleForm({
          language: String(first.language),
          name: first.name ?? '',
          startingName: first.startingName ?? '',
        });
      } else {
        setEditingZodiacLocaleId(null);
        setLocaleForm({ language: localeLanguageOptions[0]?.value ?? 'EN', name: '', startingName: '' });
      }
      await Swal.fire({ title: 'Removed', text: 'Translation removed.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showAddModal || !localeOnlyMode || !editingId) return;
    setLocaleLanguagesLoading(true);
    masterService.language
      .listActive()
      .then((res: { data?: unknown }) => {
        const raw = res?.data;
        const arr = Array.isArray(raw) ? raw : [];
        const options = arr
          .map((item: Record<string, unknown>) => {
            const code = String(item.code ?? item.name ?? '').toUpperCase();
            const name = String(item.name ?? item.code ?? code);
            return code ? { value: code, label: `${name} (${code})` } : null;
          })
          .filter((o): o is ZodiacLangSelectOption => o != null);
        setLocaleLanguageOptions(options);
      })
      .catch(() => setLocaleLanguageOptions([]))
      .finally(() => setLocaleLanguagesLoading(false));
  }, [showAddModal, localeOnlyMode, editingId]);

  useEffect(() => {
    if (!localeOnlyMode || !showAddModal) return;
    setLocaleForm((prev) => {
      if (localeLanguageOptions.length === 0) return prev;
      if (!prev.language && localeLanguageOptions[0]) return { ...prev, language: localeLanguageOptions[0].value };
      if (prev.language && !localeLanguageOptions.some((o) => o.value === prev.language) && localeLanguageOptions[0])
        return { ...prev, language: localeLanguageOptions[0].value };
      if (!editingZodiacLocaleId && prev.language) {
        const saved = new Set(zodiacLocalesApi.map((l) => String(l.language).toUpperCase()));
        if (saved.has(prev.language.toUpperCase())) {
          const firstMissing = localeLanguageOptions.find((o) => !saved.has(o.value));
          if (firstMissing) return { ...prev, language: firstMissing.value, name: '', startingName: '' };
        }
      }
      return prev;
    });
  }, [localeLanguageOptions, localeOnlyMode, showAddModal, zodiacLocalesApi, editingZodiacLocaleId]);

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
    };
    if (logoImageBase64) {
      body.logoImageBase64 = logoImageBase64;
    } else if (formData.logoUrl?.trim()) {
      body.logoUrl = formData.logoUrl.trim();
    }
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', zodiacSign: 'ARIES', description: '', logoUrl: '', startingName: '', daysRange: '' });
    setLogoImageBase64(null);
    setLogoPreviewDataUrl(null);
    setErrors({});
    setEditingId(null);
    setFetchingDetail(false);
    setLocaleOnlyMode(false);
    setZodiacLocalesApi([]);
    setEditingZodiacLocaleId(null);
    setLocaleForm({ language: 'EN', name: '', startingName: '' });
    setLocaleLanguageOptions([]);
    setLocaleLanguagesLoading(false);
    setLocaleSubmitting(false);
  };

  const handleEdit = async (row: ZodiacSignItem, openLocaleOnly = false) => {
    setErrors({});
    setFetchingDetail(true);
    setShowAddModal(true);
    setEditingId(row.id);
    setLocaleOnlyMode(openLocaleOnly);
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
      setLogoImageBase64(null);
      setLogoPreviewDataUrl(null);

      if (openLocaleOnly) {
        try {
          const list = await zodiacSignLocaleApi.getByZodiacSignId(row.id);
          setZodiacLocalesApi(list);
          const first = list[0];
          if (first) {
            setEditingZodiacLocaleId(String(first.id));
            setLocaleForm({
              language: String(first.language),
              name: first.name ?? '',
              startingName: first.startingName ?? '',
            });
          } else {
            setEditingZodiacLocaleId(null);
            setLocaleForm({ language: 'EN', name: '', startingName: '' });
          }
        } catch {
          setZodiacLocalesApi([]);
          setEditingZodiacLocaleId(null);
          setLocaleForm({ language: 'EN', name: '', startingName: '' });
        }
      }
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
          infoText="Manage zodiac signs. Use Multi-language labels to add per-language name and starting name (same pattern as Horoscope Scope)."
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
                <th>Logo</th>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={8} className="empty-state">
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
                        <ActionTooltip text="Multi-language labels">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={() => handleEdit(row, true)}
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
                  <td colSpan={8}>
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
            {localeOnlyMode ? (
              <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: '92vw' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                  className="organization-form"
                  style={{ margin: 0 }}
                >
                  <div className="modal-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.35rem', margin: 0, flex: '1 1 auto' }}>
                      <Languages size={24} />
                      Multi-language labels
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Language</label>
                      <div style={{ minWidth: 140, width: 160 }}>
                        <Select<ZodiacLangSelectOption, false>
                          isSearchable
                          options={localeOptionsForZodiacModal}
                          value={
                            localeOptionsForZodiacModal.find((o) => o.value === localeForm.language) ??
                            localeLanguageOptions.find((o) => o.value === localeForm.language) ??
                            null
                          }
                          onChange={(opt) => opt && handleZodiacLocaleLanguageChange(opt.value)}
                          isLoading={localeLanguagesLoading}
                          isDisabled={localeLanguagesLoading || localeSubmitting || zodiacLocaleLanguageSelectLocked}
                          placeholder="Search language..."
                          noOptionsMessage={() => (localeLanguagesLoading ? 'Loading...' : localeOptionsForZodiacModal.length === 0 ? 'No languages' : 'No match')}
                          classNamePrefix="lang-select"
                          styles={{
                            control: (base) => ({ ...base, minHeight: 32, fontSize: 13 }),
                            valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                            input: (base) => ({ ...base, fontSize: 13 }),
                            singleValue: (base) => ({ ...base, fontSize: 13 }),
                            indicatorsContainer: (base) => ({ ...base, paddingRight: 4 }),
                            menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                          }}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          menuPosition="fixed"
                        />
                      </div>
                      <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }} aria-label="Close">
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                    {fetchingDetail ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                    ) : (
                      <>
                        <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Zodiac sign</div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{formData.name?.trim() || '—'}</div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{zodiacInfoSubtitle}</div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Local name</label>
                          <input
                            type="text"
                            value={localeForm.name}
                            onChange={(e) => setLocaleForm((p) => ({ ...p, name: e.target.value }))}
                            className="form-input"
                            placeholder="Name in this language"
                            style={{ minHeight: 44, fontSize: 15 }}
                            disabled={localeSubmitting}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                          <label className="form-label">Local starting name</label>
                          <input
                            type="text"
                            value={localeForm.startingName}
                            onChange={(e) => setLocaleForm((p) => ({ ...p, startingName: e.target.value }))}
                            className="form-input"
                            placeholder="Optional"
                            disabled={localeSubmitting}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                          <button
                            type="button"
                            className="btn-primary btn-small"
                            style={{ minHeight: 42, padding: '10px 20px' }}
                            disabled={localeSubmitting || !localeForm.name.trim()}
                            onClick={editingZodiacLocaleId ? handleUpdateZodiacLocale : handleAddZodiacLocale}
                          >
                            <Save size={16} />
                            <span>{editingZodiacLocaleId ? 'Update' : 'Save'}</span>
                          </button>
                          {editingZodiacLocaleId && (
                            <button
                              type="button"
                              className="btn-secondary btn-small"
                              style={{ minHeight: 42 }}
                              disabled={localeSubmitting}
                              onClick={() => handleDeleteZodiacLocale(editingZodiacLocaleId)}
                            >
                              <Trash2 size={16} />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Saved translations</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {zodiacLocalesApi.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#64748b', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                              No translations yet. Select a language above, enter Local name, and click Save.
                            </div>
                          ) : (
                            zodiacLocalesApi.map((loc) => (
                              <div
                                key={loc.id ?? `${loc.language}-${loc.name}`}
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
                                  <span style={{ fontWeight: 600, color: '#475569', minWidth: 36 }}>{String(loc.language)}</span>
                                  <span style={{ color: '#0f172a' }}>{loc.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <ActionTooltip text="Edit">
                                    <button
                                      type="button"
                                      className="btn-icon-edit"
                                      onClick={() => handleZodiacLocaleLanguageChange(String(loc.language))}
                                      disabled={localeSubmitting}
                                    >
                                      <Edit size={14} />
                                    </button>
                                  </ActionTooltip>
                                  <ActionTooltip text="Remove">
                                    <button
                                      type="button"
                                      className="btn-icon-delete"
                                      onClick={() => handleDeleteZodiacLocale(String(loc.id))}
                                      disabled={localeSubmitting}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </ActionTooltip>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="form-actions" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => { setShowAddModal(false); resetForm(); }}
                            style={{ minHeight: 42 }}
                            disabled={localeSubmitting}
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </form>
              </div>
            ) : (
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
                  <p style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                    Per-language labels are managed with the <strong>Languages</strong> action on each row after save.
                  </p>
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
                    <button type="submit" className="btn-primary btn-small" disabled={fetchingDetail || submitting}>
                      <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
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
