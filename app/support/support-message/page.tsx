'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Building2,
  X,
  Send,
  Info,
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { supportEmailService } from '@/app/lib/communication.service';
import type { SupportEmailResponse } from '@/app/lib/communication.types';

function formatDate(value: string | undefined): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  } catch {
    return value;
  }
}

type SortKey = 'name' | 'email' | 'subject' | 'createdAt';

export default function SupportMessagePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [emails, setEmails] = useState<SupportEmailResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailEmail, setDetailEmail] = useState<SupportEmailResponse | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pageNo = Math.max(0, currentPage - 1);
      const res = await supportEmailService.list({
        pageNo,
        pageSize: itemsPerPage,
        sortBy: sortBy === 'createdAt' ? 'createdAt' : sortBy,
        direction: sortDirection,
        ...(searchTerm.trim() ? { name: searchTerm.trim() } : {}),
      });
      const data = res.data as { result?: SupportEmailResponse[]; totalElementCount?: number } | undefined;
      const list = data?.result ?? [];
      const total = data?.totalElementCount ?? 0;
      setEmails(list);
      setTotalCount(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support emails');
      setEmails([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, sortBy, sortDirection]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await supportEmailService.getById(id);
      const data = res.data as SupportEmailResponse | undefined;
      if (data) setDetailEmail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load detail');
    }
  }, []);

  const handleRowClick = (row: SupportEmailResponse) => {
    setDetailEmail(null);
    setReplyMessage('');
    setReplyError(null);
    setShowReplyModal(false);
    fetchDetail(row.id);
  };

  const handleOpenReplyModal = () => {
    setReplyMessage('');
    setReplyError(null);
    setShowReplyModal(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailEmail) return;
    const text = replyMessage.trim().replace(/<[^>]*>/g, '').trim();
    if (!text) return;
    setSendingReply(true);
    setReplyError(null);
    try {
      await supportEmailService.addReply(detailEmail.id, { message: replyMessage.trim() });
      setReplyMessage('');
      setShowReplyModal(false);
      await fetchDetail(detailEmail.id);
      await fetchList();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children, style }: { columnKey: SortKey; children: React.ReactNode; style?: React.CSSProperties }) => (
    <th role="button" tabIndex={0} onClick={() => handleSort(columnKey)} onKeyDown={(e) => e.key === 'Enter' && handleSort(columnKey)} className="sortable-th" style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 14 }}>
          {sortBy === columnKey ? (sortDirection === 'asc' ? <ChevronUp size={14} color="#2563eb" strokeWidth={2.4} /> : <ChevronDown size={14} color="#2563eb" strokeWidth={2.4} />) : <ArrowUpDown size={14} color="#94a3b8" strokeWidth={1.9} />}
        </span>
      </span>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Message Management', href: '/support' }, { label: 'Support Message' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Support Message</h1>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Support message information" title="View support emails and send replies" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#334155', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' }}>
                <Info size={18} />
              </button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 260, padding: '10px 12px', borderRadius: 12, border: '1px solid #dbe2ea', background: '#ffffff', color: '#334155', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)', fontSize: 12, lineHeight: 1.5, fontWeight: 500 }}>
                  <div style={{ position: 'absolute', left: -6, top: '50%', width: 10, height: 10, background: '#ffffff', borderLeft: '1px solid #dbe2ea', borderBottom: '1px solid #dbe2ea', transform: 'translateY(-50%) rotate(45deg)' }} />
                  View support emails from the Contact Us form. Click a row or use Reply to open the thread and send a reply email.
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>
        )}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="search-input" />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name" style={{ minWidth: 220 }}>Name</SortableTh>
                <SortableTh columnKey="email" style={{ minWidth: 180 }}>Email</SortableTh>
                <SortableTh columnKey="subject" style={{ minWidth: 120 }}>Subject</SortableTh>
                <th style={{ minWidth: 200 }}>Message</th>
                <th style={{ width: 90 }}>Company</th>
                <SortableTh columnKey="createdAt" style={{ minWidth: 140 }}>Created</SortableTh>
                <th style={{ textTransform: 'capitalize', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : emails.length === 0 ? (
                <tr><td colSpan={7} className="empty-state"><p>No support emails found</p></td></tr>
              ) : (
                emails.map((row) => (
                  <tr key={row.id} role="button" tabIndex={0} onClick={() => handleRowClick(row)} onKeyDown={(e) => e.key === 'Enter' && handleRowClick(row)} className="data-table-row-clickable" style={{ cursor: 'pointer' }}>
                    <td style={{ minWidth: 220 }}>
                      <div className="org-name-cell">
                        <User size={14} style={{ flexShrink: 0, color: '#64748b' }} />
                        <span className="org-name">{row.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell" style={{ color: '#64748b' }}>
                        <Mail size={14} />
                        <span>{row.email}</span>
                      </div>
                    </td>
                    <td><span className="org-code">{row.subject || '-'}</span></td>
                    <td><div style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.message || '-'}</div></td>
                    <td><span className={`status-badge ${row.isCompany ? 'active' : 'inactive'}`}>{row.isCompany ? 'Yes' : 'No'}</span></td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{formatDate(row.createdAt)}</td>
                    <td style={{ width: 100 }} onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button type="button" className="btn-icon-edit" title="Send reply email" onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}><Send size={18} /></button>
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
                        <label htmlFor="items-per-page-support" className="pagination-label">Show:</label>
                        <select id="items-per-page-support" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                          <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                        <span className="pagination-label">per page</span>
                      </div>
                      <div className="pagination-info">Showing {startIndex} to {endIndex} of {totalCount}</div>
                      <div className="pagination-controls">
                        <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}><ChevronLeft size={18} /><span>Previous</span></button>
                        <div className="pagination-numbers">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                              return (
                                <button key={page} type="button" className={`pagination-number ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                              );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="pagination-ellipsis" aria-hidden>...</span>;
                            return null;
                          })}
                        </div>
                        <button type="button" className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}><span>Next</span><ChevronRight size={18} /></button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {detailEmail && !showReplyModal && (
          <div className="modal-overlay" onClick={() => setDetailEmail(null)}>
            <div className="modal-content organization-modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Support email</h2>
                <button type="button" className="modal-close-btn" onClick={() => setDetailEmail(null)} aria-label="Close"><X size={20} /></button>
              </div>
              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 20px', fontSize: '0.8125rem', lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><User size={12} style={{ flexShrink: 0, color: '#64748b' }} />Name</span>
                    <span style={{ minWidth: 0 }}>{detailEmail.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><Mail size={12} style={{ flexShrink: 0, color: '#64748b' }} />Email</span>
                    <span style={{ minWidth: 0 }}>{detailEmail.email}</span>
                  </div>
                  {detailEmail.mobileNumber && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><Phone size={12} style={{ flexShrink: 0, color: '#64748b' }} />Mobile</span>
                      <span style={{ minWidth: 0 }}>{detailEmail.mobileNumber}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><Building2 size={12} style={{ flexShrink: 0, color: '#64748b' }} />Company</span>
                    <span style={{ minWidth: 0 }}>{detailEmail.isCompany ? 'Yes' : 'No'}{detailEmail.companyName ? ` · ${detailEmail.companyName}` : ''}</span>
                  </div>
                  {detailEmail.address && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', gridColumn: '1 / -1' }}>
                      <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><MapPin size={12} style={{ flexShrink: 0, color: '#64748b' }} />Address</span>
                      <span style={{ minWidth: 0 }}>{detailEmail.address}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', gridColumn: '1 / -1' }}>
                    <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><FileText size={12} style={{ flexShrink: 0, color: '#64748b' }} />Subject</span>
                    <span style={{ minWidth: 0 }}>{detailEmail.subject || '-'}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                      <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><MessageSquare size={12} style={{ flexShrink: 0, color: '#64748b' }} />Message</span>
                    </div>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontSize: '0.8125rem' }}>{detailEmail.message || '-'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                    <span style={{ fontWeight: 600, color: '#475569', minWidth: 72, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}><Calendar size={12} style={{ flexShrink: 0, color: '#64748b' }} />Created</span>
                    <span style={{ color: '#64748b', minWidth: 0 }}>{formatDate(detailEmail.createdAt)}</span>
                  </div>
                </div>
                {(detailEmail.replies?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569' }}>Replies ({detailEmail.replies!.length})</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                      {detailEmail.replies!.map((r) => (
                        <div key={r.id} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.message}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>{formatDate(r.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                  <button type="button" className="btn-secondary" onClick={() => setDetailEmail(null)}>Close</button>
                  <button type="button" className="btn-primary btn-small" onClick={handleOpenReplyModal}><Send size={16} /><span>Reply</span></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailEmail && showReplyModal && (
          <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
            <div className="modal-content organization-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Send reply</h2>
                <button type="button" className="modal-close-btn" onClick={() => setShowReplyModal(false)} aria-label="Close"><X size={20} /></button>
              </div>
              <form onSubmit={handleSendReply} style={{ padding: '0 1.25rem 1.25rem' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 4 }}>Subject</label>
                  <p style={{ margin: 0, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem' }}>{detailEmail.subject || '(No subject)'}</p>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 4 }}>Original message</label>
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', maxHeight: 120, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{detailEmail.message || '-'}</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', display: 'block', marginBottom: 4 }}>Your reply</label>
                  <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply..." rows={6} style={{ width: '100%', padding: '10px 12px', fontSize: '0.875rem', border: '1px solid #e2e8f0', borderRadius: 8, resize: 'vertical', minHeight: 160 }} />
                </div>
                {replyError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: 10 }}>{replyError}</p>}
                <div className="form-actions" style={{ marginTop: 12 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowReplyModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={sendingReply || !replyMessage.trim()}><Send size={16} /><span>{sendingReply ? 'Sending...' : 'Send reply'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
