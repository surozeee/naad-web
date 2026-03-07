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
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../../components/DashboardLayout';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { masterService } from '@/app/lib/master.service';
import type { StatusEnum } from '@/app/lib/master.types';

interface LocalUnitType {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'deleted';
}

function mapApiToLocalUnitType(raw: Record<string, unknown>): LocalUnitType {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

type SortKey = 'name' | 'description' | 'status';

export default function LocalUnitTypeSetup() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailItem, setDetailItem] = useState<LocalUnitType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<LocalUnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.localUnitType.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<string, unknown>[];
      setItems(list.map(mapApiToLocalUnitType));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load local unit types');
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

  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    const body = { name: formData.name.trim(), description: formData.description.trim() || undefined };
    try {
      if (editingId) await masterService.localUnitType.update(editingId, body);
      else await masterService.localUnitType.create(body);
      await fetchItems();
      setShowAddModal(false);
      resetForm();
      if (detailItem?.id === editingId) setDetailItem((prev) => (prev ? { ...prev, ...formData } : null));
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: LocalUnitType) => {
    setFormData({ name: row.name, description: row.description });
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: LocalUnitType) => {
    const newStatus: StatusEnum = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${row.name}"</strong> to <strong>${newLabel}</strong>?`,
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
      await masterService.localUnitType.changeStatus(row.id, newStatus);
      await fetchItems();
      if (detailItem?.id === row.id) setDetailItem((prev) => (prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null));
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Status update failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete local unit type?',
      text: 'Are you sure you want to delete this local unit type?',
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
      await masterService.localUnitType.delete(id);
      await fetchItems();
      if (detailItem?.id === id) setDetailItem(null);
      await Swal.fire({ title: 'Deleted', text: 'Local unit type deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
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
        <Breadcrumb items={[{ label: 'Master Setting', href: '/master-setting' }, { label: 'General', href: '/master-setting/general' }, { label: 'Local Unit Type' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Local Unit Type</h1>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Local unit type information" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#334155', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' }}>
                <Info size={18} />
              </button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 260, padding: '10px 12px', borderRadius: 12, border: '1px solid #dbe2ea', background: '#ffffff', color: '#334155', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)', fontSize: 12, lineHeight: 1.5, fontWeight: 500 }}>
                  <div style={{ position: 'absolute', left: -6, top: '50%', width: 10, height: 10, background: '#ffffff', borderLeft: '1px solid #dbe2ea', borderBottom: '1px solid #dbe2ea', transform: 'translateY(-50%) rotate(45deg)' }} />
                  Manage local unit types (e.g., Ward, Municipality) for the system.
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Local Unit Type</span>
          </button>
        </div>
        {error && <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>}
        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search by name or description..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="search-input" />
          </div>
        </div>
        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name" style={{ minWidth: 180 }}>Name</SortableTh>
                <SortableTh columnKey="description">Description</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th style={{ textTransform: 'capitalize' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={4} className="empty-state"><p>No local unit types found</p></td></tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id} role="button" tabIndex={0} onClick={() => setDetailItem(row)} onKeyDown={(e) => e.key === 'Enter' && setDetailItem(row)} style={{ cursor: 'pointer' }} className="data-table-row-clickable">
                    <td style={{ minWidth: 180 }}>
                      <div className="org-name-cell"><span className="org-name">{row.name}</span></div>
                    </td>
                    <td>{row.description || '—'}</td>
                    <td onClick={(e) => { e.stopPropagation(); handleChangeStatus(row); }} role="button" tabIndex={0} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleChangeStatus(row); }} title={`Set to ${row.status === 'active' ? 'Inactive' : 'Active'}`}>
                      <span className={`status-badge ${row.status}`}>
                        {row.status === 'active' && <Check size={14} />}
                        {row.status === 'inactive' && <X size={14} />}
                        {row.status === 'deleted' && <Trash2 size={14} />}
                        <span>{row.status === 'active' ? 'Active' : row.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td style={{ width: 100 }} onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="btn-icon-edit" title="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}><Edit size={18} /></button>
                        <button className="btn-icon-delete" title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <label htmlFor="items-per-page" className="pagination-label">Show:</label>
                      <select id="items-per-page" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                      </select>
                      <span className="pagination-label">per page</span>
                    </div>
                    <div className="pagination-info">Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, sorted.length)} of {sorted.length}</div>
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
                <h2>Local Unit Type Detail</h2>
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
                    <label className="form-label">Description</label>
                    <p style={{ margin: 0, padding: '8px 0' }}>{detailItem.description || '—'}</p>
                  </div>
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
                <h2>{editingId ? 'Edit Local Unit Type' : 'Add Local Unit Type'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g., Ward, Municipality" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
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
