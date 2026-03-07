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
import { zodiacSignApi, horoscopeScopeApi } from '@/app/lib/crm.service';
import type { ZodiacSignRequest } from '@/app/lib/crm.types';

interface ScopeOption {
  id: string;
  scope: string;
}

interface ZodiacSignItem {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  startingName: string;
  horoscopeScopeId: string;
  scopeName?: string;
  status: 'active' | 'inactive' | 'deleted';
}

function mapApiToItem(raw: Record<string, unknown>): ZodiacSignItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const scope = raw.horoscopeScope as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    logoUrl: String(raw.logoUrl ?? ''),
    startingName: String(raw.startingName ?? ''),
    horoscopeScopeId: raw.horoscopeScopeId ? String(raw.horoscopeScopeId) : (scope?.id ? String(scope.id) : ''),
    scopeName: scope?.scope ? String(scope.scope) : undefined,
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

export default function ZodiacSignPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<ZodiacSignItem[]>([]);
  const [scopes, setScopes] = useState<ScopeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ZodiacSignRequest>({
    name: '',
    description: '',
    logoUrl: '',
    startingName: '',
    horoscopeScopeId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterScopeId, setFilterScopeId] = useState<string>('');
  const [sortKey, setSortKey] = useState<'name' | 'startingName' | 'scopeName' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchScopes = useCallback(async () => {
    try {
      const res = await horoscopeScopeApi.listActive();
      const list = (res.data ?? []) as Record<string, unknown>[];
      setScopes(list.map((r) => ({ id: String(r.id ?? ''), scope: String(r.scope ?? '') })));
    } catch {
      setScopes([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await zodiacSignApi.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        horoscopeScopeId: filterScopeId || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setItems(list.map(mapApiToItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load zodiac signs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterScopeId]);

  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

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
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    const body: ZodiacSignRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      logoUrl: formData.logoUrl?.trim() || undefined,
      startingName: formData.startingName?.trim() || undefined,
      horoscopeScopeId: formData.horoscopeScopeId?.trim() || undefined,
    };
    try {
      if (editingId) {
        await zodiacSignApi.update(editingId, body);
        await Swal.fire({ title: 'Updated', text: 'Zodiac sign updated.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await zodiacSignApi.create(body);
        await Swal.fire({ title: 'Created', text: 'Zodiac sign created.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', logoUrl: '', startingName: '', horoscopeScopeId: '' });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: ZodiacSignItem) => {
    setFormData({
      name: row.name,
      description: row.description || '',
      logoUrl: row.logoUrl || '',
      startingName: row.startingName || '',
      horoscopeScopeId: row.horoscopeScopeId || '',
    });
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: ZodiacSignItem) => {
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
      await zodiacSignApi.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete zodiac sign?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await zodiacSignApi.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Zodiac sign deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.startingName && i.startingName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.scopeName && i.scopeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const sorted = [...filtered].sort((a, b) => {
    const aVal = String(sortKey === 'scopeName' ? a.scopeName : a[sortKey] ?? '').toLowerCase();
    const bVal = String(sortKey === 'scopeName' ? b.scopeName : b[sortKey] ?? '').toLowerCase();
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDirection === 'asc' ? cmp : -cmp;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);
  const hasNoData = filtered.length === 0;

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
        <Breadcrumb items={[{ label: 'Astrology', href: '/astrology' }, { label: 'Zodiac Sign' }]} />
        <PageHeaderWithInfo
          title="Zodiac Sign"
          infoText="Manage zodiac signs. Set name, description, logo URL, starting name, and horoscope scope."
        >
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Zodiac Sign</span>
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
              placeholder="Search by name, description, scope..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
          <select
            className="form-input"
            style={{ width: 200 }}
            value={filterScopeId}
            onChange={(e) => { setFilterScopeId(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All scopes</option>
            {scopes.map((s) => (
              <option key={s.id} value={s.id}>{s.scope}</option>
            ))}
          </select>
        </div>
        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">Name</SortableTh>
                <th>Description</th>
                <SortableTh columnKey="startingName">Starting Name</SortableTh>
                <SortableTh columnKey="scopeName">Scope</SortableTh>
                <th>Logo URL</th>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <p>{items.length === 0 ? 'No zodiac signs found' : 'No zodiac signs match your search'}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 180 }}>{row.description ? (row.description.length > 50 ? row.description.slice(0, 50) + '…' : row.description) : '—'}</td>
                    <td>{row.startingName || '—'}</td>
                    <td>{row.scopeName || '—'}</td>
                    <td>
                      {row.logoUrl ? (
                        <a href={row.logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Link</a>
                      ) : (
                        '—'
                      )}
                    </td>
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
                  <td colSpan={7}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-zs" className="pagination-label">Show:</label>
                        <select id="items-per-page-zs" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
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
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Zodiac Sign' : 'Add Zodiac Sign'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. Aries" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea id="description" name="description" value={formData.description ?? ''} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="startingName" className="form-label">Starting Name</label>
                  <input type="text" id="startingName" name="startingName" value={formData.startingName ?? ''} onChange={handleInputChange} className="form-input" placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="logoUrl" className="form-label">Logo URL</label>
                  <input type="url" id="logoUrl" name="logoUrl" value={formData.logoUrl ?? ''} onChange={handleInputChange} className="form-input" placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label htmlFor="horoscopeScopeId" className="form-label">Horoscope Scope</label>
                  <select id="horoscopeScopeId" name="horoscopeScopeId" value={formData.horoscopeScopeId ?? ''} onChange={handleInputChange} className="form-input">
                    <option value="">— Select scope —</option>
                    {scopes.map((s) => (
                      <option key={s.id} value={s.id}>{s.scope}</option>
                    ))}
                  </select>
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
