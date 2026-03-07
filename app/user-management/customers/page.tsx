'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  X,
  Check,
  Trash2,
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
import { customerApi } from '@/app/lib/customer-api.service';
import type { CustomerResponse, CustomerCreateRequest } from '@/app/lib/customer-api.types';

function mapItem(raw: CustomerResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const status = statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive';
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    email: (raw.email ?? (raw as unknown as Record<string, unknown>).emailAddress as string) ?? '',
    mobileNumber: raw.mobileNumber ?? raw.phone ?? '',
    status,
  };
}

const initialFormData: CustomerCreateRequest = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  notes: '',
};

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [customers, setCustomers] = useState<ReturnType<typeof mapItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'mobileNumber' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<CustomerCreateRequest>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await customerApi.list({ pageNo: 0, pageSize: 1000 });
      setCustomers((list ?? []).map(mapItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Enter a valid email';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.password?.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError(null);
    try {
      await customerApi.create({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName?.trim() || undefined,
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password?.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim(),
        notes: formData.notes?.trim() || undefined,
      });
      await Swal.fire({ title: 'Created', text: 'Customer added successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      await fetchCustomers();
      setShowAddModal(false);
      setFormData(initialFormData);
      setErrors({});
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Failed to add customer' }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setShowAddModal(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.mobileNumber && c.mobileNumber.includes(searchTerm))
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    switch (sortKey) {
      case 'name':
        aVal = (a.name || a.email).toLowerCase();
        bVal = (b.name || b.email).toLowerCase();
        break;
      case 'email':
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
        break;
      case 'mobileNumber':
        aVal = a.mobileNumber ?? '';
        bVal = b.mobileNumber ?? '';
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
        <Breadcrumb items={[{ label: 'User Management' }, { label: 'Customers' }]} />
        <PageHeaderWithInfo
          title="Customers"
          infoText="View and manage customer list. Search and sort by name, email, or phone."
        >
          <button type="button" className="btn-primary btn-small" onClick={() => { setErrors({}); setFormData(initialFormData); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </PageHeaderWithInfo>
        {error && (
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
                <SortableTh columnKey="name">Name</SortableTh>
                <SortableTh columnKey="email">Email</SortableTh>
                <SortableTh columnKey="mobileNumber">Phone</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    <p>{customers.length === 0 ? 'No customers found' : 'No customers match your search'}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="org-name-cell">
                        <span className="org-name">{row.name || row.email || '—'}</span>
                      </div>
                    </td>
                    <td>{row.email || '—'}</td>
                    <td>{row.mobileNumber || '—'}</td>
                    <td>
                      <span className={`status-badge ${row.status}`}>
                        {row.status === 'active' && <Check size={14} />}
                        {row.status === 'inactive' && <X size={14} />}
                        {row.status === 'deleted' && <Trash2 size={14} />}
                        <span>{row.status === 'active' ? 'Active' : row.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && (
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    <div className="pagination-container">
                      <div className="pagination-left">
                        <label htmlFor="items-per-page-customers" className="pagination-label">
                          Show:
                        </label>
                        <select
                          id="items-per-page-customers"
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
                        Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, filtered.length)} of{' '}
                        {filtered.length}
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
                            <button
                              type="button"
                              className="pagination-number active"
                              disabled
                              aria-current="page"
                            >
                              1
                            </button>
                          ) : (
                            Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
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
                              if (page === currentPage - 2 || page === currentPage + 2)
                                return (
                                  <span key={page} className="pagination-ellipsis" aria-hidden>
                                    ...
                                  </span>
                                );
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

        {showAddModal && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="modal-header">
                <h2>Add Customer</h2>
                <button type="button" className="modal-close-btn" onClick={resetForm} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First name <span className="required">*</span></label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`form-input ${errors.firstName ? 'error' : ''}`} placeholder="First name" />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="middleName" className="form-label">Middle name</label>
                  <input type="text" id="middleName" name="middleName" value={formData.middleName ?? ''} onChange={handleInputChange} className="form-input" placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Last name <span className="required">*</span></label>
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`form-input ${errors.lastName ? 'error' : ''}`} placeholder="Last name" />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className={`form-input ${errors.email ? 'error' : ''}`} placeholder="email@example.com" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password <span className="required">*</span></label>
                  <input type="password" id="password" name="password" value={formData.password ?? ''} onChange={handleInputChange} className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Password for login" />
                  {errors.password && <span className="form-error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">Phone number <span className="required">*</span></label>
                  <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className={`form-input ${errors.phoneNumber ? 'error' : ''}`} placeholder="Phone number" />
                  {errors.phoneNumber && <span className="form-error">{errors.phoneNumber}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea id="notes" name="notes" value={formData.notes ?? ''} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional" />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small">
                    <Save size={16} />
                    <span>Create</span>
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
