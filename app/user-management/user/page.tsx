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
import { ActionTooltip } from '../../components/common/ActionTooltip';
import { PageHeaderWithInfo } from '../../components/common/PageHeaderWithInfo';
import { userApi, roleApi } from '@/app/lib/user-api.service';
import type { UserResponse, RoleResponse } from '@/app/lib/user-api.types';

function mapItem(raw: UserResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const status = statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive';
  return {
    id: String(raw.id ?? ''),
    emailAddress: raw.emailAddress ?? '',
    mobileNumber: raw.mobileNumber ?? '',
    roleId: raw.roleId ? String(raw.roleId) : undefined,
    roleName: raw.roleName ?? '',
    name: raw.userDetail?.name ?? raw.emailAddress ?? '',
    status,
    enabled: raw.enabled ?? true,
  };
}

export default function UsersManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [users, setUsers] = useState<ReturnType<typeof mapItem>[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    emailAddress: '',
    mobileNumber: '',
    password: '',
    roleId: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'emailAddress' | 'mobileNumber' | 'roleName' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await userApi.list({ pageNo: 0, pageSize: 1000 });
      setUsers((list ?? []).map(mapItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const list = await roleApi.list({ pageNo: 0, pageSize: 500 });
      setRoles(list ?? []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (showAddModal) fetchRoles();
  }, [showAddModal, fetchRoles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) newErrors.emailAddress = 'Invalid email format';
    if (!formData.password.trim()) newErrors.password = editingId ? 'Enter new password to update (required by backend)' : 'Password is required';
    if (formData.password && formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.roleId) newErrors.roleId = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = editingId
        ? {
            emailAddress: formData.emailAddress.trim(),
            mobileNumber: formData.mobileNumber.trim() || undefined,
            password: formData.password.trim(),
            roleId: formData.roleId,
            userDetail: formData.name.trim() ? { name: formData.name.trim() } : undefined,
          }
        : {
            emailAddress: formData.emailAddress.trim(),
            mobileNumber: formData.mobileNumber.trim() || undefined,
            password: formData.password.trim(),
            roleId: formData.roleId,
            status: 'ACTIVE' as const,
            userDetail: formData.name.trim() ? { name: formData.name.trim() } : undefined,
          };
      if (editingId) {
        await userApi.update(editingId, body as Parameters<typeof userApi.update>[1]);
        await Swal.fire({ title: 'Updated', text: 'User updated successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await userApi.create(body as Parameters<typeof userApi.create>[0]);
        await Swal.fire({ title: 'Created', text: 'User created successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchUsers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      emailAddress: '',
      mobileNumber: '',
      password: '',
      roleId: '',
      name: '',
    });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: ReturnType<typeof mapItem>) => {
    setFormData({
      emailAddress: row.emailAddress,
      mobileNumber: row.mobileNumber ?? '',
      password: '',
      roleId: row.roleId ?? '',
      name: row.name ?? '',
    });
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: ReturnType<typeof mapItem>) => {
    const newStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${row.emailAddress}"</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await userApi.changeStatus(row.id, newStatus);
      await fetchUsers();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete user?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await userApi.delete(id);
      await fetchUsers();
      await Swal.fire({ title: 'Deleted', text: 'User deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const filtered = users.filter(
    (u) =>
      u.emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.mobileNumber && u.mobileNumber.includes(searchTerm)) ||
      (u.roleName && u.roleName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | undefined;
    let bVal: string | undefined;
    switch (sortKey) {
      case 'name':
        aVal = (a.name || a.emailAddress).toLowerCase();
        bVal = (b.name || b.emailAddress).toLowerCase();
        break;
      case 'emailAddress':
        aVal = a.emailAddress.toLowerCase();
        bVal = b.emailAddress.toLowerCase();
        break;
      case 'mobileNumber':
        aVal = a.mobileNumber ?? '';
        bVal = b.mobileNumber ?? '';
        break;
      case 'roleName':
        aVal = (a.roleName ?? '').toLowerCase();
        bVal = (b.roleName ?? '').toLowerCase();
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        return 0;
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = sorted.slice(startIndex, endIndex);
  const hasNoData = filtered.length === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children, style = {} }: { columnKey: typeof sortKey; children: React.ReactNode; style?: React.CSSProperties }) => (
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
      </span>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'User Management' }, { label: 'Users' }]} />
        <PageHeaderWithInfo
          title="Users"
          infoText="Manage system users and their roles. Assign roles and control access from here."
        >
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add User</span>
          </button>
        </PageHeaderWithInfo>
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
              placeholder="Search by email, name, phone, or role..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
        </div>
        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">Name</SortableTh>
                <SortableTh columnKey="emailAddress">Email</SortableTh>
                <SortableTh columnKey="mobileNumber">Phone</SortableTh>
                <SortableTh columnKey="roleName">Role</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <p>{users.length === 0 ? 'No users found' : 'No users match your search'}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name || row.emailAddress}</span>
                      </div>
                    </td>
                    <td>{row.emailAddress}</td>
                    <td>{row.mobileNumber || '—'}</td>
                    <td>{row.roleName || '—'}</td>
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
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length}
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
            )}
          </table>
        </div>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit User' : 'Add User'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Display Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="form-input" placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label htmlFor="emailAddress" className="form-label">Email <span className="required">*</span></label>
                  <input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleInputChange} className={`form-input ${errors.emailAddress ? 'error' : ''}`} placeholder="user@example.com" />
                  {errors.emailAddress && <span className="form-error">{errors.emailAddress}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="mobileNumber" className="form-label">Mobile</label>
                  <input type="text" id="mobileNumber" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} className="form-input" placeholder="+1234567890" />
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password <span className="required">*</span></label>
                  <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min 8 characters" autoComplete="new-password" />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="roleId" className="form-label">Role <span className="required">*</span></label>
                  <select id="roleId" name="roleId" value={formData.roleId} onChange={handleInputChange} className={`form-input ${errors.roleId ? 'error' : ''}`}>
                    <option value="">— Select role —</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {errors.roleId && <span className="form-error">{errors.roleId}</span>}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
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
