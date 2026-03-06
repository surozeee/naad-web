'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket as TicketIcon, Plus, Search, Edit, Trash2, X, Save, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { ticketService } from '@/app/lib/ticket.service';
import type { TicketResponse, TicketRequest, TicketStatusEnum, TicketPriorityEnum, TicketTypeEnum, TicketChannelEnum } from '@/app/lib/ticket.types';

const STATUS_OPTIONS: TicketStatusEnum[] = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'CANCELLED'];
const PRIORITY_OPTIONS: TicketPriorityEnum[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];
const TYPE_OPTIONS: TicketTypeEnum[] = ['TECHNICAL_SUPPORT', 'BUG_REPORT', 'FEATURE_REQUEST', 'ACCOUNT_ISSUE', 'BILLING', 'GENERAL_INQUIRY', 'OTHER'];
const CHANNEL_OPTIONS: TicketChannelEnum[] = ['EMAIL', 'PHONE', 'CHAT', 'WEB_FORM', 'MOBILE_APP', 'OTHER'];

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

const defaultForm: TicketRequest = {
  subject: '',
  description: '',
  status: 'OPEN',
  priority: 'MEDIUM',
  ticketType: 'GENERAL_INQUIRY',
  channel: 'WEB_FORM',
};

export default function TicketPage() {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<TicketRequest>(defaultForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.list({ pageNo, pageSize, sortBy: 'createdAt', sortDirection: 'desc' });
      const data = res.data as { result?: TicketResponse[]; totalElements?: number; totalElementCount?: number } | undefined;
      const list = data?.result ?? [];
      setTickets(list);
      setTotalCount(data?.totalElements ?? data?.totalElementCount ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
      setTickets([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [pageNo, pageSize]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!formData.subject?.trim()) next.subject = 'Subject is required';
    if (!formData.description?.trim()) next.description = 'Description is required';
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) await ticketService.update(editingId, formData);
      else await ticketService.create(formData);
      setShowModal(false);
      setEditingId(null);
      setFormData(defaultForm);
      setFormErrors({});
      await fetchTickets();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: TicketResponse) => {
    setFormData({
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      ticketType: t.ticketType,
      channel: t.channel,
      customerEmail: t.customerEmail ?? '',
      customerName: t.customerName ?? '',
    });
    setEditingId(t.id);
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await ticketService.delete(id);
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Message Management', href: '/support' }, { label: 'Ticket' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TicketIcon size={28} style={{ color: '#64748b' }} />
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Ticket</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>Manage support tickets.</p>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Info" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help' }}><Info size={18} /></button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 240, padding: 10, borderRadius: 12, border: '1px solid #dbe2ea', background: '#fff', fontSize: 12, boxShadow: '0 14px 30px rgba(15,23,42,0.16)' }}>Create and manage support tickets (status, priority, type, channel).</div>
              )}
            </div>
          </div>
          <button type="button" className="btn-primary btn-small" onClick={() => { setFormData(defaultForm); setEditingId(null); setFormErrors({}); setShowModal(true); }}><Plus size={16} /><span>Add Ticket</span></button>
        </div>

        {error && <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search by subject, case ID, customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>Case ID</th>
                <th style={{ minWidth: 200 }}>Subject</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 90 }}>Priority</th>
                <th style={{ width: 120 }}>Type</th>
                <th style={{ width: 100 }}>Channel</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state"><p>No tickets found</p></td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td><span className="org-code">{t.caseId ?? t.id}</span></td>
                    <td><span className="org-name">{t.subject}</span></td>
                    <td><span className="status-badge active">{formatLabel(t.status)}</span></td>
                    <td>{formatLabel(t.priority)}</td>
                    <td>{formatLabel(t.ticketType)}</td>
                    <td>{formatLabel(t.channel)}</td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-icon-edit" title="Edit" onClick={() => handleEdit(t)}><Edit size={18} /></button>
                        <button type="button" className="btn-icon-delete" title="Delete" onClick={() => handleDelete(t.id)}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totalCount > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7}>
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
            <div className="modal-content organization-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Ticket' : 'Add Ticket'}</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowModal(false); setEditingId(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form" style={{ padding: '0 1.25rem 1.25rem' }}>
                {formErrors.submit && <div className="form-error" style={{ marginBottom: 8 }}>{formErrors.submit}</div>}
                <div className="form-group">
                  <label className="form-label">Subject <span className="required">*</span></label>
                  <input type="text" value={formData.subject} onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))} className={`form-input ${formErrors.subject ? 'error' : ''}`} placeholder="Subject" />
                  {formErrors.subject && <span className="form-error">{formErrors.subject}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span className="required">*</span></label>
                  <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className={`form-input ${formErrors.description ? 'error' : ''}`} rows={3} placeholder="Description" />
                  {formErrors.description && <span className="form-error">{formErrors.description}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as TicketStatusEnum }))} className="form-input">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as TicketPriorityEnum }))} className="form-input">
                    {PRIORITY_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select value={formData.ticketType} onChange={(e) => setFormData((p) => ({ ...p, ticketType: e.target.value as TicketTypeEnum }))} className="form-input">
                    {TYPE_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Channel</label>
                  <select value={formData.channel} onChange={(e) => setFormData((p) => ({ ...p, channel: e.target.value as TicketChannelEnum }))} className="form-input">
                    {CHANNEL_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Customer name</label>
                  <input type="text" value={formData.customerName ?? ''} onChange={(e) => setFormData((p) => ({ ...p, customerName: e.target.value }))} className="form-input" placeholder="Customer name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer email</label>
                  <input type="email" value={formData.customerEmail ?? ''} onChange={(e) => setFormData((p) => ({ ...p, customerEmail: e.target.value }))} className="form-input" placeholder="Customer email" />
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
