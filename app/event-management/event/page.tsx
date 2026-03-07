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
import { eventApi, eventCategoryApi, eventImageApi } from '@/app/lib/crm.service';
import type { EventRequest, EventImageItemRequest } from '@/app/lib/crm.types';

interface CategoryOption {
  id: string;
  name: string;
}

interface EventItem {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  address: string;
  categoryId: string;
  categoryName?: string;
  status: 'active' | 'inactive' | 'deleted';
}

function formatDateTimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function mapApiToItem(raw: Record<string, unknown>): EventItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const category = raw.category as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    address: String(raw.address ?? ''),
    categoryId: raw.categoryId ? String(raw.categoryId) : (category?.id ? String(category.id) : ''),
    categoryName: category?.name ? String(category.name) : undefined,
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

export default function EventPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
    if (!showAddModal) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        resetForm();
      }
    };
    document.addEventListener('keydown', onEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [showAddModal]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventRequest>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    address: '',
    categoryId: '',
  });
  const [images, setImages] = useState<EventImageItemRequest[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [sortKey, setSortKey] = useState<'name' | 'startDate' | 'categoryName' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await eventCategoryApi.listActive();
      const list = (res.data ?? []) as Record<string, unknown>[];
      setCategories(list.map((r) => ({ id: String(r.id ?? ''), name: String(r.name ?? '') })));
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventApi.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm || undefined,
        categoryId: filterCategoryId || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setItems(list.map(mapApiToItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      const d = new Date(value);
      setFormData((prev) => ({ ...prev, startDate: isNaN(d.getTime()) ? '' : d.toISOString() }));
    } else if (name === 'endDate') {
      const d = new Date(value);
      setFormData((prev) => ({ ...prev, endDate: isNaN(d.getTime()) ? '' : d.toISOString() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    setSubmitting(true);
    const body: EventRequest = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate,
      address: formData.address?.trim() || undefined,
      categoryId: formData.categoryId?.trim() || undefined,
      images: images.length > 0 ? images.map((img, i) => ({ imageUrl: img.imageUrl.trim(), displayOrder: i })) : undefined,
    };
    try {
      if (editingId) {
        await eventApi.update(editingId, body);
        await syncEventImages(editingId, images);
        await Swal.fire({ title: 'Updated', text: 'Event updated.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        const createRes = await eventApi.create(body) as { result?: { id?: string }; data?: { id?: string }; id?: string };
        const newId = createRes?.result?.id ?? createRes?.data?.id ?? createRes?.id;
        if (newId && images.length > 0) {
          await syncEventImages(newId, images);
        }
        await Swal.fire({ title: 'Created', text: 'Event created.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  async function syncEventImages(eventId: string, imageList: EventImageItemRequest[]) {
    const normalized = imageList.map((img, i) => ({ imageUrl: img.imageUrl.trim(), displayOrder: i })).filter((img) => img.imageUrl);
    try {
      const res = await eventImageApi.list({ eventId, pageNo: 0, pageSize: 100 });
      const existing = (res.result ?? res.content ?? []) as { id?: string }[];
      for (const row of existing) {
        if (row.id) await eventImageApi.delete(row.id);
      }
      for (const img of normalized) {
        await eventImageApi.create({ eventId, imageUrl: img.imageUrl, displayOrder: img.displayOrder });
      }
    } catch {
      // If event-image API is not available, event body.images may have been used by backend
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      address: '',
      categoryId: '',
    });
    setImages([]);
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = async (row: EventItem) => {
    setFormData({
      name: row.name,
      description: row.description || '',
      startDate: row.startDate,
      endDate: row.endDate,
      address: row.address || '',
      categoryId: row.categoryId || '',
    });
    setEditingId(row.id);
    setShowAddModal(true);
    try {
      const res = await eventImageApi.list({ eventId: row.id, pageNo: 0, pageSize: 100 });
      const list = (res.result ?? res.content ?? []) as { imageUrl?: string; displayOrder?: number }[];
      const sorted = [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setImages(sorted.map((r, i) => ({ imageUrl: r.imageUrl ?? '', displayOrder: i })));
    } catch {
      setImages([]);
    }
  };

  const handleImageFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    e.target.value = '';
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject();
            reader.readAsDataURL(file);
          })
      )
    ).then((dataUrls) => {
      setImages((prev) =>
        [...prev, ...dataUrls.map((url) => ({ imageUrl: url, displayOrder: 0 }))].map((img, i) => ({ ...img, displayOrder: i }))
      );
    });
  };

  const handleChangeStatus = async (row: EventItem) => {
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
      await eventApi.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete event?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await eventApi.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Event deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.categoryName && i.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (i.address && i.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const sorted = [...filtered].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    switch (sortKey) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'startDate':
        aVal = a.startDate;
        bVal = b.startDate;
        break;
      case 'categoryName':
        aVal = (a.categoryName ?? '').toLowerCase();
        bVal = (b.categoryName ?? '').toLowerCase();
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
        <Breadcrumb items={[{ label: 'Event Management', href: '/event-management' }, { label: 'Event' }]} />
        <PageHeaderWithInfo
          title="Event"
          infoText="Manage events. Set name, description, start/end date, address, and category."
        >
          <button type="button" className="btn-primary btn-small" onClick={() => { setShowAddModal(true); resetForm(); }}>
            <Plus size={16} />
            <span>Add Event</span>
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
              placeholder="Search by name, description, category, or address..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input"
            />
          </div>
          <select
            className="form-input"
            style={{ width: 200 }}
            value={filterCategoryId}
            onChange={(e) => { setFilterCategoryId(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="table-container" style={{ padding: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name">Name</SortableTh>
                <th>Description</th>
                <SortableTh columnKey="startDate">Start</SortableTh>
                <th>End</th>
                <SortableTh columnKey="categoryName">Category</SortableTh>
                <th>Address</th>
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <p>{items.length === 0 ? 'No events found' : 'No events match your search'}</p>
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
                    <td>{formatDisplayDate(row.startDate)}</td>
                    <td>{formatDisplayDate(row.endDate)}</td>
                    <td>{row.categoryName || '—'}</td>
                    <td style={{ maxWidth: 140 }}>{row.address ? (row.address.length > 30 ? row.address.slice(0, 30) + '…' : row.address) : '—'}</td>
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
                  <td colSpan={8}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-ev" className="pagination-label">Show:</label>
                        <select id="items-per-page-ev" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
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
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Event' : 'Add Event'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Event name" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="startDate" className="form-label">Start date & time <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formatDateTimeLocal(formData.startDate).slice(0, 16)}
                    onChange={handleInputChange}
                    className={`form-input ${errors.startDate ? 'error' : ''}`}
                  />
                  {errors.startDate && <span className="form-error">{errors.startDate}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="endDate" className="form-label">End date & time <span className="required">*</span></label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formatDateTimeLocal(formData.endDate).slice(0, 16)}
                    onChange={handleInputChange}
                    className={`form-input ${errors.endDate ? 'error' : ''}`}
                  />
                  {errors.endDate && <span className="form-error">{errors.endDate}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input type="text" id="address" name="address" value={formData.address ?? ''} onChange={handleInputChange} className="form-input" placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="categoryId" className="form-label">Category</label>
                  <select id="categoryId" name="categoryId" value={formData.categoryId ?? ''} onChange={handleInputChange} className="form-input">
                    <option value="">— Select category —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesSelect}
                    className="form-input"
                    style={{ maxWidth: 320 }}
                  />
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, marginBottom: 0 }}>
                    Select one or more image files. Order is used as display order. Remove below to reorder.
                  </p>
                  {images.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, marginBottom: 0 }}>No images added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                      {images.map((img, index) => (
                        <div key={index} style={{ position: 'relative', flex: '0 0 auto' }}>
                          <img
                            src={img.imageUrl}
                            alt={`Preview ${index + 1}`}
                            style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: 6 }}
                          />
                          <ActionTooltip text="Remove">
                            <button
                              type="button"
                              className="btn-icon-delete"
                              style={{ position: 'absolute', top: 4, right: 4, padding: 4 }}
                              onClick={() => setImages((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, displayOrder: i })))}
                            >
                              <Trash2 size={14} />
                            </button>
                          </ActionTooltip>
                          <span style={{ display: 'block', fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 }}>{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
