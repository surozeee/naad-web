'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
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
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { masterService } from '@/app/lib/master.service';
import type { StatusEnum } from '@/app/lib/master.types';

interface LocalUnit {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  localUnitTypeId: string;
  localUnitTypeName: string;
  status: 'active' | 'inactive' | 'deleted';
}

interface DistrictOption {
  id: string;
  name: string;
}

interface LocalUnitTypeOption {
  id: string;
  name: string;
}

function mapApiToLocalUnit(raw: Record<string, unknown>): LocalUnit {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const district = raw.district as Record<string, unknown> | undefined;
  const localUnitType = raw.localUnitType as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    districtId: district ? String(district.id ?? '') : '',
    districtName: district ? String(district.name ?? '') : '',
    localUnitTypeId: localUnitType ? String(localUnitType.id ?? '') : '',
    localUnitTypeName: localUnitType ? String(localUnitType.name ?? '') : '',
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

type SortKey = 'name' | 'districtName' | 'localUnitTypeName' | 'status';

export default function LocalUnitSetup() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailItem, setDetailItem] = useState<LocalUnit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<LocalUnit[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [localUnitTypes, setLocalUnitTypes] = useState<LocalUnitTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.localUnit.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<string, unknown>[];
      setItems(list.map(mapApiToLocalUnit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local units');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const lastFetchKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = searchTerm;
    if (lastFetchKeyRef.current === key) return;
    lastFetchKeyRef.current = key;
    fetchItems();
  }, [fetchItems, searchTerm]);

  const fetchDistricts = useCallback(async () => {
    try {
      const res = await masterService.district.list({ pageNo: 0, pageSize: 500, sortBy: 'name', sortDirection: 'asc' });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<string, unknown>[];
      setDistricts(list.map((r: Record<string, unknown>) => ({ id: String(r.id ?? ''), name: String(r.name ?? '') })));
    } catch {
      setDistricts([]);
    }
  }, []);

  const fetchLocalUnitTypes = useCallback(async () => {
    try {
      const res = await masterService.localUnitType.listActive();
      const raw = res.data;
      const list = Array.isArray(raw) ? (raw as unknown as Record<string, unknown>[]) : [];
      setLocalUnitTypes(list.map((r) => ({ id: String(r.id ?? ''), name: String(r.name ?? '') })));
    } catch {
      setLocalUnitTypes([]);
    }
  }, []);

  useEffect(() => {
    if (showAddModal) {
      fetchDistricts();
      fetchLocalUnitTypes();
    }
  }, [showAddModal, fetchDistricts, fetchLocalUnitTypes]);

  const [formData, setFormData] = useState({ name: '', districtId: '', localUnitTypeId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Local unit name is required';
    if (!formData.districtId) newErrors.districtId = 'District is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    const body = {
      name: formData.name.trim(),
      districtId: formData.districtId || undefined,
      localUnitTypeId: formData.localUnitTypeId || undefined,
    };
    try {
      if (editingId) await masterService.localUnit.update(editingId, body);
      else await masterService.localUnit.create(body);
      await fetchItems();
      setShowAddModal(false);
      resetForm();
      if (detailItem?.id === editingId) {
        const districtName = districts.find((d) => d.id === formData.districtId)?.name ?? detailItem.districtName;
        const typeName = localUnitTypes.find((t) => t.id === formData.localUnitTypeId)?.name ?? detailItem.localUnitTypeName;
        setDetailItem((prev) => (prev ? { ...prev, name: formData.name, districtId: formData.districtId, districtName, localUnitTypeId: formData.localUnitTypeId, localUnitTypeName: typeName } : null));
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', districtId: '', localUnitTypeId: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (item: LocalUnit) => {
    setFormData({ name: item.name, districtId: item.districtId, localUnitTypeId: item.localUnitTypeId || '' });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (item: LocalUnit) => {
    const newStatus: StatusEnum = item.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${item.name}"</strong> to <strong>${newLabel}</strong>?`,
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
      await masterService.localUnit.changeStatus(item.id, newStatus);
      await fetchItems();
      if (detailItem?.id === item.id) setDetailItem((prev) => (prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null));
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Status update failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete local unit?',
      text: 'Are you sure you want to delete this local unit?',
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
      await masterService.localUnit.delete(id);
      await fetchItems();
      if (detailItem?.id === id) setDetailItem(null);
      await Swal.fire({ title: 'Deleted', text: 'Local unit deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
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
    else { setSortBy(key); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children, style }: { columnKey: SortKey; children: React.ReactNode; style?: React.CSSProperties }) => (
    <th role="button" tabIndex={0} onClick={() => handleSort(columnKey)} onKeyDown={(e) => e.key === 'Enter' && handleSort(columnKey)} className="sortable-th" style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 14 }}>
          {sortBy === columnKey ? (sortDirection === 'asc' ? <ChevronUp size={14} color="#2563eb" strokeWidth={2.4} /> : <ChevronDown size={14} color="#2563eb" strokeWidth={2.4} />) : <ArrowUpDown size={14} color="#94a3b8" strokeWidth={1.9} />}
        </span>
      </span>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'Local Unit' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Local Unit Setup</h1>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Local unit setup information" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#334155', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' }}>
                <Info size={18} />
              </button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 260, padding: '10px 12px', borderRadius: 12, border: '1px solid #dbe2ea', background: '#ffffff', color: '#334155', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)', fontSize: 12, lineHeight: 1.5, fontWeight: 500 }}>
                  <div style={{ position: 'absolute', left: -6, top: '50%', width: 10, height: 10, background: '#ffffff', borderLeft: '1px solid #dbe2ea', borderBottom: '1px solid #dbe2ea', transform: 'translateY(-50%) rotate(45deg)' }} />
                  Manage local units (e.g., wards, VDCs) by district and type.
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Local Unit</span>
          </button>
        </div>
        {error && <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>}
        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search local units or district..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="search-input" />
          </div>
        </div>
        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name" style={{ minWidth: 180 }}>Local Unit Name</SortableTh>
                <SortableTh columnKey="districtName">District</SortableTh>
                <SortableTh columnKey="localUnitTypeName">Type</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th style={{ textTransform: 'capitalize' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading local units...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={5} className="empty-state"><p>No local units found</p></td></tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} role="button" tabIndex={0} onClick={() => setDetailItem(item)} onKeyDown={(e) => e.key === 'Enter' && setDetailItem(item)} style={{ cursor: 'pointer' }} className="data-table-row-clickable">
                    <td style={{ minWidth: 180 }}>
                      <div className="org-name-cell"><span className="org-name">{item.name}</span></div>
                    </td>
                    <td>
                      <div className="contact-cell"><MapPin size={14} /><span>{item.districtName || '—'}</span></div>
                    </td>
                    <td><span style={{ color: '#64748b' }}>{item.localUnitTypeName || '—'}</span></td>
                    <td onClick={(e) => { e.stopPropagation(); handleChangeStatus(item); }} role="button" tabIndex={0} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleChangeStatus(item); }} title={`Set to ${item.status === 'active' ? 'Inactive' : 'Active'}`}>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === 'active' && <Check size={14} />}
                        {item.status === 'inactive' && <X size={14} />}
                        {item.status === 'deleted' && <Trash2 size={14} />}
                        <span>{item.status === 'active' ? 'Active' : item.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td style={{ width: 100 }} onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="btn-icon-edit" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}><Edit size={18} /></button>
                        <button className="btn-icon-delete" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}><Trash2 size={18} /></button>
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
                      <label htmlFor="items-per-page" className="pagination-label">Show:</label>
                      <select id="items-per-page" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                      </select>
                      <span className="pagination-label">per page</span>
                    </div>
                    <div className="pagination-info">Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, sorted.length)} of {sorted.length} local units</div>
                    <div className="pagination-controls">
                      <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={18} /><span>Previous</span></button>
                      <div className="pagination-numbers">
                        {singlePage ? (
                          <button type="button" className="pagination-number active" disabled aria-current="page">1</button>
                        ) : (
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                              return (
                                <button key={page} type="button" className={`pagination-number ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? 'page' : undefined}>{page}</button>
                              );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="pagination-ellipsis" aria-hidden>...</span>;
                            return null;
                          })
                        )}
                      </div>
                      <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><span>Next</span><ChevronRight size={18} /></button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {detailItem && (
          <div className="modal-overlay" onClick={() => setDetailItem(null)}>
            <div className="modal-content organization-modal country-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header country-modal-header">
                <h2>Local Unit Detail</h2>
                <button type="button" className="modal-close-btn country-modal-close" onClick={() => setDetailItem(null)} aria-label="Close"><X size={20} /></button>
              </div>
              <div className="organization-form country-detail-form" style={{ gap: '0.5rem' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label"><Layers size={16} /> Name</label>
                    <p style={{ margin: 0, padding: '8px 0', fontWeight: 500 }}>{detailItem.name}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><MapPin size={16} /> District</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailItem.districtName || '—'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailItem.localUnitTypeName || '—'}</p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>
                      <span className={`status-badge ${detailItem.status}`}>
                        {detailItem.status === 'active' && <Check size={14} />}
                        {detailItem.status === 'inactive' && <X size={14} />}
                        {detailItem.status === 'deleted' && <Trash2 size={14} />}
                        <span>{detailItem.status === 'active' ? 'Active' : detailItem.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => setDetailItem(null)}>Close</button>
                  <button type="button" className="btn-primary btn-small" onClick={() => { handleEdit(detailItem); setDetailItem(null); setShowAddModal(true); }}>
                    <Edit size={16} /><span>Edit</span>
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
                <h2>{editingId ? 'Edit Local Unit' : 'Add Local Unit'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Local Unit Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g., Ward 1" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="districtId" className="form-label">District <span className="required">*</span></label>
                  <select id="districtId" name="districtId" value={formData.districtId} onChange={handleInputChange} className={`form-input ${errors.districtId ? 'error' : ''}`}>
                    <option value="">Select district</option>
                    {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {errors.districtId && <span className="form-error">{errors.districtId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="localUnitTypeId" className="form-label">Local Unit Type</label>
                  <select id="localUnitTypeId" name="localUnitTypeId" value={formData.localUnitTypeId} onChange={handleInputChange} className="form-input">
                    <option value="">Select type (optional)</option>
                    {localUnitTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small"><Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
