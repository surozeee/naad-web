'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
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
import DashboardLayout from '../../../components/DashboardLayout';
import Breadcrumb from '../../../components/common/Breadcrumb';
import { PageHeaderWithInfo } from '../../../components/common/PageHeaderWithInfo';
import { masterService } from '@/app/lib/master.service';
import type { NepaliCalendarRequest, StatusEnum } from '@/app/lib/master.types';

const MONTH_FIELDS = [
  { key: 'baishakhDay' as const, short: 'Bai', label: 'Baishakh' },
  { key: 'jesthaDay' as const, short: 'Jes', label: 'Jestha' },
  { key: 'asarDay' as const, short: 'Asa', label: 'Asar' },
  { key: 'shrawanDay' as const, short: 'Shr', label: 'Shrawan' },
  { key: 'bhadraDay' as const, short: 'Bha', label: 'Bhadra' },
  { key: 'ashojDay' as const, short: 'Ash', label: 'Ashoj' },
  { key: 'kartikDay' as const, short: 'Kar', label: 'Kartik' },
  { key: 'mangsirDay' as const, short: 'Man', label: 'Mangsir' },
  { key: 'poushDay' as const, short: 'Pou', label: 'Poush' },
  { key: 'maghDay' as const, short: 'Mag', label: 'Magh' },
  { key: 'falgunDay' as const, short: 'Fal', label: 'Falgun' },
  { key: 'chaitraDay' as const, short: 'Cha', label: 'Chaitra' },
] as const;

type MonthKey = (typeof MONTH_FIELDS)[number]['key'];

interface NepaliCalRow {
  id: string;
  year: number;
  baishakhDay: number;
  jesthaDay: number;
  asarDay: number;
  shrawanDay: number;
  bhadraDay: number;
  ashojDay: number;
  kartikDay: number;
  mangsirDay: number;
  poushDay: number;
  maghDay: number;
  falgunDay: number;
  chaitraDay: number;
  status: 'active' | 'inactive' | 'deleted';
}

type FormStrings = { year: string } & Record<MonthKey, string>;

function emptyForm(): FormStrings {
  const base = { year: '' } as FormStrings;
  for (const { key } of MONTH_FIELDS) base[key] = '';
  return base;
}

function mapApiToRow(raw: Record<string, unknown>): NepaliCalRow {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const num = (k: string) => Number(raw[k] ?? 0);
  return {
    id: String(raw.id ?? ''),
    year: num('year') || 0,
    baishakhDay: num('baishakhDay'),
    jesthaDay: num('jesthaDay'),
    asarDay: num('asarDay'),
    shrawanDay: num('shrawanDay'),
    bhadraDay: num('bhadraDay'),
    ashojDay: num('ashojDay'),
    kartikDay: num('kartikDay'),
    mangsirDay: num('mangsirDay'),
    poushDay: num('poushDay'),
    maghDay: num('maghDay'),
    falgunDay: num('falgunDay'),
    chaitraDay: num('chaitraDay'),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

function rowToForm(row: NepaliCalRow): FormStrings {
  const f = emptyForm();
  f.year = String(row.year);
  for (const { key } of MONTH_FIELDS) f[key] = String(row[key]);
  return f;
}

function parseForm(f: FormStrings): NepaliCalendarRequest | null {
  const year = parseInt(f.year, 10);
  if (Number.isNaN(year) || year < 1970 || year > 2100) return null;
  const body: NepaliCalendarRequest = { year } as NepaliCalendarRequest;
  for (const { key } of MONTH_FIELDS) {
    const v = parseInt(f[key], 10);
    if (Number.isNaN(v) || v < 28 || v > 32) return null;
    body[key] = v;
  }
  return body;
}

type SortKey = 'year' | 'status';

export default function NepaliCalendarSetupPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [items, setItems] = useState<NepaliCalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState<FormStrings>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await masterService.nepaliCalendar.list({
        pageNo: 0,
        pageSize: 500,
        searchKey: searchTerm.trim() || undefined,
        sortBy: 'year',
        sortDirection: 'asc',
      });
      const list = (res.data?.result ?? res.result ?? res.content ?? []) as unknown as Record<string, unknown>[];
      setItems(list.map(mapApiToRow).filter((r) => r.id && r.year > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Nepali calendar');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'year') cmp = a.year - b.year;
      else {
        const order = { active: 0, inactive: 1, deleted: 2 };
        cmp = order[a.status] - order[b.status];
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [items, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);
  const hasNoData = sorted.length === 0;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children, style }: { columnKey: SortKey; children: React.ReactNode; style?: React.CSSProperties }) => (
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
        {sortBy === columnKey ? (
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

  const handleFieldChange = (name: keyof FormStrings, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    const parsed = parseForm(formData);
    if (!parsed) {
      if (!formData.year.trim()) next.year = 'Year is required';
      else {
        const y = parseInt(formData.year, 10);
        if (Number.isNaN(y) || y < 1970 || y > 2100) next.year = 'Year must be 1970–2100';
      }
      for (const { key, label } of MONTH_FIELDS) {
        const v = parseInt(formData[key], 10);
        if (!formData[key].trim()) next[key] = `${label} days required`;
        else if (Number.isNaN(v) || v < 28 || v > 32) next[key] = 'Use 28–32';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setFormData(emptyForm());
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const body = parseForm(formData);
    if (!body) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) await masterService.nepaliCalendar.update(editingId, body);
      else await masterService.nepaliCalendar.create(body);
      await Swal.fire({
        title: editingId ? 'Updated' : 'Created',
        text: editingId ? 'Nepali calendar year updated.' : 'Nepali calendar year created.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      await fetchItems();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row: NepaliCalRow) => {
    setFormData(rowToForm(row));
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: NepaliCalRow) => {
    const newStatus: StatusEnum = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set year <strong>${row.year}</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.nepaliCalendar.changeStatus(row.id, newStatus);
      await fetchItems();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete this year?',
      text: 'This removes the Nepali calendar row from master data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await masterService.nepaliCalendar.delete(id);
      await fetchItems();
      await Swal.fire({ title: 'Deleted', text: 'Row deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb
          items={[
            { label: 'Master Setting', href: '/master-setting' },
            { label: 'Nepali Calendar Days' },
          ]}
        />
        <PageHeaderWithInfo
          title="Nepali Calendar Days"
          infoText="When the database has no rows yet, Master-Service loads years and each month’s day count from classpath CSV (NepaliCalendarDataLoader). After that, this table lists all years; you can edit, add years, or change status. Event calendar reads active years via list-active."
        >
          <button type="button" className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Year</span>
          </button>
        </PageHeaderWithInfo>

        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by BS year..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <SortableTh columnKey="year" style={{ position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1 }}>
                  Year
                </SortableTh>
                {MONTH_FIELDS.map((m) => (
                  <th key={m.key} title={m.label} style={{ textAlign: 'center', fontSize: 11 }}>
                    {m.short}
                  </th>
                ))}
                <SortableTh columnKey="status">Status</SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading...
                  </td>
                </tr>
              ) : hasNoData ? (
                <tr>
                  <td colSpan={15} className="empty-state">
                    <p>No Nepali calendar rows yet. If the DB was empty on first start, ensure CSV exists at Master-Service resources (nepali_calendar_days.csv). You can also add a year manually.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id}>
                    <td style={{ position: 'sticky', left: 0, background: '#fff', fontWeight: 600 }}>{row.year}</td>
                    {MONTH_FIELDS.map((m) => (
                      <td key={m.key} style={{ textAlign: 'center' }}>
                        {row[m.key]}
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className="status-badge-button"
                        style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
                        onClick={() => handleChangeStatus(row)}
                        title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        <span className={`status-badge ${row.status}`}>
                          {row.status === 'active' && <Check size={14} />}
                          {row.status === 'inactive' && <X size={14} />}
                          {row.status === 'deleted' && <Trash2 size={14} />}
                          <span>{row.status === 'active' ? 'Active' : row.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-icon-edit" title="Edit" onClick={() => handleEdit(row)}>
                          <Edit size={18} />
                        </button>
                        <button type="button" className="btn-icon-delete" title="Delete" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={15}>
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <label htmlFor="nc-items-per-page" className="pagination-label">
                        Show:
                      </label>
                      <select
                        id="nc-items-per-page"
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
                      Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, sorted.length)} of {sorted.length}
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
          </table>
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={22} />
                  {editingId ? 'Edit BS year (days per month)' : 'Add BS year (days per month)'}
                </h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
                <div className="form-group">
                  <label htmlFor="year" className="form-label">
                    BS Year <span className="required">*</span>
                  </label>
                  <input
                    id="year"
                    type="number"
                    min={1970}
                    max={2100}
                    value={formData.year}
                    onChange={(e) => handleFieldChange('year', e.target.value)}
                    className={`form-input ${errors.year ? 'error' : ''}`}
                  />
                  {errors.year && <span className="form-error">{errors.year}</span>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MONTH_FIELDS.map(({ key, label }) => (
                    <div key={key} className="form-group">
                      <label htmlFor={key} className="form-label">
                        {label} (days)
                      </label>
                      <input
                        id={key}
                        type="number"
                        min={28}
                        max={32}
                        value={formData[key]}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className={`form-input ${errors[key] ? 'error' : ''}`}
                      />
                      {errors[key] && <span className="form-error">{errors[key]}</span>}
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                    {submitting ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>{editingId ? 'Update' : 'Create'}</span>
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
