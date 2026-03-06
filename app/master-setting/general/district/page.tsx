'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
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
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../../components/DashboardLayout';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { masterService } from '@/app/lib/master.service';
import type { StatusEnum } from '@/app/lib/master.types';

interface StateOption {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  code: string;
  stateId: string;
  stateName: string;
  countryId: string;
  countryName: string;
  status: 'active' | 'inactive';
}

function mapApiToDistrict(raw: Record<string, unknown>): District {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const state = raw.state as Record<string, unknown> | undefined;
  const country = (state?.country ?? raw.country) as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    stateId: state ? String(state.id ?? '') : '',
    stateName: state ? String(state.name ?? '') : '',
    countryId: country ? String(country.id ?? '') : '',
    countryName: country ? String(country.name ?? '') : '',
    status: statusVal === 'ACTIVE' ? 'active' : 'inactive',
  };
}

type SortKey = 'name' | 'code' | 'stateName' | 'countryName' | 'status';

export default function DistrictSetup() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailDistrict, setDetailDistrict] = useState<District | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [stateSearchResults, setStateSearchResults] = useState<StateOption[]>([]);
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);

  const fetchDistricts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.district.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<string, unknown>[];
      setDistricts(list.map(mapApiToDistrict));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load districts');
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const lastFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchTerm;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchDistricts();
  }, [fetchDistricts, searchTerm]);

  const fetchStates = useCallback(async (searchKey: string) => {
    setStatesLoading(true);
    try {
      const res = await masterService.state.list({
        pageNo: 0,
        pageSize: 50,
        sortBy: 'name',
        sortDirection: 'asc',
        searchKey: searchKey.trim() || undefined,
      });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<string, unknown>[];
      setStateSearchResults(
        list.map((raw) => ({
          id: String(raw.id ?? ''),
          name: String(raw.name ?? ''),
        }))
      );
    } catch (e) {
      console.error('Failed to fetch states:', e);
      setStateSearchResults([]);
    } finally {
      setStatesLoading(false);
    }
  }, []);

  const stateSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!showAddModal) return;
    if (stateSearchDebounceRef.current) clearTimeout(stateSearchDebounceRef.current);
    stateSearchDebounceRef.current = setTimeout(() => {
      fetchStates(stateSearchQuery);
      stateSearchDebounceRef.current = null;
    }, 300);
    return () => {
      if (stateSearchDebounceRef.current) clearTimeout(stateSearchDebounceRef.current);
    };
  }, [showAddModal, stateSearchQuery, fetchStates]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    stateId: '',
    stateName: '',
    countryId: '',
    countryName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'District name is required';
    if (!formData.stateId.trim()) newErrors.stateId = 'State is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    const status: StatusEnum = editingId && detailDistrict
      ? (detailDistrict.status === 'active' ? 'ACTIVE' : 'INACTIVE')
      : 'ACTIVE';
    const body = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      stateId: formData.stateId,
      status,
    };
    try {
      if (editingId) {
        await masterService.district.update(editingId, body);
      } else {
        await masterService.district.create(body);
      }
      await fetchDistricts();
      setShowAddModal(false);
      resetForm();
      if (detailDistrict && (detailDistrict.id === editingId)) {
        setDetailDistrict((prev) => (prev ? { ...prev, ...formData } : null));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      stateId: '',
      stateName: '',
      countryId: '',
      countryName: '',
    });
    setErrors({});
    setEditingId(null);
    setStateSearchQuery('');
    setStateDropdownOpen(false);
  };

  const handleEdit = (district: District) => {
    setFormData({
      name: district.name,
      code: district.code,
      stateId: district.stateId,
      stateName: district.stateName,
      countryId: district.countryId,
      countryName: district.countryName,
    });
    setEditingId(district.id);
    setStateSearchQuery(district.stateName);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (district: District) => {
    const newStatus: StatusEnum = district.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${district.name}"</strong> to <strong>${newLabel}</strong>?`,
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
      await masterService.district.changeStatus(district.id, newStatus);
      await fetchDistricts();
      if (detailDistrict?.id === district.id) {
        setDetailDistrict((prev) => (prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null));
      }
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Status update failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete district?',
      text: 'Are you sure you want to delete this district?',
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
      await masterService.district.delete(id);
      await fetchDistricts();
      if (detailDistrict?.id === id) setDetailDistrict(null);
      await Swal.fire({ title: 'Deleted', text: 'District deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const sortedDistricts = [...districts].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const aStr = String(aVal ?? '').toLowerCase();
    const bStr = String(bVal ?? '').toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedDistricts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDistricts = sortedDistricts.slice(startIndex, endIndex);
  const hasNoData = sortedDistricts.length === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({
    columnKey,
    children,
    style,
  }: {
    columnKey: SortKey;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => (
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
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 14 }}>
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
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Master Setting', href: '/master-setting' }, { label: 'General', href: '/master-setting/general' }, { label: 'District' }]} />

        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>
                District Setup
              </h1>
            </div>
            <div
              style={{ marginTop: -12, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="District setup information"
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
                    width: 260,
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
                  Manage districts and their associated state and country.
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
            <span>Add District</span>
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
              placeholder="Search districts by name, code, state, or country..."
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
                <SortableTh columnKey="name" style={{ minWidth: 180 }}>
                  District Name
                </SortableTh>
                <SortableTh columnKey="code">Code</SortableTh>
                <SortableTh columnKey="stateName">State</SortableTh>
                <SortableTh columnKey="countryName">Country</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th style={{ textTransform: 'capitalize' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    Loading districts...
                  </td>
                </tr>
              ) : sortedDistricts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <p>No districts found</p>
                  </td>
                </tr>
              ) : (
                paginatedDistricts.map((district) => (
                  <tr
                    key={district.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailDistrict(district)}
                    onKeyDown={(e) => e.key === 'Enter' && setDetailDistrict(district)}
                    style={{ cursor: 'pointer' }}
                    className="data-table-row-clickable"
                  >
                    <td style={{ minWidth: 180 }}>
                      <div className="org-name-cell">
                        <span className="org-name">{district.name}</span>
                      </div>
                    </td>
                    <td style={{ width: 80 }}>
                      <span className="org-code">{district.code}</span>
                    </td>
                    <td style={{ width: 140 }}>
                      <div className="contact-cell">
                        <MapPin size={14} />
                        <span>{district.stateName}</span>
                      </div>
                    </td>
                    <td style={{ width: 140 }}>
                      <div className="contact-cell">
                        <Flag size={14} />
                        <span>{district.countryName}</span>
                      </div>
                    </td>
                    <td
                      style={{ width: 90 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeStatus(district);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') handleChangeStatus(district);
                      }}
                      title={`Set to ${district.status === 'active' ? 'Inactive' : 'Active'}`}
                    >
                      <span className={`status-badge ${district.status}`}>
                        {district.status === 'active' ? <Check size={14} /> : <X size={14} />}
                        <span>{district.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td style={{ width: 100 }} onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button
                          className="btn-icon-edit"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(district);
                          }}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          className="btn-icon-delete"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(district.id);
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
                  <td colSpan={6}>
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
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, sortedDistricts.length)} of {sortedDistricts.length} districts
                      </div>
                      <div className="pagination-controls">
                        <button
                          type="button"
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
                          type="button"
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
          </table>
        </div>

        {detailDistrict && (
          <div className="modal-overlay" onClick={() => setDetailDistrict(null)}>
            <div
              className="modal-content organization-modal country-modal"
              style={{ maxWidth: 560 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header country-modal-header">
                <h2>District Detail</h2>
                <button
                  type="button"
                  className="modal-close-btn country-modal-close"
                  onClick={() => setDetailDistrict(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="organization-form country-detail-form" style={{ gap: '0.5rem' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">
                      <Layers size={16} />
                      District Name
                    </label>
                    <p style={{ margin: 0, padding: '8px 0', fontWeight: 500 }}>{detailDistrict.name}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailDistrict.code}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin size={16} /> State
                    </label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailDistrict.stateName}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Flag size={16} /> Country
                    </label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailDistrict.countryName}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>
                      <span className={`status-badge ${detailDistrict.status}`}>
                        {detailDistrict.status === 'active' ? <Check size={14} /> : <X size={14} />}
                        <span>{detailDistrict.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setDetailDistrict(null)}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    onClick={() => {
                      handleEdit(detailDistrict);
                      setDetailDistrict(null);
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
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit District' : 'Add District'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && (
                  <div className="form-error" style={{ marginBottom: '1rem' }}>
                    {errors.submit}
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      District Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      placeholder="Enter district name"
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="code" className="form-label">
                      District Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className={`form-input ${errors.code ? 'error' : ''}`}
                      placeholder="Enter district code (optional)"
                    />
                    {errors.code && <span className="form-error">{errors.code}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="state-search" className="form-label">
                    <MapPin size={16} /> State <span className="required">*</span>
                  </label>
                  <input
                    id="state-search"
                    type="text"
                    autoComplete="off"
                    value={stateDropdownOpen ? stateSearchQuery : (formData.stateName || stateSearchQuery)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStateSearchQuery(v);
                      setStateDropdownOpen(true);
                      if (v !== formData.stateName) setFormData((prev) => ({ ...prev, stateId: '', stateName: '' }));
                    }}
                    onFocus={() => setStateDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setStateDropdownOpen(false), 200)}
                    placeholder={statesLoading ? 'Loading...' : 'Type to search state'}
                    className={`form-input ${errors.stateId ? 'error' : ''}`}
                    disabled={statesLoading}
                  />
                  {stateDropdownOpen && (
                    <ul
                      className="dropdown-list"
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: '100%',
                        marginTop: 4,
                        maxHeight: 220,
                        overflowY: 'auto',
                        background: 'var(--bg-primary, #fff)',
                        border: '1px solid var(--border-color, #e5e7eb)',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 50,
                        listStyle: 'none',
                        padding: 4,
                      }}
                    >
                      {stateSearchResults.length === 0 ? (
                        <li style={{ padding: '10px 12px', color: 'var(--text-secondary, #6b7280)' }}>
                          {statesLoading ? 'Loading...' : 'No states found'}
                        </li>
                      ) : (
                        stateSearchResults.map((s) => (
                          <li
                            key={s.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData((prev) => ({ ...prev, stateId: s.id, stateName: s.name }));
                              setStateSearchQuery(s.name);
                              setStateDropdownOpen(false);
                            }}
                            style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 6 }}
                            className="dropdown-option"
                          >
                            {s.name}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  {errors.stateId && <span className="form-error">{errors.stateId}</span>}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary btn-small">
                    <Save size={16} />
                    <span>{editingId ? 'Update District' : 'Create District'}</span>
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
