'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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
  MapPin,
  Flag,
  ImagePlus,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import type { SingleValue, MultiValue } from 'react-select';
import DashboardLayout from '../../../components/DashboardLayout';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { getCroppedImg } from '@/app/lib/crop-image';
import { masterService } from '@/app/lib/master.service';
import type { StatusEnum } from '@/app/lib/master.types';

interface CurrencyOption {
  id: string;
  name: string;
  code: string;
  symbol?: string;
}

interface RegionOption {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  isoCode: string;
  phoneCode: string;
  currency: string;
  currencySymbol: string;
  status: 'active' | 'inactive' | 'deleted';
  isDefault: boolean;
  baseCurrencyId?: string;
  baseCurrencyName?: string;
  currencyIds?: string[];
  supportingCurrencies?: string[];
  regionId?: string;
  flag?: string;
}

function mapApiToCountry(row: Record<string, unknown>): Country {
  const baseCurrency = row.baseCurrency as Record<string, unknown> | undefined;
  const currencies = (row.currencies as unknown as Record<string, unknown>[] | undefined) ?? [];
  const region = row.region as Record<string, unknown> | undefined;
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    code: String((row as { iso2?: string }).iso2 ?? row.code ?? ''),
    isoCode: String((row as { iso3?: string }).iso3 ?? row.isoCode ?? ''),
    phoneCode: String((row as { teleCode?: string }).teleCode ?? row.phoneCode ?? ''),
    currency: baseCurrency ? String(baseCurrency.code ?? baseCurrency.name ?? '') : '',
    currencySymbol: baseCurrency ? String(baseCurrency.symbol ?? '') : '',
    status: (row.status as string)?.toUpperCase() === 'DELETED' ? 'deleted' : (row.status as string)?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
    isDefault: Boolean((row as { isDefault?: boolean }).isDefault ?? row.isDefault ?? false),
    baseCurrencyId: baseCurrency ? String(baseCurrency.id ?? '') : undefined,
    baseCurrencyName: baseCurrency
      ? String(baseCurrency.name ?? baseCurrency.code ?? '')
      : undefined,
    currencyIds: currencies.map((c) => String(c.id ?? '')),
    supportingCurrencies: currencies.map((c) =>
      String(c.name ?? c.code ?? '')
    ),
    regionId: region ? String(region.id ?? '') : undefined,
    flag: (row as { flagUrl?: string }).flagUrl != null ? String((row as { flagUrl?: string }).flagUrl) : (row.flag != null ? String(row.flag) : undefined),
  };
}

export default function CountrySetup() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailCountry, setDetailCountry] = useState<Country | null>(null);
  const [previewFlag, setPreviewFlag] = useState<{ src: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  type SortKey = 'name' | 'code' | 'isoCode' | 'phoneCode' | 'status' | 'isDefault';
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.country.list({
        pageNo: 0,
        pageSize: 10,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? []) as unknown as Record<string, unknown>[];
      setCountries(list.map(mapApiToCountry));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load countries');
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const lastFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchTerm;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchCountries();
  }, [fetchCountries, searchTerm]);

  const [activeCurrencies, setActiveCurrencies] = useState<CurrencyOption[]>([]);
  const [activeRegions, setActiveRegions] = useState<RegionOption[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [regionsLoading, setRegionsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isoCode: '',
    phoneCode: '',
    baseCurrencyId: '',
    currencyIds: [] as string[],
    regionId: '',
    flag: '',
    status: 'active' as 'active' | 'inactive' | 'deleted',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const flagInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Country name is required';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Country code is required';
    } else if (formData.code.length !== 2) {
      newErrors.code = 'Country code must be 2 characters (e.g., NP, US)';
    }
    if (!formData.isoCode.trim()) {
      newErrors.isoCode = 'ISO code is required';
    } else if (formData.isoCode.length !== 3) {
      newErrors.isoCode = 'ISO code must be 3 characters (e.g., NPL, USA)';
    }
    if (!formData.phoneCode.trim()) {
      newErrors.phoneCode = 'Tele code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    try {
      const code = formData.code.trim().toUpperCase();
      const body = {
        name: formData.name.trim(),
        iso3: formData.isoCode.trim().toUpperCase(),
        teleCode: formData.phoneCode.trim(),
        ...(code.length === 2 && { iso2: code }),
        ...(formData.baseCurrencyId && { baseCurrency: formData.baseCurrencyId }),
        ...(formData.regionId && { regionId: formData.regionId }),
        ...(formData.currencyIds.length > 0 && { currencyIds: formData.currencyIds }),
        ...(formData.flag && { flagUrl: formData.flag }),
      };

      if (editingId) {
        await masterService.country.update(editingId, body);
      } else {
        await masterService.country.create(body);
      }
      await fetchCountries();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      isoCode: '',
      phoneCode: '',
      baseCurrencyId: '',
      currencyIds: [],
      regionId: '',
      flag: '',
      status: 'active',
      isDefault: false,
    });
    setErrors({});
    setEditingId(null);
    setCropImageSrc(null);
    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    setCompletedCrop(null);
  };

  const openCropModal = (imageSrc: string) => {
    setCropImageSrc(imageSrc);
    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    setCompletedCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    setErrors((prev) => ({ ...prev, flag: '' }));
  };

  const handleFlagFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, flag: 'Please select an image file (PNG, JPG, etc.)' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      openCropModal(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openFlagFilePicker = () => {
    flagInputRef.current?.click();
  };

  const handleCropApply = async () => {
    if (!cropImageSrc || !imgRef.current) return;
    const cropToUse = completedCrop ?? crop;
    try {
      const cropped = await getCroppedImg(cropToUse, imgRef.current);
      setFormData((prev) => ({ ...prev, flag: cropped }));
      setCropImageSrc(null);
      setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
      setCompletedCrop(null);
    } catch (err) {
      setErrors((prev) => ({ ...prev, flag: 'Failed to process image' }));
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCrop({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
    setCompletedCrop(null);
  };

  const fetchActiveCurrencies = useCallback(async () => {
    setCurrenciesLoading(true);
    try {
      const res = await masterService.currency.listActive();
      const raw = (res as { data?: unknown }).data;
      const list = Array.isArray(raw) ? raw : [];
      setActiveCurrencies(
        list.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ''),
          name: String(row.name ?? ''),
          code: String(row.code ?? ''),
          symbol: row.symbol != null ? String(row.symbol) : undefined,
        }))
      );
    } catch {
      setActiveCurrencies([]);
    } finally {
      setCurrenciesLoading(false);
    }
  }, []);

  const fetchActiveRegions = useCallback(async () => {
    setRegionsLoading(true);
    try {
      const res = await masterService.region.listActive();
      const raw = (res as { data?: unknown }).data;
      const list = Array.isArray(raw) ? raw : [];
      setActiveRegions(
        list.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ''),
          name: String(row.name ?? ''),
        }))
      );
    } catch {
      setActiveRegions([]);
    } finally {
      setRegionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showAddModal) {
      fetchActiveCurrencies();
      fetchActiveRegions();
    }
  }, [showAddModal, fetchActiveCurrencies, fetchActiveRegions]);

  const currencySelectOptions = useMemo(
    () =>
      activeCurrencies.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.code}${c.symbol ? ` ${c.symbol}` : ''})`,
      })),
    [activeCurrencies]
  );

  const regionSelectOptions = useMemo(
    () => activeRegions.map((r) => ({ value: r.id, label: r.name })),
    [activeRegions]
  );

  const baseCurrencySelectValue = useMemo(
    () => currencySelectOptions.find((o) => o.value === formData.baseCurrencyId) ?? null,
    [currencySelectOptions, formData.baseCurrencyId]
  );

  const supportingCurrenciesSelectValue = useMemo(
    () =>
      currencySelectOptions.filter((o) => formData.currencyIds.includes(o.value)),
    [currencySelectOptions, formData.currencyIds]
  );

  const regionSelectValue = useMemo(
    () => regionSelectOptions.find((o) => o.value === formData.regionId) ?? null,
    [regionSelectOptions, formData.regionId]
  );

  const handleEdit = (country: Country) => {
    setFormData({
      name: country.name,
      code: country.code,
      isoCode: country.isoCode,
      phoneCode: country.phoneCode,
      baseCurrencyId: country.baseCurrencyId ?? '',
      currencyIds: country.currencyIds ?? [],
      regionId: country.regionId ?? '',
      flag: country.flag ?? '',
      status: country.status,
      isDefault: country.isDefault,
    });
    setEditingId(country.id);
    setShowAddModal(true);
  };

  const handleOpenFlagPreview = (src: string, name: string) => {
    setPreviewFlag({ src, name });
  };

  const handleChangeStatus = async (country: Country) => {
    const newStatus: StatusEnum = country.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Are you sure you want to set <strong>"${country.name}"</strong> to <strong>${newLabel}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'No',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;
    setError(null);
    try {
      await masterService.country.changeStatus(country.id, newStatus);
      await fetchCountries();
      if (detailCountry?.id === country.id) setDetailCountry(prev => prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null);
      await Swal.fire({ title: 'Updated', text: 'Status updated successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Status update failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete country?',
      text: 'Are you sure you want to delete this country?',
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;
    setError(null);
    try {
      await masterService.country.delete(id);
      await fetchCountries();
      if (detailCountry?.id === id) setDetailCountry(null);
      await Swal.fire({ title: 'Deleted', text: 'Country deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.isoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.phoneCode.includes(searchTerm)
  );

  const sortedCountries = [...filteredCountries].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const aStr = typeof aVal === 'boolean' ? (aVal ? 1 : 0) : String(aVal ?? '').toLowerCase();
    const bStr = typeof bVal === 'boolean' ? (bVal ? 1 : 0) : String(bVal ?? '').toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedCountries.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCountries = sortedCountries.slice(startIndex, endIndex);
  const hasNoData = sortedCountries.length === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children, style }: { columnKey: SortKey; children: React.ReactNode; style?: React.CSSProperties }) => (
    <th
      role="button"
      tabIndex={0}
      onClick={() => handleSort(columnKey)}
      onKeyDown={(e) => e.key === 'Enter' && handleSort(columnKey)}
      className="sortable-th"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 14,
          }}
        >
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
      </span>
    </th>
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <DashboardLayout>
      <div className="organization-page">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Master Setting', href: '/master-setting' },
          { label: 'General', href: '/master-setting/general' },
          { label: 'Country' }
        ]} />

      {/* Page Header */}
      <div className="page-header-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Country Setup</h1>
          </div>
          <div
            style={{ marginTop: -12, position: 'relative' }}
            onMouseEnter={() => setShowInfoTooltip(true)}
            onMouseLeave={() => setShowInfoTooltip(false)}
          >
            <button
              type="button"
              aria-label="Country setup information"
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
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
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
                  width: 250,
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
                <div
                  style={{
                    position: 'absolute',
                    left: -6,
                    top: '50%',
                    width: 10,
                    height: 10,
                    background: '#ffffff',
                    borderLeft: '1px solid #dbe2ea',
                    borderBottom: '1px solid #dbe2ea',
                    transform: 'translateY(-50%) rotate(45deg)',
                  }}
                />
                Configure countries, regions, currency, and tele codes.
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
          <span>Add Country</span>
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search countries by name, code, ISO code, or tele code..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table country-data-table">
          <thead>
            <tr>
              <SortableTh columnKey="name" style={{ minWidth: 220 }}>Country Name</SortableTh>
              <SortableTh columnKey="code">Code</SortableTh>
              <SortableTh columnKey="isoCode">ISO Code</SortableTh>
              <SortableTh columnKey="phoneCode">Tele Code</SortableTh>
              <SortableTh columnKey="status">Status</SortableTh>
              <SortableTh columnKey="isDefault">Default</SortableTh>
              <th style={{ textTransform: 'capitalize' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  Loading countries...
                </td>
              </tr>
            ) : sortedCountries.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <p>No countries found</p>
                </td>
              </tr>
            ) : (
              paginatedCountries.map((country) => (
                <tr
                  key={country.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailCountry(country)}
                  onKeyDown={(e) => e.key === 'Enter' && setDetailCountry(country)}
                  style={{ cursor: 'pointer' }}
                  className="data-table-row-clickable"
                >
                  <td style={{ minWidth: 220 }}>
                    <div className="org-name-cell">
                      {country.flag ? (
                        <button
                          type="button"
                          title="View flag image"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFlagPreview(country.flag as string, country.name);
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            display: 'inline-flex',
                            flexShrink: 0,
                            cursor: 'zoom-in',
                          }}
                        >
                          <img
                            src={country.flag}
                            alt={`${country.name} flag`}
                            style={{
                              width: 24,
                              height: 16,
                              objectFit: 'cover',
                              borderRadius: 3,
                              border: '1px solid #e2e8f0',
                            }}
                          />
                        </button>
                      ) : null}
                      <span className="org-name">{country.name}</span>
                    </div>
                  </td>
                  <td style={{ width: 56 }}>
                    <span className="org-code">{country.code}</span>
                  </td>
                  <td style={{ width: 80 }}>
                    <span className="org-code">{country.isoCode}</span>
                  </td>
                  <td style={{ width: 90 }}>
                    <div className="contact-cell" style={{ color: '#64748b' }}>
                      <MapPin size={14} />
                      <span>{country.phoneCode}</span>
                    </div>
                  </td>
                  <td
                    style={{ width: 90 }}
                    onClick={(e) => { e.stopPropagation(); handleChangeStatus(country); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleChangeStatus(country); }}
                    title={`Set to ${country.status === 'active' ? 'Inactive' : 'Active'}`}
                  >
                    <span className={`status-badge ${country.status}`}>
                      {country.status === 'active' && <Check size={14} />}
                      {country.status === 'inactive' && <X size={14} />}
                      {country.status === 'deleted' && <Trash2 size={14} />}
                      <span>{country.status === 'active' ? 'Active' : country.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                    </span>
                  </td>
                  <td>
                    {country.isDefault ? (
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
                  <td style={{ width: 100 }} onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon-edit" 
                        title="Edit"
                        onClick={(e) => { e.stopPropagation(); handleEdit(country); }}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="btn-icon-delete" 
                        title="Delete"
                        onClick={(e) => { e.stopPropagation(); handleDelete(country.id); }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredCountries.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={7}>
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <label htmlFor="items-per-page" className="pagination-label">
                        Show:
                      </label>
                      <select
                        id="items-per-page"
                        className="pagination-select"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <span className="pagination-label">per page</span>
                    </div>
                    <div className="pagination-info">
                      Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, filteredCountries.length)} of {filteredCountries.length} countries
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                      </button>
                        <div className="pagination-numbers">
                        {singlePage ? (
                          <button type="button" className="pagination-number active" disabled aria-current="page">1</button>
                        ) : (
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                              return (
                                <button
                                  key={page}
                                  type="button"
                                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                  onClick={() => handlePageChange(page)}
                                  aria-current={currentPage === page ? 'page' : undefined}
                                >
                                  {page}
                                </button>
                              );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="pagination-ellipsis" aria-hidden>...</span>;
                            }
                            return null;
                          })
                        )}
                      </div>
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
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
      {/* Country Detail Modal */}
      {detailCountry && (
        <div className="modal-overlay" onClick={() => setDetailCountry(null)}>
          <div className="modal-content organization-modal country-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header country-modal-header">
              <h2>Country Detail</h2>
              <button
                type="button"
                className="modal-close-btn country-modal-close"
                onClick={() => setDetailCountry(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="organization-form country-detail-form" style={{ gap: '0.5rem' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label"><Flag size={16} /> Country Name</label>
                  <p style={{ margin: 0, padding: '8px 0', fontWeight: 500 }}>{detailCountry.name}</p>
                </div>
                {detailCountry.flag && (
                  <div className="form-group">
                    <label className="form-label">Flag</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenFlagPreview(detailCountry.flag as string, detailCountry.name)}
                        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'zoom-in' }}
                      >
                        <img
                          src={detailCountry.flag}
                          alt={`${detailCountry.name} flag`}
                          style={{ width: 64, height: 42, objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: 6 }}
                        />
                      </button>
                    </p>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Code</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{detailCountry.code}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">ISO Code</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{detailCountry.isoCode}</p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><MapPin size={16} /> Tele Code</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{detailCountry.phoneCode}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    <span className={`status-badge ${detailCountry.status}`}>
                      {detailCountry.status === 'active' && <Check size={14} />}
                      {detailCountry.status === 'inactive' && <X size={14} />}
                      {detailCountry.status === 'deleted' && <Trash2 size={14} />}
                      <span>{detailCountry.status === 'active' ? 'Active' : detailCountry.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                    </span>
                  </p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Base Currency</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    {detailCountry.baseCurrencyName || detailCountry.currency || '-'}
                    {detailCountry.currencySymbol ? ` (${detailCountry.currencySymbol})` : ''}
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Supporting Currencies</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    {detailCountry.supportingCurrencies && detailCountry.supportingCurrencies.length > 0
                      ? detailCountry.supportingCurrencies.join(', ')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Default</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    {detailCountry.isDefault ? (
                      <span className="status-badge active"><Check size={14} /> <span>Yes</span></span>
                    ) : (
                      <span className="status-badge inactive"><span>No</span></span>
                    )}
                  </p>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setDetailCountry(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => {
                    handleEdit(detailCountry);
                    setDetailCountry(null);
                    setShowAddModal(true);
                  }}
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewFlag && (
        <div className="modal-overlay" onClick={() => setPreviewFlag(null)}>
          <div
            className="modal-content organization-modal country-crop-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            <div className="modal-header country-modal-header">
              <h2>{previewFlag.name} Flag</h2>
              <button
                type="button"
                className="modal-close-btn country-modal-close"
                onClick={() => setPreviewFlag(null)}
                aria-label="Close image preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="country-crop-modal-body" style={{ paddingBottom: 20 }}>
              <img src={previewFlag.src} alt={`${previewFlag.name} flag`} className="country-crop-image" />
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Country Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content organization-modal country-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header country-modal-header">
              <h2>{editingId ? 'Edit Country' : 'Add Country'}</h2>
              <button
                type="button"
                className="modal-close-btn country-modal-close"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="organization-form country-form">
              {errors.submit && (
                <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>
              )}

              {/* Row 1: Left stack (Name/Code) + Right image */}
              <div className="form-row form-row-name-flag">
                <div className="country-left-stack">
                  <div className="form-group country-name-field">
                    <label htmlFor="name" className="form-label">
                      <Flag size={16} />
                      Country Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="e.g., Nepal, United States"
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="code" className="form-label">Code <span className="required">*</span></label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className={`form-input ${errors.code ? 'error' : ''}`}
                      placeholder="NP, US"
                      maxLength={2}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.code && <span className="form-error">{errors.code}</span>}
                  </div>
                </div>

                <div className="country-right-stack">
                  <div className="form-group country-flag-group">
                    <label htmlFor="flag" className="form-label">
                      <ImagePlus size={16} />
                      Country Flag
                    </label>
                    <div className="country-flag-control">
                      <input
                        id="flag"
                        ref={flagInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFlagFileChange}
                        style={{ display: 'none' }}
                      />
                      {formData.flag ? (
                        <>
                          <div
                            role="button"
                            tabIndex={0}
                            className="country-flag-preview-wrap"
                            onClick={openFlagFilePicker}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openFlagFilePicker();
                              }
                            }}
                            title="Click image to select new file"
                          >
                            <img src={formData.flag} alt="Flag" className="country-flag-preview" />
                            <button
                              type="button"
                              aria-label="Remove image"
                              className="country-flag-remove-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData((prev) => ({ ...prev, flag: '' }));
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button type="button" className="btn-secondary btn-flag-upload" onClick={openFlagFilePicker}>
                          <ImagePlus size={18} />
                          Upload
                        </button>
                      )}
                    </div>
                    {errors.flag && <span className="form-error">{errors.flag}</span>}
                  </div>
                </div>
              </div>

              {/* Row 2: ISO Code + Tele Code (2 columns) */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="isoCode" className="form-label">ISO Code <span className="required">*</span></label>
                  <input
                    type="text"
                    id="isoCode"
                    name="isoCode"
                    value={formData.isoCode}
                    onChange={handleInputChange}
                    className={`form-input ${errors.isoCode ? 'error' : ''}`}
                    placeholder="NPL, USA"
                    maxLength={3}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.isoCode && <span className="form-error">{errors.isoCode}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="phoneCode" className="form-label"><MapPin size={14} /> Tele Code <span className="required">*</span></label>
                  <input
                    type="text"
                    id="phoneCode"
                    name="phoneCode"
                    value={formData.phoneCode}
                    onChange={handleInputChange}
                    className={`form-input ${errors.phoneCode ? 'error' : ''}`}
                    placeholder="+977, +1"
                  />
                  {errors.phoneCode && <span className="form-error">{errors.phoneCode}</span>}
                </div>
              </div>

              {/* Row 3: Base Currency, Region */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="baseCurrencyId" className="form-label">
                    Base Currency
                  </label>
                  <Select<{ value: string; label: string }>
                    inputId="baseCurrencyId"
                    options={currencySelectOptions}
                    value={baseCurrencySelectValue}
                    onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                      setFormData((prev) => ({ ...prev, baseCurrencyId: opt?.value ?? '' }))
                    }
                    isLoading={currenciesLoading}
                    placeholder={currenciesLoading ? 'Loading...' : 'Select base currency'}
                    isClearable
                    isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    classNamePrefix="selectpicker"
                    className="selectpicker-wrapper"
                    noOptionsMessage={() => 'No active currencies found'}
                    styles={{
                      control: (base) => ({ ...base, minHeight: 40 }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="regionId" className="form-label">
                    Region
                  </label>
                  <Select<{ value: string; label: string }>
                    inputId="regionId"
                    options={regionSelectOptions}
                    value={regionSelectValue}
                    onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                      setFormData((prev) => ({ ...prev, regionId: opt?.value ?? '' }))
                    }
                    isLoading={regionsLoading}
                    placeholder={regionsLoading ? 'Loading...' : 'Select region'}
                    isClearable
                    isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    classNamePrefix="selectpicker"
                    className="selectpicker-wrapper"
                    noOptionsMessage={() => 'No active regions found'}
                    styles={{
                      control: (base) => ({ ...base, minHeight: 40 }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group form-group-full">
                  <label htmlFor="currencyIds" className="form-label">
                    Supporting Currencies
                  </label>
                  <Select<{ value: string; label: string }, true>
                    inputId="currencyIds"
                    options={currencySelectOptions}
                    value={supportingCurrenciesSelectValue}
                    onChange={(opts: MultiValue<{ value: string; label: string }>) =>
                      setFormData((prev) => ({
                        ...prev,
                        currencyIds: opts.map((o) => o.value),
                      }))
                    }
                    isLoading={currenciesLoading}
                    placeholder={currenciesLoading ? 'Loading...' : 'Select supporting currencies'}
                    isMulti
                    closeMenuOnSelect={false}
                    isClearable
                    isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    classNamePrefix="selectpicker"
                    className="selectpicker-wrapper"
                    noOptionsMessage={() => 'No active currencies found'}
                    styles={{
                      control: (base) => ({ ...base, minHeight: 40 }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                  />
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
                      Mark this country as default
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : editingId ? 'Update Country' : 'Create Country'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <div className="modal-overlay" onClick={handleCropCancel}>
          <div
            className="modal-content organization-modal country-crop-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640 }}
          >
            <div className="modal-header country-modal-header">
              <h2>Edit Flag Image</h2>
              <button
                type="button"
                className="modal-close-btn country-modal-close"
                onClick={handleCropCancel}
                aria-label="Close crop modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="country-crop-modal-body">
              <ReactCrop
                crop={crop}
                onChange={(c: Crop) => setCrop(c)}
                onComplete={(c: Crop) => setCompletedCrop(c)}
                className="country-react-crop"
              >
                <img
                  ref={imgRef}
                  src={cropImageSrc}
                  alt="Crop country flag"
                  className="country-crop-image"
                />
              </ReactCrop>
            </div>
            <div className="form-actions country-crop-modal-actions">
              <button type="button" className="btn-secondary" onClick={handleCropCancel}>
                Cancel
              </button>
              <button type="button" className="btn-primary btn-small" onClick={handleCropApply}>
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
