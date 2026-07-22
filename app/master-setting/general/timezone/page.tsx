'use client';

import { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
import {
  Plus,
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
  Info,
  Languages,
  Globe,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { ActionTooltip } from '@/app/components/common/ActionTooltip';
import TimezoneMultiLanguageModal from '@/app/components/master-setting/TimezoneMultiLanguageModal';
import { masterService } from '@/app/lib/master.service';
import type { StatusEnum } from '@/app/lib/master.types';
import { formatTimezoneDisplay, TIMEZONE_OPTIONS } from '@/app/lib/timezone-options';

interface TimezoneRow {
  id: string;
  name: string;
  code: string;
  utcOffset: string;
  status: 'active' | 'inactive' | 'deleted';
}

type SortKey = 'name' | 'code' | 'utcOffset' | 'status';

function mapApiToTimezone(raw: Record<string, unknown>): TimezoneRow {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    utcOffset: String(raw.utcOffset ?? ''),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

export default function TimezoneSetupPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailItem, setDetailItem] = useState<TimezoneRow | null>(null);
  const [translationsTimezone, setTranslationsTimezone] = useState<TimezoneRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<TimezoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({ name: '', code: '', utcOffset: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.timezone.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<
        string,
        unknown
      >[];
      setItems(Array.isArray(list) ? list.map(mapApiToTimezone) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timezones');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Timezone is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!formData.utcOffset.trim()) newErrors.utcOffset = 'UTC offset is required';
    else if (!/^[Zz]|[+-]\d{1,2}:\d{2}$/.test(formData.utcOffset.trim())) {
      newErrors.utcOffset = 'Use format +05:45, -08:00, or Z';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', utcOffset: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setErrors({});
    const body = {
      name: formData.name,
      code: formData.code.trim(),
      utcOffset: formData.utcOffset.trim(),
    };
    try {
      if (editingId) await masterService.timezone.update(editingId, body);
      else await masterService.timezone.create(body);
      await fetchItems();
      setShowAddModal(false);
      resetForm();
      await Swal.fire({
        title: editingId ? 'Updated' : 'Created',
        text: editingId ? 'Timezone updated.' : 'Timezone created.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: TimezoneRow) => {
    setFormData({ name: item.name, code: item.code, utcOffset: item.utcOffset });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (item: TimezoneRow) => {
    const newStatus: StatusEnum = item.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${formatTimezoneDisplay(item.name)}"</strong> to <strong>${newLabel}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'No',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: 'var(--naad-fg-muted)',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.timezone.changeStatus(item.id, newStatus);
      await fetchItems();
      if (detailItem?.id === item.id) {
        setDetailItem((prev) =>
          prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null
        );
      }
      await Swal.fire({
        title: 'Updated',
        text: 'Status updated.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
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
      title: 'Delete timezone?',
      text: 'Are you sure you want to delete this timezone?',
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: 'var(--naad-fg-muted)',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.timezone.delete(id);
      await fetchItems();
      if (detailItem?.id === id) setDetailItem(null);
      await Swal.fire({
        title: 'Deleted',
        text: 'Timezone deleted.',
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

  const sorted = [...items].sort((a, b) => {
    const aStr = String(a[sortBy] ?? '').toLowerCase();
    const bStr = String(b[sortBy] ?? '').toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = sorted.slice(startIndex, endIndex);
  const hasNoData = sorted.length === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({
    columnKey,
    children,
  }: {
    columnKey: SortKey;
    children: React.ReactNode;
  }) => (
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
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 14 }}>
          {sortBy === columnKey ? (
            sortDirection === 'asc' ? (
              <ChevronUp size={14} color="var(--naad-primary)" strokeWidth={2.4} />
            ) : (
              <ChevronDown size={14} color="var(--naad-primary)" strokeWidth={2.4} />
            )
          ) : (
            <ArrowUpDown size={14} color="var(--naad-fg-muted)" strokeWidth={1.9} />
          )}
        </span>
      </span>
    </th>
  );

  const nameOptions = (() => {
    const byValue = new Map(TIMEZONE_OPTIONS.map((o) => [o.value, o]));
    items.forEach((tz) => {
      if (tz.name && !byValue.has(tz.name)) {
        byValue.set(tz.name, { value: tz.name, label: formatTimezoneDisplay(tz.name) });
      }
    });
    return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
  })();

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb
          items={[
            { label: 'Master Setting', href: '/master-setting' },
            { label: 'General', href: '/master-setting/general' },
            { label: 'Timezone' },
          ]}
        />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>
                Timezone
              </h1>
            </div>
            <div
              style={{ marginTop: -12, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="Timezone information"
                style={{
                  border: '1px solid #cbd5e1',
                  background: 'var(--naad-bg-muted)',
                  padding: 2,
                  borderRadius: 999,
                  cursor: 'help',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--naad-fg-muted)',
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
                    background: 'var(--naad-card-bg)',
                    color: 'var(--naad-fg-muted)',
                    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  Manage IANA timezones (enum name, code, UTC offset) and multi-language labels.
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
            <span>Add Timezone</span>
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
            <Globe size={20} />
            <input
              type="text"
              placeholder="Search by name or code..."
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
                <SortableTh columnKey="name">Name</SortableTh>
                <SortableTh columnKey="code">Code</SortableTh>
                <SortableTh columnKey="utcOffset">UTC Offset</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th style={{ textTransform: 'capitalize' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--naad-fg-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <p>No timezones found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((tz) => (
                  <tr
                    key={tz.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailItem(tz)}
                    onKeyDown={(e) => e.key === 'Enter' && setDetailItem(tz)}
                    style={{ cursor: 'pointer' }}
                    className="data-table-row-clickable"
                  >
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{formatTimezoneDisplay(tz.name)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="org-code">{tz.code}</span>
                    </td>
                    <td>
                      <span className="org-code" style={{ fontFamily: 'monospace' }}>
                        {tz.utcOffset}
                      </span>
                    </td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleChangeStatus(tz);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') void handleChangeStatus(tz);
                      }}
                      title={`Set to ${tz.status === 'active' ? 'Inactive' : 'Active'}`}
                    >
                      <span className={`status-badge ${tz.status}`}>
                        {tz.status === 'active' && <Check size={14} />}
                        {tz.status === 'inactive' && <X size={14} />}
                        {tz.status === 'deleted' && <Trash2 size={14} />}
                        <span>
                          {tz.status === 'active'
                            ? 'Active'
                            : tz.status === 'deleted'
                              ? 'Deleted'
                              : 'Inactive'}
                        </span>
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <ActionTooltip text="Multi-language labels">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            aria-label="Multi-language labels"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTranslationsTimezone(tz);
                            }}
                          >
                            <Languages size={18} />
                          </button>
                        </ActionTooltip>
                        <button
                          className="btn-icon-edit"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(tz);
                          }}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-icon-delete"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(tz.id);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <label htmlFor="items-per-page" className="pagination-label">
                        Show:
                      </label>
                      <select
                        id="items-per-page"
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
                      Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, sorted.length)} of{' '}
                      {sorted.length}
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
                        {singlePage ? (
                          <button type="button" className="pagination-number active" disabled aria-current="page">
                            1
                          </button>
                        ) : (
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                                  aria-current={currentPage === page ? 'page' : undefined}
                                >
                                  {page}
                                </button>
                              );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <span key={page} className="pagination-ellipsis" aria-hidden>
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })
                        )}
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
          </table>
        </div>

        {detailItem && (
          <div className="modal-overlay" onClick={() => setDetailItem(null)}>
            <div
              className="modal-content organization-modal"
              style={{ maxWidth: 480 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Timezone Detail</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setDetailItem(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="organization-form" style={{ gap: '0.5rem' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <p style={{ margin: 0, padding: '8px 0', fontWeight: 500 }}>
                      {formatTimezoneDisplay(detailItem.name)}
                    </p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailItem.code}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">UTC Offset</label>
                    <p style={{ margin: 0, padding: '8px 0', fontFamily: 'monospace' }}>
                      {detailItem.utcOffset}
                    </p>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setDetailItem(null)}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    onClick={() => {
                      handleEdit(detailItem);
                      setDetailItem(null);
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

        {showAddModal && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Timezone' : 'Add Timezone'}</h2>
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
                {errors.submit && (
                  <div className="form-error" style={{ marginBottom: '1rem' }}>
                    {errors.submit}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="timezone-name" className="form-label">
                    Name <span className="required">*</span>
                  </label>
                  <Select<{ value: string; label: string }>
                    inputId="timezone-name"
                    options={nameOptions}
                    value={nameOptions.find((o) => o.value === formData.name) ?? null}
                    onChange={(opt) => {
                      const value = opt?.value ?? '';
                      const display = formatTimezoneDisplay(value);
                      let code = formData.code;
                      let utcOffset = formData.utcOffset;
                      if (!editingId && value) {
                        const last = display.includes('/') ? display.split('/').pop() ?? display : display;
                        code = last.replace(/_/g, ' ');
                        try {
                          const parts = new Intl.DateTimeFormat('en-US', {
                            timeZone: display.includes('/') ? display : 'UTC',
                            timeZoneName: 'longOffset',
                          }).formatToParts(new Date());
                          const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
                          // GMT+5:45 / UTC / GMT
                          if (/^GMT$/i.test(raw) || /^UTC$/i.test(raw)) utcOffset = 'Z';
                          else {
                            const m = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
                            if (m) {
                              const hh = m[2].padStart(2, '0');
                              const mm = (m[3] ?? '00').padStart(2, '0');
                              utcOffset = `${m[1]}${hh}:${mm}`;
                            }
                          }
                        } catch {
                          /* keep previous offset */
                        }
                      }
                      setFormData((p) => ({ ...p, name: value, code, utcOffset }));
                      if (errors.name) setErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="Select timezone..."
                    isSearchable
                    isClearable={false}
                    classNamePrefix="selectpicker"
                    className="selectpicker-wrapper"
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: 42,
                        borderColor: errors.name ? '#dc2626' : base.borderColor,
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="code" className="form-label">
                      Code <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className={`form-input ${errors.code ? 'error' : ''}`}
                      placeholder="Kathmandu"
                      maxLength={64}
                    />
                    {errors.code && <span className="form-error">{errors.code}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="utcOffset" className="form-label">
                      UTC Offset <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="utcOffset"
                      name="utcOffset"
                      value={formData.utcOffset}
                      onChange={handleInputChange}
                      className={`form-input ${errors.utcOffset ? 'error' : ''}`}
                      placeholder="+05:45"
                      maxLength={6}
                    />
                    {errors.utcOffset && <span className="form-error">{errors.utcOffset}</span>}
                    <small
                      style={{
                        color: 'var(--naad-fg-muted)',
                        fontSize: '0.75rem',
                        marginTop: 4,
                        display: 'block',
                      }}
                    >
                      Format: +05:45, -08:00, or Z
                    </small>
                  </div>
                </div>
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
                    <span>{editingId ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <TimezoneMultiLanguageModal
          open={Boolean(translationsTimezone)}
          timezoneId={translationsTimezone?.id ?? ''}
          timezoneName={translationsTimezone?.name ?? ''}
          timezoneCode={translationsTimezone?.code ?? ''}
          onClose={() => setTranslationsTimezone(null)}
        />
      </div>
    </DashboardLayout>
  );
}
