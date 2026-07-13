'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Select from 'react-select';
import {
  Languages,
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
  Globe,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { ActionTooltip } from '@/app/components/common/ActionTooltip';
import { masterService, languageLocaleApi } from '@/app/lib/master.service';
import type { LanguageLocaleResponse, LanguageRequest, StatusEnum } from '@/app/lib/master.types';

interface LanguageRow {
  id: string;
  name: string;
  code: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  status: 'active' | 'inactive' | 'deleted';
  isDefault: boolean;
  locales: LanguageLocaleResponse[];
}

type SortKey = 'name' | 'code' | 'nativeName' | 'direction' | 'status' | 'isDefault';
type LangSelectOption = { value: string; label: string };

/** Suggested display names: master language code → UI language → name (EN omitted). */
const LANGUAGE_LOCALE_FALLBACK: Record<string, Record<string, string>> = {
  EN: { NE: 'अंग्रेजी', HI: 'अंग्रेज़ी' },
  NE: { NE: 'नेपाली', HI: 'नेपाली' },
  HI: { NE: 'हिन्दी', HI: 'हिन्दी' },
};

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

function mapApiLocales(raw: unknown): LanguageLocaleResponse[] {
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

function localesSummary(locales: LanguageLocaleResponse[]): string {
  if (!locales.length) return '—';
  return locales.map((l) => `${l.language}: ${l.name}`).join(' · ');
}

function defaultLocaleName(uiLanguage: string, masterCode: string, englishName: string): string {
  const ui = uiLanguage.toUpperCase();
  const code = masterCode.toUpperCase();
  if (ui === 'EN') return englishName;
  return LANGUAGE_LOCALE_FALLBACK[code]?.[ui] ?? '';
}

function mapApiToLanguage(raw: Record<string, unknown>): LanguageRow {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const directionRaw = String(raw.direction ?? 'LTR').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? '').trim().toUpperCase(),
    nativeName: String(raw.nativeName ?? raw.name ?? ''),
    direction: directionRaw === 'RTL' ? 'rtl' : 'ltr',
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
    isDefault: Boolean(raw.isDefault),
    locales: mapApiLocales(raw.locales),
  };
}

export default function LanguageSetupPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nativeName: '',
    direction: 'ltr' as 'ltr' | 'rtl',
    isDefault: false,
  });
  const [localeOnlyMode, setLocaleOnlyMode] = useState(false);
  const [languageLocalesApi, setLanguageLocalesApi] = useState<LanguageLocaleResponse[]>([]);
  const [editingLanguageLocaleId, setEditingLanguageLocaleId] = useState<string | null>(null);
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

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.language.list({
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
      setLanguages(Array.isArray(list) ? list.map(mapApiToLanguage) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load languages');
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const lastFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchTerm;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchLanguages();
  }, [fetchLanguages, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      nativeName: '',
      direction: 'ltr',
      isDefault: false,
    });
    setErrors({});
    setEditingId(null);
    setLocaleOnlyMode(false);
    setLanguageLocalesApi([]);
    setEditingLanguageLocaleId(null);
    setLocaleForm({ language: 'NE', name: '' });
    setFetchingDetail(false);
  };

  const localeOptionsForLanguageModal = useMemo(() => {
    return localeLanguageOptions;
  }, [localeLanguageOptions]);

  const handleLanguageLocaleLanguageChange = (language: string) => {
    const code = normalizeLanguageEnumCode(language) ?? language.toUpperCase();
    if (code === 'EN') return;
    const existing = languageLocalesApi.find((l) => String(l.language).toUpperCase() === code);
    if (existing?.id) {
      setEditingLanguageLocaleId(existing.id);
      setLocaleForm({ language: code, name: existing.name });
      return;
    }
    setEditingLanguageLocaleId(null);
    setLocaleForm({
      language: code,
      name: defaultLocaleName(code, formData.code, formData.name),
    });
  };

  const refreshLanguageLocales = async (languageId: string) => {
    const list = (await languageLocaleApi.getByLanguageId(languageId)).filter(
      (l) => String(l.language).toUpperCase() !== 'EN'
    );
    setLanguageLocalesApi(list);
    return list;
  };

  const handleAddLanguageLocale = async () => {
    if (!editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      const addedLang = localeForm.language;
      await languageLocaleApi.create({
        languageId: editingId,
        language: normalizeLanguageEnumCode(localeForm.language) ?? localeForm.language.toUpperCase(),
        name: localeForm.name.trim(),
      });
      const list = await refreshLanguageLocales(editingId);
      const opts = localeLanguageOptionsRef.current;
      const savedCodes = new Set(list.map((l) => String(l.language).toUpperCase()));
      const nextMissing = opts.find((o) => !savedCodes.has(o.value));
      if (nextMissing) {
        setEditingLanguageLocaleId(null);
        setLocaleForm({
          language: nextMissing.value,
          name: defaultLocaleName(nextMissing.value, formData.code, formData.name),
        });
      } else {
        const match =
          list.find((l) => String(l.language).toUpperCase() === addedLang.toUpperCase()) ?? list[0];
        if (match?.id) {
          setEditingLanguageLocaleId(match.id);
          setLocaleForm({ language: String(match.language), name: match.name });
        }
      }
      lastFetchKeyRef.current = null;
      await fetchLanguages();
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

  const handleUpdateLanguageLocale = async () => {
    if (!editingLanguageLocaleId || !editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      await languageLocaleApi.update(editingLanguageLocaleId, {
        languageId: editingId,
        language: normalizeLanguageEnumCode(localeForm.language) ?? localeForm.language.toUpperCase(),
        name: localeForm.name.trim(),
      });
      await refreshLanguageLocales(editingId);
      lastFetchKeyRef.current = null;
      await fetchLanguages();
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

  const handleDeleteLanguageLocale = async (localeId: string) => {
    const result = await Swal.fire({
      title: 'Remove translation?',
      text: 'This removes the localized language name for that language.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
    });
    if (!result.isConfirmed || !editingId) return;
    setLocaleSubmitting(true);
    try {
      await languageLocaleApi.delete(localeId);
      const list = await refreshLanguageLocales(editingId);
      const first = list[0];
      if (first?.id) {
        setEditingLanguageLocaleId(first.id);
        setLocaleForm({ language: String(first.language), name: first.name });
      } else {
        setEditingLanguageLocaleId(null);
        setLocaleForm({
          language: localeLanguageOptions[0]?.value ?? 'NE',
          name: defaultLocaleName(
            localeLanguageOptions[0]?.value ?? 'NE',
            formData.code,
            formData.name
          ),
        });
      }
      lastFetchKeyRef.current = null;
      await fetchLanguages();
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

    const saved = new Set(languageLocalesApi.map((l) => String(l.language).toUpperCase()));
    const firstMissing = localeLanguageOptions.find((o) => !saved.has(o.value));

    if (firstMissing && !editingLanguageLocaleId) {
      setLocaleForm((prev) => {
        if (prev.language === firstMissing.value && !saved.has(prev.language.toUpperCase())) {
          return prev;
        }
        if (prev.language && !saved.has(prev.language.toUpperCase())) {
          if (localeLanguageOptions.some((o) => o.value === prev.language)) return prev;
        }
        return {
          language: firstMissing.value,
          name: defaultLocaleName(firstMissing.value, formData.code, formData.name),
        };
      });
      return;
    }

    if (!firstMissing && languageLocalesApi.length > 0 && !editingLanguageLocaleId) {
      const first = languageLocalesApi[0];
      if (first?.id) {
        setEditingLanguageLocaleId(first.id);
        setLocaleForm({ language: String(first.language), name: first.name });
      }
    }
  }, [
    localeLanguageOptions,
    localeOnlyMode,
    showAddModal,
    languageLocalesApi,
    editingLanguageLocaleId,
    formData.code,
    formData.name,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const nextValue =
      type === 'checkbox' ? checked : name === 'code' ? String(value).toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = 'Language name is required';
    if (!formData.code.trim()) next.code = 'Language code is required';
    else if (formData.code.length < 2 || formData.code.length > 3) {
      next.code = 'Language code must be 2–3 characters (ISO 639-1 / LanguageEnum, e.g. EN, NE, HI)';
    }
    if (!formData.nativeName.trim()) next.nativeName = 'Native name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);

    const body: LanguageRequest = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      nativeName: formData.nativeName.trim(),
      direction: formData.direction === 'rtl' ? 'RTL' : 'LTR',
      isDefault: formData.isDefault,
    };

    try {
      if (editingId) {
        await masterService.language.update(editingId, body);
      } else {
        await masterService.language.create(body);
      }
      lastFetchKeyRef.current = null;
      await fetchLanguages();
      setShowAddModal(false);
      resetForm();
      await Swal.fire({
        title: editingId ? 'Updated' : 'Created',
        text: editingId ? 'Language updated successfully.' : 'Language created successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : 'Operation failed. Check that code matches a backend LanguageEnum value (EN, NE, HI, …).',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (language: LanguageRow, openLocales = false) => {
    setErrors({});
    setFormData({
      name: language.name,
      code: language.code,
      nativeName: language.nativeName,
      direction: language.direction,
      isDefault: language.isDefault,
    });
    setEditingId(language.id);
    setShowAddModal(true);
    setLocaleOnlyMode(openLocales);
    if (!openLocales) {
      setLanguageLocalesApi([]);
      setEditingLanguageLocaleId(null);
      setLocaleForm({ language: 'NE', name: '' });
      return;
    }
    setFetchingDetail(true);
    try {
      const raw =
        language.locales?.length > 0
          ? language.locales
          : await languageLocaleApi.getByLanguageId(language.id);
      const list = raw.filter((l) => String(l.language).toUpperCase() !== 'EN');
      setLanguageLocalesApi(list);
      setEditingLanguageLocaleId(null);
      setLocaleForm({
        language: 'NE',
        name: defaultLocaleName('NE', language.code, language.name),
      });
    } catch {
      setLanguageLocalesApi([]);
      setEditingLanguageLocaleId(null);
      setLocaleForm({
        language: 'NE',
        name: defaultLocaleName('NE', language.code, language.name),
      });
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleChangeStatus = async (language: LanguageRow) => {
    const newStatus: StatusEnum = language.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${language.name}"</strong> to <strong>${newLabel}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.language.changeStatus(language.id, newStatus);
      lastFetchKeyRef.current = null;
      await fetchLanguages();
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Status update failed',
        icon: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete language?',
      text: 'Are you sure you want to delete this language?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.language.delete(id);
      lastFetchKeyRef.current = null;
      await fetchLanguages();
      await Swal.fire({
        title: 'Deleted',
        text: 'Language deleted successfully.',
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

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      localesSummary(lang.locales).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLanguages = [...filteredLanguages].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const aStr = typeof aVal === 'boolean' ? (aVal ? 1 : 0) : String(aVal ?? '').toLowerCase();
    const bStr = typeof bVal === 'boolean' ? (bVal ? 1 : 0) : String(bVal ?? '').toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedLanguages.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLanguages = sortedLanguages.slice(startIndex, endIndex);

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
            { label: 'Language' },
          ]}
        />

        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Language Setup
            </h1>
            <div
              style={{ marginTop: -6, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="Language setup information"
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
                  Manage languages, ISO codes, default locale, and{' '}
                  <strong>multi-language labels</strong>. Code must match backend{' '}
                  <code>LanguageEnum</code> (EN, NE, HI, …). English is the default name on the
                  language row.
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
            <span>Add Language</span>
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
              placeholder="Search by name, code, native name, or locales..."
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
                <SortableTh columnKey="name">Language Name</SortableTh>
                <SortableTh columnKey="code">Code</SortableTh>
                <SortableTh columnKey="nativeName">Native Name</SortableTh>
                <th>Locales</th>
                <SortableTh columnKey="direction">Direction</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <SortableTh columnKey="isDefault">Default</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    Loading languages...
                  </td>
                </tr>
              ) : sortedLanguages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <p>No languages found</p>
                  </td>
                </tr>
              ) : (
                paginatedLanguages.map((language) => (
                  <tr key={language.id}>
                    <td>
                      <div className="org-name-cell">
                        <div className="org-name">{language.name}</div>
                      </div>
                    </td>
                    <td>
                      <span className="org-code">{language.code}</span>
                    </td>
                    <td>
                      <span style={{ color: '#64748b', fontSize: '1rem' }}>{language.nativeName}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#475569' }} title={localesSummary(language.locales)}>
                        {localesSummary(language.locales)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: language.direction === 'rtl' ? '#fef3c715' : '#dbeafe15',
                          color: language.direction === 'rtl' ? '#f59e0b' : '#3b82f6',
                          borderColor: language.direction === 'rtl' ? '#f59e0b40' : '#3b82f640',
                        }}
                      >
                        <Globe size={14} />
                        <span>{language.direction.toUpperCase()}</span>
                      </span>
                    </td>
                    <td
                      onClick={() => handleChangeStatus(language)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleChangeStatus(language)}
                      title={`Set to ${language.status === 'active' ? 'Inactive' : 'Active'}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className={`status-badge ${language.status}`}>
                        {language.status === 'active' ? <Check size={14} /> : <X size={14} />}
                        <span>
                          {language.status === 'active'
                            ? 'Active'
                            : language.status === 'deleted'
                              ? 'Deleted'
                              : 'Inactive'}
                        </span>
                      </span>
                    </td>
                    <td>
                      {language.isDefault ? (
                        <span className="status-badge active">
                          <Check size={14} />
                          <span>Default</span>
                        </span>
                      ) : (
                        <span className="status-badge inactive">
                          <span>-</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <ActionTooltip text="Edit">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={() => handleEdit(language)}
                          >
                            <Edit size={18} />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text="Multi-language labels">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={() => handleEdit(language, true)}
                            disabled={fetchingDetail}
                          >
                            <Languages size={18} />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text="Delete">
                          <button
                            type="button"
                            className="btn-icon-delete"
                            onClick={() => handleDelete(language.id)}
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
            {!loading && filteredLanguages.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={8}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-language" className="pagination-label">
                          Show:
                        </label>
                        <select
                          id="items-per-page-language"
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
                          <option value={100}>100</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredLanguages.length)} of{' '}
                        {filteredLanguages.length} languages
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
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  type="button"
                                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </button>
                              );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <span key={page} className="pagination-ellipsis">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
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
                aria-labelledby="language-locale-modal-title"
              >
                <div className="color-modal-header">
                  <div className="color-modal-title-row">
                    <span className="color-modal-icon" aria-hidden>
                      <Languages size={18} />
                    </span>
                    <div>
                      <h2 id="language-locale-modal-title">Multi-language labels</h2>
                      <p className="color-modal-subtitle">
                        Add translations for non-English languages. English uses the language name.
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
                          style={{
                            background: '#eff6ff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb',
                            borderRadius: 10,
                            width: 36,
                            height: 36,
                          }}
                        >
                          <Globe size={18} />
                        </span>
                        <div className="color-locale-subject-meta">
                          <div className="color-locale-subject-label">Language</div>
                          <div className="color-locale-subject-name">
                            {formData.name?.trim() || '—'}
                          </div>
                          <div className="color-locale-subject-hex">
                            {formData.code}
                            {formData.nativeName ? ` · ${formData.nativeName}` : ''}
                          </div>
                        </div>
                      </div>

                      <p className="color-locale-hint">
                        Default language (EN) is the language name above. Only add other languages
                        here.
                      </p>

                      <div className="color-locale-fields">
                        <div className="form-group">
                          <label className="form-label" htmlFor="language-locale-language">
                            Language
                          </label>
                          <Select<LangSelectOption, false>
                            inputId="language-locale-language"
                            isSearchable
                            options={localeOptionsForLanguageModal}
                            value={
                              localeOptionsForLanguageModal.find(
                                (o) => o.value === localeForm.language
                              ) ??
                              localeLanguageOptions.find((o) => o.value === localeForm.language) ??
                              null
                            }
                            onChange={(opt) => opt && handleLanguageLocaleLanguageChange(opt.value)}
                            isLoading={localeLanguagesLoading}
                            isDisabled={localeLanguagesLoading || localeSubmitting}
                            placeholder="Select language..."
                            noOptionsMessage={() =>
                              localeLanguagesLoading
                                ? 'Loading...'
                                : localeOptionsForLanguageModal.length === 0
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
                          <label className="form-label" htmlFor="language-locale-name">
                            Local name
                          </label>
                          <input
                            id="language-locale-name"
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
                          {languageLocalesApi.length === 0 ? (
                            <div className="color-locale-empty">
                              No translations yet. Choose a language, enter the local name, then
                              save.
                            </div>
                          ) : (
                            languageLocalesApi.map((loc) => {
                              const isActive =
                                editingLanguageLocaleId != null &&
                                loc.id != null &&
                                editingLanguageLocaleId === loc.id;
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
                                          handleLanguageLocaleLanguageChange(String(loc.language))
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
                                        onClick={() => handleDeleteLanguageLocale(String(loc.id))}
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
                        {editingLanguageLocaleId ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={localeSubmitting}
                            onClick={() => handleDeleteLanguageLocale(editingLanguageLocaleId)}
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
                            editingLanguageLocaleId
                              ? handleUpdateLanguageLocale
                              : handleAddLanguageLocale
                          }
                        >
                          <Save size={16} />
                          <span>
                            {localeSubmitting
                              ? 'Saving…'
                              : editingLanguageLocaleId
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
                className="modal-content organization-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>{editingId ? 'Edit Language' : 'Add New Language'}</h2>
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="organization-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        <Languages size={16} />
                        Language Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        placeholder="e.g., English, Nepali, Hindi"
                        autoFocus
                      />
                      {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="code" className="form-label">
                        Language Code (ISO 639-1) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className={`form-input ${errors.code ? 'error' : ''}`}
                        placeholder="e.g., EN, NE, HI, AR"
                        maxLength={3}
                        style={{ textTransform: 'uppercase' }}
                      />
                      {errors.code && <span className="form-error">{errors.code}</span>}
                      <small
                        style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4, display: 'block' }}
                      >
                        Must match backend LanguageEnum (EN, NE, HI, …)
                      </small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nativeName" className="form-label">
                        Native Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="nativeName"
                        name="nativeName"
                        value={formData.nativeName}
                        onChange={handleInputChange}
                        className={`form-input ${errors.nativeName ? 'error' : ''}`}
                        placeholder="e.g., English, नेपाली, हिन्दी, العربية"
                      />
                      {errors.nativeName && <span className="form-error">{errors.nativeName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="direction" className="form-label">
                        <Globe size={16} />
                        Text Direction <span className="required">*</span>
                      </label>
                      <select
                        id="direction"
                        name="direction"
                        value={formData.direction}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        <option value="ltr">Left to Right (LTR)</option>
                        <option value="rtl">Right to Left (RTL)</option>
                      </select>
                      <small
                        style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4, display: 'block' }}
                      >
                        RTL for Arabic, Hebrew, etc.
                      </small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="isDefault" className="form-label">
                        Set as Default
                      </label>
                      <div className="checkbox-wrapper">
                        <input
                          type="checkbox"
                          id="isDefault"
                          name="isDefault"
                          checked={formData.isDefault}
                          onChange={handleInputChange}
                          className="form-checkbox"
                        />
                        <label htmlFor="isDefault" className="checkbox-label">
                          Mark this language as default
                        </label>
                      </div>
                    </div>
                  </div>

                  {errors.submit && <div className="form-error">{errors.submit}</div>}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                      <Save size={16} />
                      <span>
                        {submitting ? 'Saving…' : editingId ? 'Update Language' : 'Create Language'}
                      </span>
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
