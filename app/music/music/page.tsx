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
import { musicApi, musicTypeApi } from '@/app/lib/crm.service';
import type { MusicRequest } from '@/app/lib/crm.types';

interface MusicTypeOption {
  id: string;
  type: string;
}

interface MusicItem {
  id: string;
  name: string;
  description: string;
  mp3Url: string;
  musicTypeId: string;
  musicTypeName?: string;
  status: 'active' | 'inactive' | 'deleted';
}

function mapApiToItem(raw: Record<string, unknown>): MusicItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const musicType = raw.musicType as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    mp3Url: String(raw.mp3Url ?? ''),
    musicTypeId: raw.musicTypeId ? String(raw.musicTypeId) : (musicType?.id ? String(musicType.id) : ''),
    musicTypeName: musicType?.type ? String(musicType.type) : undefined,
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

export default function MusicPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [items, setItems] = useState<MusicItem[]>([]);
  const [musicTypes, setMusicTypes] = useState<MusicTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MusicRequest>({ name: '', description: '', mp3Url: '', musicTypeId: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMusicTypeId, setFilterMusicTypeId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortKey, setSortKey] = useState<'name' | 'description' | 'musicTypeName' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchMusicTypes = useCallback(async () => {
    try {
      const res = await musicTypeApi.listActive();
      const list = (res.data ?? []) as Record<string, unknown>[];
      setMusicTypes(list.map((r) => ({ id: String(r.id ?? ''), type: String(r.type ?? '') })));
    } catch {
      setMusicTypes([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await musicApi.list({
        pageNo: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchKey: searchTerm || undefined,
        musicTypeId: filterMusicTypeId || undefined,
        status: filterStatus || undefined,
        sortBy: sortKey === 'musicTypeName' ? 'musicType.name' : sortKey,
        sortDirection,
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setItems(list.map(mapApiToItem));
      setTotalElements(res.totalElements ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load music');
      setItems([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterMusicTypeId, filterStatus, sortKey, sortDirection]);

  useEffect(() => {
    fetchMusicTypes();
  }, [fetchMusicTypes]);

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
    if (!formData.musicTypeId?.trim()) newErrors.musicTypeId = 'Music type is required';
    if (!editingId && !uploadFile) newErrors.file = 'Please select an audio file (MP3) to create.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      if (!validateForm()) return;
      setError(null);
      setSubmitting(true);
      try {
        if (updateFile) {
          const fd = new FormData();
          fd.append('file', updateFile);
          fd.append('name', (formData.name?.trim() || 'Music'));
          if (formData.description?.trim()) fd.append('description', formData.description.trim());
          fd.append('musicTypeId', formData.musicTypeId!.trim());
          await musicApi.updateWithFile(editingId, fd);
        } else {
          const body: MusicRequest = {
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
            mp3Url: formData.mp3Url?.trim() || undefined,
            musicTypeId: formData.musicTypeId!.trim(),
          };
          await musicApi.update(editingId, body);
        }
        setSubmitting(false);
        await Swal.fire({ title: 'Updated', text: 'Music updated successfully.', icon: 'success', timer: 5000, showConfirmButton: false });
        await fetchItems();
        setShowAddModal(false);
        resetForm();
      } catch (err) {
        setSubmitting(false);
        const msg = err instanceof Error ? err.message : 'Operation failed';
        setErrors((prev) => ({ ...prev, submit: msg }));
        await Swal.fire({ title: 'Error', text: msg, icon: 'error', timer: 5000, showConfirmButton: false });
      }
      return;
    }
    if (!validateForm()) return;
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile!);
      fd.append('name', formData.name.trim() || uploadFile!.name || 'Music');
      if (formData.description?.trim()) fd.append('description', formData.description.trim());
      fd.append('musicTypeId', formData.musicTypeId!.trim());
      await musicApi.upload(fd);
      setSubmitting(false);
      await Swal.fire({ title: 'Saved', text: 'Music created successfully.', icon: 'success', timer: 5000, showConfirmButton: false });
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setErrors((prev) => ({ ...prev, submit: msg }));
      await Swal.fire({ title: 'Error', text: msg, icon: 'error', timer: 5000, showConfirmButton: false });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', mp3Url: '', musicTypeId: '' });
    setUploadFile(null);
    setUpdateFile(null);
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: MusicItem) => {
    setFormData({
      name: row.name,
      description: row.description || '',
      mp3Url: row.mp3Url || '',
      musicTypeId: row.musicTypeId || '',
    });
    setEditingId(row.id);
    setUploadFile(null);
    setUpdateFile(null);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: MusicItem) => {
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
      await musicApi.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete music?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await musicApi.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Music deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
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
        <Breadcrumb items={[{ label: 'Music', href: '/music' }, { label: 'Music' }]} />
        <PageHeaderWithInfo
          title="Music"
          infoText="Manage music entries. Set name, description, MP3 URL, and music type."
        >
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Music</span>
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
              placeholder="Search by name, description, or type..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
          <select
            className="form-input"
            style={{ width: 200 }}
            value={filterMusicTypeId}
            onChange={(e) => { setFilterMusicTypeId(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All types</option>
            {musicTypes.map((mt) => (
              <option key={mt.id} value={mt.id}>{mt.type}</option>
            ))}
          </select>
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
                <SortableTh columnKey="description">Description</SortableTh>
                <SortableTh columnKey="musicTypeName">Music Type</SortableTh>
                <th>MP3 URL</th>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <p>{items.length === 0 ? 'No music found' : 'No music match your search'}</p>
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name}</span>
                      </div>
                    </td>
                    <td>{row.description || '—'}</td>
                    <td>{row.musicTypeName || '—'}</td>
                    <td>
                      {row.mp3Url ? (
                        <a href={row.mp3Url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                          Link
                        </a>
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
                  <td colSpan={6}>
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
                <h2>{editingId ? 'Edit Music' : 'Add Music'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                {!editingId && (
                  <p className="form-label" style={{ marginBottom: 8, fontWeight: 500, color: '#64748b' }}>
                    Create by selecting an audio file (MP3) only.
                  </p>
                )}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Music name" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                {!editingId && (
                  <div className="form-group">
                    <label htmlFor="musicFile" className="form-label">Audio file (MP3) <span className="required">*</span></label>
                    <input
                      type="file"
                      id="musicFile"
                      accept="audio/mpeg,audio/mp3,audio/*,.mp3"
                      onChange={(e) => { setUploadFile(e.target.files?.[0] ?? null); if (errors.file) setErrors((p) => ({ ...p, file: '' })); }}
                      className={`form-input ${errors.file ? 'error' : ''}`}
                    />
                    {uploadFile && <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 4 }}>{uploadFile.name}</span>}
                    {errors.file && <span className="form-error">{errors.file}</span>}
                  </div>
                )}
                {editingId && (
                  <div className="form-group">
                    <label htmlFor="updateMusicFile" className="form-label">Replace audio file</label>
                    <input
                      type="file"
                      id="updateMusicFile"
                      accept="audio/mpeg,audio/mp3,audio/*,.mp3,.wav,.ogg"
                      onChange={(e) => setUpdateFile(e.target.files?.[0] ?? null)}
                      className="form-input"
                    />
                    {updateFile && <span style={{ fontSize: 12, color: '#64748b' }}>{updateFile.name}</span>}
                  </div>
                )}
                {editingId && (
                  <div className="form-group">
                    <label htmlFor="mp3Url" className="form-label">MP3 URL</label>
                    <input type="url" id="mp3Url" name="mp3Url" value={formData.mp3Url ?? ''} readOnly className="form-input" style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} placeholder="https://..." title="URL is set by the uploaded file and cannot be edited" />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="musicTypeId" className="form-label">Music Type <span className="required">*</span></label>
                  <select id="musicTypeId" name="musicTypeId" value={formData.musicTypeId ?? ''} onChange={handleInputChange} className={`form-input ${errors.musicTypeId ? 'error' : ''}`}>
                    <option value="">— Select type —</option>
                    {musicTypes.map((mt) => (
                      <option key={mt.id} value={mt.id}>{mt.type}</option>
                    ))}
                  </select>
                  {errors.musicTypeId && <span className="form-error">{errors.musicTypeId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea id="description" name="description" value={formData.description ?? ''} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="form-spinner" style={{ marginRight: 6 }} />
                        <span>{editingId ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
                      </>
                    )}
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
