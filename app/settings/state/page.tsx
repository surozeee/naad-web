'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MapPin,
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
  Flag,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { masterService } from '@/app/lib/master.service';
import type { StatusEnum } from '@/app/lib/master.types';

interface State {
  id: string;
  name: string;
  countryId: string;
  countryName: string;
  status: 'active' | 'inactive' | 'deleted';
}

interface CountryOption {
  id: string;
  name: string;
}

function mapApiToState(raw: Record<string, unknown>): State {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const country = raw.country as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    countryId: country ? String(country.id ?? '') : '',
    countryName: country ? String(country.name ?? '') : '',
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

export default function StateSetup() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailState, setDetailState] = useState<State | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  type SortKey = 'name' | 'countryName' | 'status';
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.state.list({
        pageNo: 0,
        pageSize: 10,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? []) as unknown as Record<string, unknown>[];
      setStates(list.map(mapApiToState));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load states');
      setStates([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const lastFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchTerm;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchStates();
  }, [fetchStates, searchTerm]);

  const fetchActiveCountries = useCallback(async () => {
    setCountriesLoading(true);
    try {
      const res = await masterService.country.listActive();
      const raw = (res as { data?: unknown }).data;
      const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'result' in (raw as object))
        ? (raw as { result: unknown[] }).result
        : [];
      setCountries(
        (list as Record<string, unknown>[]).map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ''),
          name: String(row.name ?? ''),
        }))
      );
    } catch {
      setCountries([]);
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showAddModal) fetchActiveCountries();
  }, [showAddModal, fetchActiveCountries]);

  const [formData, setFormData] = useState({
    name: '',
    countryId: '',
    countryName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'countryId') {
        const opt = countries.find((c) => c.id === value);
        next.countryName = opt ? opt.name : '';
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'State name is required';
    if (!formData.countryId.trim()) newErrors.countryId = 'Country is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    const body = {
      name: formData.name.trim(),
      countryId: formData.countryId || undefined,
    };
    try {
      if (editingId) {
        await masterService.state.update(editingId, body);
      } else {
        await masterService.state.create(body);
      }
      await fetchStates();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', countryId: '', countryName: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (state: State) => {
    setFormData({
      name: state.name,
      countryId: state.countryId,
      countryName: state.countryName,
    });
    setEditingId(state.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (state: State) => {
    const newStatus: StatusEnum = state.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Are you sure you want to set <strong>"${state.name}"</strong> to <strong>${newLabel}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    setError(null);
    try {
      await masterService.state.changeStatus(state.id, newStatus);
      await fetchStates();
      await Swal.fire({ title: 'Updated', text: 'Status updated successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Status update failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete state?',
      text: 'Are you sure you want to delete this state?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    setError(null);
    try {
      await masterService.state.delete(id);
      await fetchStates();
      await Swal.fire({ title: 'Deleted', text: 'State deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const countrySelectOptions = useMemo(
    () => countries.map((c) => ({ value: c.id, label: c.name })),
    [countries]
  );
  const countrySelectValue = useMemo(() => {
    if (!formData.countryId) return null;
    const opt = countrySelectOptions.find((o) => o.value === formData.countryId);
    return opt ?? { value: formData.countryId, label: formData.countryName || formData.countryId };
  }, [formData.countryId, formData.countryName, countrySelectOptions]);

  const handleCountryChange = (option: SingleValue<{ value: string; label: string }>) => {
    if (option) {
      setFormData((prev) => ({ ...prev, countryId: option.value, countryName: option.label }));
    } else {
      setFormData((prev) => ({ ...prev, countryId: '', countryName: '' }));
    }
    if (errors.countryId) setErrors((prev) => ({ ...prev, countryId: '' }));
  };

  const filteredStates = states.filter(
    (state) =>
      state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.countryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStates = [...filteredStates].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const aStr = String(aVal ?? '').toLowerCase();
    const bStr = String(bVal ?? '').toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedStates.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStates = sortedStates.slice(startIndex, endIndex);
  const hasNoData = sortedStates.length === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDirection('asc'); }
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
        <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'Country', href: '/settings/country' }, { label: 'State' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>State Setup</h1>
            </div>
            <div
              style={{ marginTop: -6, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="State setup information"
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
                    width: 230,
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
                  Manage and configure states for the system.
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add State</span>
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search states by name or country..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">State Name</SortableTh>
                <SortableTh columnKey="countryName">Country</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading states...</td>
                </tr>
              ) : sortedStates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    <p>No states found</p>
                  </td>
                </tr>
              ) : (
                paginatedStates.map((state) => (
                  <tr
                    key={state.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailState(state)}
                    onKeyDown={(e) => e.key === 'Enter' && setDetailState(state)}
                    className="data-table-row-clickable"
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{state.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <Flag size={14} />
                        <span>{state.countryName}</span>
                      </div>
                    </td>
                    <td
                      onClick={(e) => { e.stopPropagation(); handleChangeStatus(state); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleChangeStatus(state); }}
                      title={`Set to ${state.status === 'active' ? 'Inactive' : 'Active'}`}
                    >
                      <span className={`status-badge ${state.status}`}>
                        {state.status === 'active' && <Check size={14} />}
                        {state.status === 'inactive' && <X size={14} />}
                        {state.status === 'deleted' && <Trash2 size={14} />}
                        <span>{state.status === 'active' ? 'Active' : state.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="btn-icon-edit" title="Edit" onClick={() => handleEdit(state)}>
                          <Edit size={18} />
                        </button>
                        <button className="btn-icon-delete" title="Delete" onClick={() => handleDelete(state.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredStates.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-state" className="pagination-label">Show:</label>
                        <select
                          id="items-per-page-state"
                          className="pagination-select"
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, filteredStates.length)} of {filteredStates.length} states
                      </div>
                      <div className="pagination-controls">
                        <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                          <ChevronLeft size={18} /><span>Previous</span>
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
                                    onClick={() => setCurrentPage(page)}
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
                        <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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

        {detailState && (
          <div className="modal-overlay" onClick={() => setDetailState(null)}>
            <div className="modal-content organization-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>State Detail</h2>
                <button className="modal-close-btn" onClick={() => setDetailState(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="organization-form" style={{ gap: '0.5rem' }}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label"><MapPin size={16} /> State Name</label>
                    <p style={{ margin: 0, padding: '8px 0', fontWeight: 500 }}>{detailState.name}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Flag size={16} /> Country</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailState.countryName}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>
                      <span className={`status-badge ${detailState.status}`}>
                        {detailState.status === 'active' && <Check size={14} />}
                        {detailState.status === 'inactive' && <X size={14} />}
                        {detailState.status === 'deleted' && <Trash2 size={14} />}
                        <span>{detailState.status === 'active' ? 'Active' : detailState.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" className="btn-secondary" onClick={() => setDetailState(null)}>Close</button>
                  <button type="button" className="btn-primary btn-small" onClick={() => { handleEdit(detailState); setDetailState(null); setShowAddModal(true); }}>
                    <Edit size={16} /><span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" style={{ maxWidth: 560, width: '92vw' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit State' : 'Add New State'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">State Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter state name"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="countryId" className="form-label"><Flag size={16} /> Country <span className="required">*</span></label>
                  <Select
                    inputId="countryId"
                    options={countrySelectOptions}
                    value={countrySelectValue}
                    onChange={handleCountryChange}
                    isLoading={countriesLoading}
                    placeholder={countriesLoading ? 'Loading countries...' : 'Select Country'}
                    isClearable
                    isSearchable
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    classNamePrefix="selectpicker"
                    className={errors.countryId ? 'selectpicker-wrapper error' : 'selectpicker-wrapper'}
                    noOptionsMessage={() => 'No countries found'}
                    styles={{
                      control: (base) => ({ ...base, minHeight: 46, height: 46, borderColor: errors.countryId ? '#dc2626' : base.borderColor }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                  />
                  {errors.countryId && <span className="form-error">{errors.countryId}</span>}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                    <Save size={16} /><span>{submitting ? 'Saving...' : editingId ? 'Update State' : 'Create State'}</span>
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
