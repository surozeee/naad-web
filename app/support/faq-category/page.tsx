'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Plus, Search, Edit, Trash2, X, Save, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { faqCategoryService } from '@/app/lib/ticket.service';
import type { FaqCategoryResponse, FaqCategoryRequest } from '@/app/lib/ticket.types';

export default function FaqCategoryPage() {
  const [categories, setCategories] = useState<FaqCategoryResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<FaqCategoryRequest>({ categoryName: '', description: '', displayOrder: 0, isFeatured: false });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await faqCategoryService.list({ pageNo, pageSize, sortBy: 'displayOrder', sortDirection: 'asc' });
      const data = res.data as { result?: FaqCategoryResponse[]; totalElements?: number; totalElementCount?: number } | undefined;
      const list = data?.result ?? [];
      setCategories(list);
      setTotalCount(data?.totalElements ?? data?.totalElementCount ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      setCategories([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.categoryName?.trim()) next.categoryName = 'Category name is required';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) await faqCategoryService.update(editingId, formData);
      else await faqCategoryService.create(formData);
      setShowModal(false);
      setEditingId(null);
      setFormData({ categoryName: '', description: '', displayOrder: 0, isFeatured: false });
      setFormErrors({});
      await fetchCategories();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: FaqCategoryResponse) => {
    setFormData({
      categoryName: c.categoryName,
      description: c.description ?? '',
      displayOrder: c.displayOrder ?? 0,
      isFeatured: c.isFeatured ?? false,
    });
    setEditingId(c.id);
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await faqCategoryService.delete(id);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Message Management', href: '/support' }, { label: 'FAQ Category' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={28} style={{ color: '#64748b' }} />
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>FAQ Category</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>Manage FAQ categories.</p>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Info" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help' }}><Info size={18} /></button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 240, padding: 10, borderRadius: 12, border: '1px solid #dbe2ea', background: '#fff', fontSize: 12, boxShadow: '0 14px 30px rgba(15,23,42,0.16)' }}>Organize FAQs into categories (name, description, display order).</div>
              )}
            </div>
          </div>
          <button type="button" className="btn-primary btn-small" onClick={() => { setFormData({ categoryName: '', description: '', displayOrder: 0, isFeatured: false }); setEditingId(null); setFormErrors({}); setShowModal(true); }}><Plus size={16} /><span>Add Category</span></button>
        </div>

        {error && <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Category name</th>
                <th>Description</th>
                <th style={{ width: 90 }}>Order</th>
                <th style={{ width: 90 }}>Featured</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-state"><p>No categories found</p></td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td><span className="org-name">{c.categoryName}</span></td>
                    <td><span style={{ color: '#64748b', fontSize: '0.875rem' }}>{c.description || '—'}</span></td>
                    <td>{c.displayOrder ?? 0}</td>
                    <td><span className={`status-badge ${c.isFeatured ? 'active' : 'inactive'}`}>{c.isFeatured ? 'Yes' : 'No'}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-icon-edit" title="Edit" onClick={() => handleEdit(c)}><Edit size={18} /></button>
                        <button type="button" className="btn-icon-delete" title="Delete" onClick={() => handleDelete(c.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totalCount > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label className="pagination-label">Show:</label>
                        <select className="pagination-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPageNo(0); }}>
                          <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">Showing {pageNo * pageSize + 1} to {Math.min((pageNo + 1) * pageSize, totalCount)} of {totalCount}</div>
                      <div className="pagination-controls">
                        <button type="button" className="pagination-btn" disabled={pageNo <= 0} onClick={() => setPageNo((p) => p - 1)}><ChevronLeft size={18} /><span>Previous</span></button>
                        <div className="pagination-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button key={page} type="button" className={`pagination-number ${pageNo + 1 === page ? 'active' : ''}`} onClick={() => setPageNo(page - 1)}>{page}</button>
                          ))}
                        </div>
                        <button type="button" className="pagination-btn" disabled={pageNo >= totalPages - 1} onClick={() => setPageNo((p) => p + 1)}><span>Next</span><ChevronRight size={18} /></button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingId(null); }}>
            <div className="modal-content organization-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Category' : 'Add Category'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowModal(false); setEditingId(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form" style={{ padding: '0 1.25rem 1.25rem' }}>
                {formErrors.submit && <div className="form-error" style={{ marginBottom: 8 }}>{formErrors.submit}</div>}
                <div className="form-group">
                  <label className="form-label">Category name <span className="required">*</span></label>
                  <input type="text" value={formData.categoryName} onChange={(e) => setFormData((p) => ({ ...p, categoryName: e.target.value }))} className={`form-input ${formErrors.categoryName ? 'error' : ''}`} placeholder="Category name" />
                  {formErrors.categoryName && <span className="form-error">{formErrors.categoryName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea value={formData.description ?? ''} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className="form-input" rows={2} placeholder="Description" />
                </div>
                <div className="form-group">
                  <label className="form-label">Display order</label>
                  <input type="number" value={formData.displayOrder ?? 0} onChange={(e) => setFormData((p) => ({ ...p, displayOrder: Number(e.target.value) || 0 }))} className="form-input" min={0} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={formData.isFeatured ?? false} onChange={(e) => setFormData((p) => ({ ...p, isFeatured: e.target.checked }))} />
                    <span>Featured</span>
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={saving}><Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
