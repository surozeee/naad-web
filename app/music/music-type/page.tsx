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
import { musicTypeApi, type MusicTypeEnumItem } from '@/app/lib/crm.service';
import type { MusicTypeRequest } from '@/app/lib/crm.types';

interface MusicTypeItem {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'active' | 'inactive' | 'deleted';
}

function mapApiToItem(raw: Record<string, unknown>): MusicTypeItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const status: MusicTypeItem['status'] =
    statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive';
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    type: String(raw.type ?? ''),
    description: String(raw.description ?? ''),
    status,
  };
}

export default function MusicTypePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [items, setItems] = useState<MusicTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MusicTypeRequest>({ name: '', type: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'type' | 'description' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [typeOptions, setTypeOptions] = useState<MusicTypeEnumItem[]>([]);

  const fetchEnumList = useCallback(async () => {
    try {
      const list = await musicTypeApi.listEnum();
      setTypeOptions(list);
    } catch {
      setTypeOptions([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await musicTypeApi.list({
        pageNo: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchKey: searchTerm || undefined,
        sortBy: sortKey,
        sortDirection,
        status: filterStatus || undefined,
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setItems(list.map(mapApiToItem));
      setTotalElements(res.totalElements ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load music types');
      setItems([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortKey, sortDirection, filterStatus]);

  useEffect(() => {
    fetchEnumList();
  }, [fetchEnumList]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.type.trim()) newErrors.type = 'Type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    try {
      if (editingId) {
        await musicTypeApi.update(editingId, formData);
        await Swal.fire({ title: 'Updated', text: 'Music type updated.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await musicTypeApi.create(formData);
        await Swal.fire({ title: 'Created', text: 'Music type created.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: '', description: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: MusicTypeItem) => {
    setFormData({ name: row.name || '', type: row.type, description: row.description || '' });
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: MusicTypeItem) => {
    const newStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${row.type}"</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await musicTypeApi.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete music type?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await musicTypeApi.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Music type deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const hasNoData = items.length === 0 && !loading;

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
        <Breadcrumb items={[{ label: 'Music', href: '/music' }, { label: 'Music Type' }]} />
        <PageHeaderWithInfo
          title="Music Type"
          infoText="Manage music types (e.g. Devotional Music, Mantras, Bhajans, Chants). Used when adding Music entries."
        >
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Music Type</span>
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
              placeholder="Search by name, type or description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
          <select
            className="form-input"
            style={{ width: 160 }}
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>
        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">Name</SortableTh>
                <SortableTh columnKey="type">Type</SortableTh>
                <SortableTh columnKey="description">Description</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <p>{items.length === 0 ? 'No music types found' : 'No music types match your search'}</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name || '—'}</span>
                      </div>
                    </td>
                    <td>{row.type}</td>
                    <td>{row.description || '—'}</td>
                    <td>
                      <span className={`status-badge ${row.status}`}>
                        {row.status === 'active' && <Check size={14} />}
                        {row.status === 'inactive' && <X size={14} />}
                        {row.status === 'deleted' && <Trash2 size={14} />}
                        <span>
                          {row.status === 'active' ? 'Active' : row.status === 'deleted' ? 'Deleted' : 'Inactive'}
                        </span>
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
                  <td colSpan={5}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <span className="pagination-label">{PAGE_SIZE} per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, totalElements)} of {totalElements}
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
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Music Type' : 'Add Music Type'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input id="name" name="name" type="text" value={formData.name ?? ''} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Morning Chants" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="type" className="form-label">Type <span className="required">*</span></label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`form-input ${errors.type ? 'error' : ''}`}
                  >
                    <option value="">— Select type —</option>
                    {typeOptions.map((opt) => (
                      <option key={opt.name} value={opt.value}>{opt.value}</option>
                    ))}
                  </select>
                  {errors.type && <span className="form-error">{errors.type}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea id="description" name="description" value={formData.description ?? ''} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small">
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
