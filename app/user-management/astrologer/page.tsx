'use client';

import { useCallback, useEffect, useState } from 'react';
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
  UserCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { ActionTooltip } from '@/app/components/common/ActionTooltip';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { userApi } from '@/app/lib/user-api.service';
import type { UserResponse } from '@/app/lib/user-api.types';

function mapItem(raw: UserResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const status = statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive';
  return {
    id: String(raw.id ?? ''),
    emailAddress: raw.emailAddress ?? '',
    mobileNumber: raw.mobileNumber ?? '',
    name: raw.userDetail?.name ?? raw.emailAddress ?? '',
    photoUrl: raw.userDetail?.photoUrl ?? '',
    status,
  };
}

type AstrologerRow = ReturnType<typeof mapItem>;

async function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      resolve(dataUrl.includes(',') ? dataUrl : dataUrl);
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export default function AstrologerManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [astrologers, setAstrologers] = useState<AstrologerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    emailAddress: '',
    mobileNumber: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<'name' | 'emailAddress' | 'mobileNumber' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [totalElements, setTotalElements] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  const fetchAstrologers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const search = debouncedSearch || undefined;
      const { rows, totalElements: total } = await userApi.listAstrologersPaginated({
        pageNo: Math.max(0, currentPage - 1),
        pageSize: itemsPerPage,
        search,
        sortBy: sortKey,
        sortDirection,
      });
      const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      setTotalElements(total);
      if (total > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
        return;
      }
      if (total === 0 && currentPage > 1) {
        setCurrentPage(1);
      }
      const mapped = (rows ?? []).map(mapItem);
      const sorted = [...mapped].sort((a, b) => {
        let aVal = '';
        let bVal = '';
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
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
        }
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? cmp : -cmp;
      });
      setAstrologers(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load astrologers');
      setAstrologers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, sortKey, sortDirection]);

  useEffect(() => {
    void fetchAstrologers();
  }, [fetchAstrologers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const base64 = await readImageAsBase64(file);
      setPhotoBase64(base64);
      setPhotoPreview(URL.createObjectURL(file));
    } catch {
      setError('Failed to read profile image');
    }
  };

  const clearPhotoSelection = () => {
    setPhotoBase64(null);
    setPhotoPreview(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.emailAddress.trim()) newErrors.emailAddress = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Invalid email format';
    }
    if (!editingId && !formData.password.trim()) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadPhotoIfNeeded = async (userId: string) => {
    if (!photoBase64) return;
    await userApi.uploadPhotoForUser(userId, photoBase64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const userDetail = formData.name.trim() ? { name: formData.name.trim() } : undefined;

      if (editingId) {
        await userApi.updateAstrologer(editingId, {
          emailAddress: formData.emailAddress.trim(),
          mobileNumber: formData.mobileNumber.trim() || undefined,
          password: formData.password.trim() || undefined,
          status: 'ACTIVE',
          userDetail,
        });
        await uploadPhotoIfNeeded(editingId);
        await Swal.fire({
          title: 'Updated',
          text: 'Astrologer updated successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const created = await userApi.createAstrologer({
          emailAddress: formData.emailAddress.trim(),
          mobileNumber: formData.mobileNumber.trim() || undefined,
          password: formData.password.trim(),
          status: 'ACTIVE',
          userDetail,
        });
        const userId = created?.id ? String(created.id) : '';
        if (userId && photoBase64) {
          await uploadPhotoIfNeeded(userId);
        }
        await Swal.fire({
          title: 'Created',
          text: 'Astrologer created successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      await fetchAstrologers();
      setShowModal(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ emailAddress: '', mobileNumber: '', password: '', name: '' });
    setErrors({});
    setEditingId(null);
    clearPhotoSelection();
  };

  const handleEdit = (row: AstrologerRow) => {
    setFormData({
      emailAddress: row.emailAddress,
      mobileNumber: row.mobileNumber ?? '',
      password: '',
      name: row.name ?? '',
    });
    setEditingId(row.id);
    setPhotoPreview(row.photoUrl || null);
    setPhotoBase64(null);
    setShowModal(true);
  };

  const handleChangeStatus = async (row: AstrologerRow) => {
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
      await userApi.changeAstrologerStatus(row.id, newStatus);
      await fetchAstrologers();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete astrologer?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await userApi.deleteAstrologer(id);
      await fetchAstrologers();
      await Swal.fire({ title: 'Deleted', text: 'Astrologer deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const hasNoData = totalElements === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({
    columnKey,
    children,
    style = {},
  }: {
    columnKey: typeof sortKey;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => (
    <th
      role="button"
      tabIndex={0}
      onClick={() => handleSort(columnKey)}
      onKeyDown={(ev) => ev.key === 'Enter' && handleSort(columnKey)}
      className="sortable-th"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 14 }}>
          {sortKey === columnKey ? (
            sortDirection === 'asc' ? (
              <ChevronUp size={14} color='var(--naad-primary)' strokeWidth={2.4} />
            ) : (
              <ChevronDown size={14} color='var(--naad-primary)' strokeWidth={2.4} />
            )
          ) : (
            <ArrowUpDown size={14} color='var(--naad-fg-muted)' strokeWidth={1.9} />
          )}
        </span>
      </span>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'User Management', href: '/user-management' }, { label: 'Astrologer' }]} />
        <PageHeaderWithInfo
          title="Astrologer"
          infoText="Manage astrologer accounts with profile photos, credentials, and meeting permissions."
        >
          <button
            type="button"
            className="btn-primary btn-small"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={16} />
            <span>Add Astrologer</span>
          </button>
        </PageHeaderWithInfo>

        {error && !showModal && (
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
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <SortableTh columnKey="name">Name</SortableTh>
                <SortableTh columnKey="emailAddress">Email</SortableTh>
                <SortableTh columnKey="mobileNumber">Phone</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--naad-fg-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <p>{debouncedSearch ? 'No astrologers match your search' : 'No astrologers found'}</p>
                  </td>
                </tr>
              ) : (
                astrologers.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: 'var(--naad-bg-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {row.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.photoUrl}
                            alt={row.name}
                            width={40}
                            height={40}
                            style={{ objectFit: 'cover', width: 40, height: 40 }}
                          />
                        ) : (
                          <UserCircle size={28} color='var(--naad-fg-muted)' />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name || row.emailAddress}</span>
                      </div>
                    </td>
                    <td>{row.emailAddress}</td>
                    <td>{row.mobileNumber || '—'}</td>
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
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {hasNoData ? 0 : startIndex + 1} to {hasNoData ? 0 : startIndex + astrologers.length} of{' '}
                        {totalElements}
                      </div>
                      <div className="pagination-controls">
                        <button
                          type="button"
                          className="pagination-btn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Astrologer' : 'Add Astrologer'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}

                <div className="form-group">
                  <label className="form-label">Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'var(--naad-bg-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {photoPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoPreview} alt="Preview" style={{ width: 72, height: 72, objectFit: 'cover' }} />
                      ) : (
                        <UserCircle size={40} color='var(--naad-fg-muted)' />
                      )}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="form-input" />
                      {photoPreview && (
                        <button type="button" className="btn-secondary btn-small" style={{ marginTop: 8 }} onClick={clearPhotoSelection}>
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="name" className="form-label">Display Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailAddress" className="form-label">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    className={`form-input ${errors.emailAddress ? 'error' : ''}`}
                    placeholder="astrologer@example.com"
                  />
                  {errors.emailAddress && <span className="form-error">{errors.emailAddress}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="mobileNumber" className="form-label">Mobile</label>
                  <input
                    type="text"
                    id="mobileNumber"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="+97798XXXXXXXX"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password {!editingId && <span className="required">*</span>}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder={editingId ? 'Leave blank to keep current password' : 'Min 8 characters'}
                    autoComplete="new-password"
                  />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
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
      </div>
    </DashboardLayout>
  );
}
