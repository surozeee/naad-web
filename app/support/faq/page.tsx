'use client';

import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Plus, Search, Edit, Trash2, X, Save, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { faqService, faqCategoryService } from '@/app/lib/ticket.service';
import type { FaqResponse, FaqRequest, FaqTypeEnum, FaqCategoryResponse } from '@/app/lib/ticket.types';

const FAQ_TYPE_OPTIONS: FaqTypeEnum[] = ['GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT', 'FEATURES', 'TROUBLESHOOTING', 'GETTING_STARTED', 'OTHER'];

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqResponse[]>([]);
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
  const [formData, setFormData] = useState<FaqRequest>({ question: '', answer: '', faqType: 'GENERAL', isPublished: false, isFeatured: false, displayOrder: 0 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await faqCategoryService.list({ pageNo: 0, pageSize: 200, sortBy: 'displayOrder', sortDirection: 'asc' });
      const data = res.data as { result?: FaqCategoryResponse[] } | undefined;
      setCategories(data?.result ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await faqService.list({ pageNo, pageSize, sortBy: 'displayOrder', sortDirection: 'asc' });
      const data = res.data as { result?: FaqResponse[]; totalElements?: number; totalElementCount?: number } | undefined;
      const list = data?.result ?? [];
      setFaqs(list);
      setTotalCount(data?.totalElements ?? data?.totalElementCount ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
      setFaqs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.question?.trim()) next.question = 'Question is required';
    if (!formData.answer?.trim()) next.answer = 'Answer is required';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: FaqRequest = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        faqType: formData.faqType,
        categoryId: formData.categoryId || undefined,
        displayOrder: formData.displayOrder ?? 0,
        isPublished: formData.isPublished ?? false,
        isFeatured: formData.isFeatured ?? false,
      };
      if (editingId) await faqService.update(editingId, payload);
      else await faqService.create(payload);
      setShowModal(false);
      setEditingId(null);
      setFormData({ question: '', answer: '', faqType: 'GENERAL', isPublished: false, isFeatured: false, displayOrder: 0 });
      setFormErrors({});
      await fetchFaqs();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FaqResponse) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      faqType: faq.faqType ?? 'GENERAL',
      categoryId: faq.categoryId ?? '',
      displayOrder: faq.displayOrder ?? 0,
      isPublished: faq.isPublished ?? false,
      isFeatured: faq.isFeatured ?? false,
    });
    setEditingId(faq.id);
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await faqService.delete(id);
      await fetchFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const getCategoryName = (id?: string) => categories.find((c) => c.id === id)?.categoryName ?? '—';
  const filtered = faqs.filter(
    (f) =>
      f.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(f.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Message Management', href: '/support' }, { label: 'FAQ' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={28} style={{ color: '#64748b' }} />
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>FAQ</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>Manage frequently asked questions.</p>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Info" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help' }}><Info size={18} /></button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 260, padding: 10, borderRadius: 12, border: '1px solid #dbe2ea', background: '#fff', fontSize: 12, boxShadow: '0 14px 30px rgba(15,23,42,0.16)' }}>Add and edit FAQs. Assign a category and type (General, Technical, etc.).</div>
              )}
            </div>
          </div>
          <button type="button" className="btn-primary btn-small" onClick={() => { setFormData({ question: '', answer: '', faqType: 'GENERAL', isPublished: false, isFeatured: false, displayOrder: 0 }); setEditingId(null); setFormErrors({}); setShowModal(true); }}><Plus size={16} /><span>Add FAQ</span></button>
        </div>

        {error && <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search by question, answer, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Question</th>
                <th style={{ minWidth: 140 }}>Category</th>
                <th style={{ width: 100 }}>Type</th>
                <th style={{ width: 80 }}>Published</th>
                <th style={{ width: 80 }}>Featured</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty-state"><p>No FAQs found</p></td></tr>
              ) : (
                filtered.map((f) => (
                  <tr key={f.id}>
                    <td><span className="org-name">{f.question}</span></td>
                    <td>{getCategoryName(f.categoryId)}</td>
                    <td>{formatLabel(f.faqType ?? '')}</td>
                    <td><span className={`status-badge ${f.isPublished ? 'active' : 'inactive'}`}>{f.isPublished ? 'Yes' : 'No'}</span></td>
                    <td><span className={`status-badge ${f.isFeatured ? 'active' : 'inactive'}`}>{f.isFeatured ? 'Yes' : 'No'}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-icon-edit" title="Edit" onClick={() => handleEdit(f)}><Edit size={18} /></button>
                        <button type="button" className="btn-icon-delete" title="Delete" onClick={() => handleDelete(f.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totalCount > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={6}>
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
            <div className="modal-content organization-modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowModal(false); setEditingId(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form" style={{ padding: '0 1.25rem 1.25rem' }}>
                {formErrors.submit && <div className="form-error" style={{ marginBottom: 8 }}>{formErrors.submit}</div>}
                <div className="form-group">
                  <label className="form-label">Question <span className="required">*</span></label>
                  <input type="text" value={formData.question} onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))} className={`form-input ${formErrors.question ? 'error' : ''}`} placeholder="Question" />
                  {formErrors.question && <span className="form-error">{formErrors.question}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Answer <span className="required">*</span></label>
                  <textarea value={formData.answer} onChange={(e) => setFormData((p) => ({ ...p, answer: e.target.value }))} className={`form-input ${formErrors.answer ? 'error' : ''}`} rows={4} placeholder="Answer" />
                  {formErrors.answer && <span className="form-error">{formErrors.answer}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select value={formData.faqType} onChange={(e) => setFormData((p) => ({ ...p, faqType: e.target.value as FaqTypeEnum }))} className="form-input">
                    {FAQ_TYPE_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={formData.categoryId ?? ''} onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value || undefined }))} className="form-input">
                    <option value="">— None —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Display order</label>
                  <input type="number" value={formData.displayOrder ?? 0} onChange={(e) => setFormData((p) => ({ ...p, displayOrder: Number(e.target.value) || 0 }))} className="form-input" min={0} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={formData.isPublished ?? false} onChange={(e) => setFormData((p) => ({ ...p, isPublished: e.target.checked }))} /> Published</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={formData.isFeatured ?? false} onChange={(e) => setFormData((p) => ({ ...p, isFeatured: e.target.checked }))} /> Featured</label>
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
