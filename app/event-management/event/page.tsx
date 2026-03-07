'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  ImagePlus,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { PageHeaderWithInfo } from '../../components/common/PageHeaderWithInfo';
import { ActionTooltip } from '../../components/common/ActionTooltip';
import { eventApi, eventCategoryApi, eventImageApi } from '@/app/lib/crm.service';
import type { EventRequest, EventImageItemRequest } from '@/app/lib/crm.types';
import { NepaliDatepicker } from '@/app/components/ui/nepali-datepicker';

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

// Preload Nepali datepicker scripts so they are ready when modal opens (avoids init race)
function useNepaliDatepickerScripts() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.querySelector('link[href="/nepali-datepicker/nepali-datepicker.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/nepali-datepicker/nepali-datepicker.css';
    document.head.appendChild(link);
    const loadJQuery = (): Promise<void> => {
      if (window.$ || window.jQuery) return Promise.resolve();
      if (document.querySelector('script[src*="jquery"][src*="nepali-datepicker"]')) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = '/nepali-datepicker/jquery-3.6.0.min.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });
    };
    const loadDatepicker = (): Promise<void> => {
      if (typeof (window.$ || window.jQuery)?.fn?.nepaliDatepicker !== 'undefined') return Promise.resolve();
      if (document.querySelector('script[src="/nepali-datepicker/jquery-nepali-datepicker.js"]')) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = '/nepali-datepicker/jquery-nepali-datepicker.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });
    };
    loadJQuery().then(() => loadDatepicker()).catch(() => {});
  }, []);
}

export default function EventPage() {
  useNepaliDatepickerScripts();
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.id = 'event-modal-root';
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
      setPortalEl(null);
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventRequest & { startDateLocal?: string; endDateLocal?: string; startTime?: string; endTime?: string }>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    address: '',
    categoryId: '',
  });
  const [images, setImages] = useState<EventImageItemRequest[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const buildIsoFromDateAndTime = (datePart: string, timePart: string) => {
    if (!datePart || !timePart) return '';
    const dateStr = datePart.includes('T') ? datePart : `${datePart}T${timePart}`;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'startTime') {
      setFormData((prev) => ({
        ...prev,
        startTime: value,
        startDate: buildIsoFromDateAndTime(prev.startDateLocal ?? '', value),
      }));
    } else if (name === 'endTime') {
      setFormData((prev) => ({
        ...prev,
        endTime: value,
        endDate: buildIsoFromDateAndTime(prev.endDateLocal ?? '', value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStartDateSelect = (dateStr: string) => {
    const datePart = (dateStr || '').trim().slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      startDateLocal: datePart,
      startDate: buildIsoFromDateAndTime(datePart, prev.startTime ?? '00:00'),
    }));
    if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
  };

  const handleEndDateSelect = (dateStr: string) => {
    const datePart = (dateStr || '').trim().slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      endDateLocal: datePart,
      endDate: buildIsoFromDateAndTime(datePart, prev.endTime ?? '00:00'),
    }));
    if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
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
      startDateLocal: '',
      startTime: '',
      endDateLocal: '',
      endTime: '',
    });
    setImages([]);
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = async (row: EventItem) => {
    const startDt = formatDateTimeLocal(row.startDate);
    const endDt = formatDateTimeLocal(row.endDate);
    setFormData({
      name: row.name,
      description: row.description || '',
      startDate: row.startDate,
      endDate: row.endDate,
      address: row.address || '',
      categoryId: row.categoryId || '',
      startDateLocal: startDt.slice(0, 10),
      startTime: startDt.slice(11, 16) || '00:00',
      endDateLocal: endDt.slice(0, 10),
      endTime: endDt.slice(11, 16) || '00:00',
    });
    setEditingId(row.id);
    setShowAddModal(true);
    try {
      const res = await eventImageApi.list({ eventId: row.id, pageNo: 0, pageSize: 100 });
      const list = (res.result ?? res.content ?? []) as { imageUrl?: string; displayOrder?: number }[];
      const sorted = [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setImages(sorted.map((r) => ({ imageUrl: r.imageUrl ?? '', displayOrder: r.displayOrder ?? 0 })));
    } catch {
      setImages([]);
    }
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
          <button type="button" className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
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

        {portalEl && showAddModal && createPortal(
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Event' : 'Add Event'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
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
                  <label className="form-label">Start date & time <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                      <NepaliDatepicker
                        key="start-date"
                        value={formData.startDateLocal ?? ''}
                        onChange={handleStartDateSelect}
                        placeholder="Start date"
                        options={{ dateFormat: 'YYYY-MM-DD', useEnglishNumbers: true, dateType: 'AD', modal: true }}
                        className={`form-input ${errors.startDate ? 'error' : ''}`}
                      />
                    </div>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime ?? '00:00'}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ width: 120 }}
                    />
                  </div>
                  {errors.startDate && <span className="form-error">{errors.startDate}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">End date & time <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                      <NepaliDatepicker
                        key="end-date"
                        value={formData.endDateLocal ?? ''}
                        onChange={handleEndDateSelect}
                        placeholder="End date"
                        options={{ dateFormat: 'YYYY-MM-DD', useEnglishNumbers: true, dateType: 'AD', modal: true }}
                        className={`form-input ${errors.endDate ? 'error' : ''}`}
                      />
                    </div>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime ?? '00:00'}
                      onChange={handleInputChange}
                      className="form-input"
                      style={{ width: 120 }}
                    />
                  </div>
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
                  <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Images</span>
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      onClick={() => setImages((prev) => [...prev, { imageUrl: '', displayOrder: prev.length }])}
                      style={{ padding: '6px 10px' }}
                    >
                      <ImagePlus size={14} />
                      <span>Add image</span>
                    </button>
                  </div>
                  <p className="form-error" style={{ marginBottom: 8, fontWeight: 400, color: '#64748b' }}>
                    Add image URLs (one per row). Order is used as display order.
                  </p>
                  {images.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No images added yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {images.map((img, index) => (
                        <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#64748b', minWidth: 24 }}>{index + 1}.</span>
                          <input
                            type="url"
                            value={img.imageUrl}
                            onChange={(e) =>
                              setImages((prev) =>
                                prev.map((item, i) => (i === index ? { ...item, imageUrl: e.target.value } : item))
                              )
                            }
                            className="form-input"
                            placeholder="https://..."
                            style={{ flex: 1 }}
                          />
                          <ActionTooltip text="Remove">
                            <button
                              type="button"
                              className="btn-icon-delete"
                              onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                            >
                              <Trash2 size={18} />
                            </button>
                          </ActionTooltip>
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
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small">
                    <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          portalEl
        )}
      </div>
    </DashboardLayout>
  );
}
