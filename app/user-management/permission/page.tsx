'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
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
import { permissionApi, permissionGroupApi } from '@/app/lib/user-api.service';
import type { PermissionResponse, PermissionGroupResponse } from '@/app/lib/user-api.types';

function mapItem(raw: PermissionResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    description: String(raw.description ?? ''),
    status: (statusVal === 'ACTIVE' ? 'active' : 'inactive') as 'active' | 'inactive',
    permissionGroupId: raw.permissionGroupId ? String(raw.permissionGroupId) : undefined,
    permissionGroupName: raw.permissionGroupName,
  };
}

type SortKey = 'name' | 'code' | 'description' | 'group' | 'status';

export default function PermissionPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [permissions, setPermissions] = useState<ReturnType<typeof mapItem>[]>([]);
  const [groups, setGroups] = useState<PermissionGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissionGroupId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailPermission, setDetailPermission] = useState<ReturnType<typeof mapItem> | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await permissionApi.list({ pageNo: 0, pageSize: 1000 });
      setPermissions((list ?? []).map(mapItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const list = await permissionGroupApi.getActiveLastChild();
      setGroups(list ?? []);
    } catch {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (showAddModal) fetchGroups();
  }, [showAddModal, fetchGroups]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        permissionGroupId: formData.permissionGroupId || undefined,
      };
      if (editingId) {
        await permissionApi.update(editingId, body);
      } else {
        await permissionApi.create(body);
      }
      setShowAddModal(false);
      resetForm();
      await fetchPermissions();
      await Swal.fire({
        title: editingId ? 'Updated' : 'Created',
        text: editingId ? 'Permission updated successfully.' : 'Permission created successfully.',
        icon: 'success',
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      if (!showAddModal) setError(msg);
      setErrors((prev) => ({ ...prev, submit: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', permissionGroupId: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: ReturnType<typeof mapItem>) => {
    setDetailPermission(null);
    setFormData({
      name: row.name,
      code: row.code,
      description: row.description,
      permissionGroupId: row.permissionGroupId ?? '',
    });
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: ReturnType<typeof mapItem>) => {
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
      await permissionApi.changeStatus(row.id, newStatus);
      await fetchPermissions();
      if (detailPermission?.id === row.id) {
        setDetailPermission((prev) => prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null);
      }
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete permission?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await permissionApi.delete(id);
      if (detailPermission?.id === id) setDetailPermission(null);
      await fetchPermissions();
      await Swal.fire({ title: 'Deleted', text: 'Permission deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const filtered = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | undefined = a[sortBy as keyof typeof a];
    let bVal: string | undefined = b[sortBy as keyof typeof b];
    if (sortBy === 'group') {
      aVal = a.permissionGroupName;
      bVal = b.permissionGroupName;
    }
    const aStr = String(aVal ?? '').toLowerCase();
    const bStr = String(bVal ?? '').toLowerCase();
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

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'User Management' }, { label: 'Permission' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Permissions</h1>
            </div>
            <div
              style={{ marginTop: -12, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="Permissions information"
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
                  Permissions define what actions users can perform. Assign them to roles and link permission groups for organization.
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Permission</span>
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
              placeholder="Search by name or code..."
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
                <SortableTh columnKey="name" style={{ minWidth: 180 }}>Name</SortableTh>
                <SortableTh columnKey="code" style={{ minWidth: 120 }}>Code</SortableTh>
                <SortableTh columnKey="description">Description</SortableTh>
                <SortableTh columnKey="group" style={{ minWidth: 140 }}>Group</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th style={{ textTransform: 'capitalize' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <p>No permissions found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailPermission(row)}
                    onKeyDown={(e) => e.key === 'Enter' && setDetailPermission(row)}
                    style={{ cursor: 'pointer' }}
                    className="data-table-row-clickable"
                  >
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name}</span>
                      </div>
                    </td>
                    <td><span className="org-code">{row.code || '—'}</span></td>
                    <td>{row.description || '—'}</td>
                    <td>{row.permissionGroupName || '—'}</td>
                    <td>
                      <span className={`status-badge ${row.status}`}>
                        {row.status === 'active' ? <Check size={14} /> : <X size={14} />}
                        <span>{row.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <span className="action-tooltip-wrap">
                          <button type="button" className="btn-icon-edit" aria-label="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
                            <Edit size={18} />
                          </button>
                          <span className="action-tooltip">Edit</span>
                        </span>
                        <span className="action-tooltip-wrap">
                          <button type="button" className="btn-icon-edit" aria-label={row.status === 'active' ? 'Deactivate' : 'Activate'} onClick={(e) => { e.stopPropagation(); handleChangeStatus(row); }}>
                            {row.status === 'active' ? <X size={18} /> : <Check size={18} />}
                          </button>
                          <span className="action-tooltip">{row.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                        </span>
                        <span className="action-tooltip-wrap">
                          <button type="button" className="btn-icon-delete" aria-label="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
                            <Trash2 size={18} />
                          </button>
                          <span className="action-tooltip">Delete</span>
                        </span>
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
                      <label htmlFor="items-per-page" className="pagination-label">Show:</label>
                      <select id="items-per-page" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="pagination-label">per page</span>
                    </div>
                    <div className="pagination-info">
                      Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, sorted.length)} of {sorted.length}
                    </div>
                    <div className="pagination-controls">
                      <button type="button" className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                        <ChevronLeft size={18} /><span>Previous</span>
                      </button>
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
                      <button type="button" className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                        <span>Next</span><ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header country-modal-header">
                <h2>{editingId ? 'Edit Permission' : 'Add Permission'}</h2>
                <button type="button" className="modal-close-btn country-modal-close" onClick={() => { setShowAddModal(false); resetForm(); }} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              {errors.submit && (
                <div
                  role="alert"
                  style={{
                    margin: 0,
                    padding: '10px 14px',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    border: '1px solid #fecaca',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {errors.submit}
                </div>
              )}
              <form onSubmit={handleSubmit} className="organization-form" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="perm-name" className="form-label">Name <span className="required">*</span></label>
                  <input type="text" id="perm-name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g., Create User" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="perm-code" className="form-label">Code</label>
                  <input type="text" id="perm-code" name="code" value={formData.code} onChange={handleInputChange} className="form-input" placeholder="e.g., USER_CREATE" />
                </div>
                <div className="form-group">
                  <label htmlFor="perm-description" className="form-label">Description</label>
                  <textarea id="perm-description" name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="permissionGroupId" className="form-label">Permission Group</label>
                  <select id="permissionGroupId" name="permissionGroupId" value={formData.permissionGroupId} onChange={handleInputChange} className="form-input">
                    <option value="">— Select group —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-actions" style={{ marginTop: 4 }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                    <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {detailPermission && (
          <div className="modal-overlay" onClick={() => setDetailPermission(null)}>
            <div className="modal-content organization-modal permission-detail-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header country-modal-header">
                <h2>Permission Detail</h2>
                <button type="button" className="modal-close-btn country-modal-close" onClick={() => setDetailPermission(null)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <div className="organization-form permission-detail-form" style={{ gap: '0.5rem' }}>
                <div className="form-row permission-detail-row">
                  <div className="form-group">
                    <label className="form-label"><Shield size={14} /> Name</label>
                    <p className="permission-detail-value">{detailPermission.name}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <p className="permission-detail-value">{detailPermission.code || '—'}</p>
                  </div>
                </div>
                <div className="form-row permission-detail-row">
                  <div className="form-group">
                    <label className="form-label">Group</label>
                    <p className="permission-detail-value">{detailPermission.permissionGroupName || '—'}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <p className="permission-detail-value" style={{ margin: 0, padding: 0 }}>
                      <span className={`status-badge ${detailPermission.status}`}>
                        {detailPermission.status === 'active' ? <Check size={14} /> : <X size={14} />}
                        <span>{detailPermission.status === 'active' ? 'Active' : 'Inactive'}</span>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <p className="permission-detail-value">{detailPermission.description || '—'}</p>
                </div>
                <div className="form-actions permission-detail-actions">
                  <button
                    type="button"
                    className="btn-primary btn-small"
                    aria-label="Edit permission"
                    onClick={() => handleEdit(detailPermission)}
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setDetailPermission(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
