'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { FileSpreadsheet, Pencil, Plus, Save, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';

type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ZodiacSign =
  | 'ARIES'
  | 'TAURUS'
  | 'GEMINI'
  | 'CANCER'
  | 'LEO'
  | 'VIRGO'
  | 'LIBRA'
  | 'SCORPIO'
  | 'SAGITTARIUS'
  | 'CAPRICORN'
  | 'AQUARIUS'
  | 'PISCES';

interface HoroscopeDraft {
  id: string;
  period: HoroscopePeriod;
  zodiacSign: ZodiacSign;
  prediction: string;
  luckyNumber: string;
  color: string;
  education: string;
  expense: string;
}

type HoroscopeForm = Omit<HoroscopeDraft, 'id'>;

const PERIOD_OPTIONS: Array<{ value: HoroscopePeriod; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const ZODIAC_OPTIONS: Array<{ value: ZodiacSign; label: string }> = [
  { value: 'ARIES', label: 'Aries' },
  { value: 'TAURUS', label: 'Taurus' },
  { value: 'GEMINI', label: 'Gemini' },
  { value: 'CANCER', label: 'Cancer' },
  { value: 'LEO', label: 'Leo' },
  { value: 'VIRGO', label: 'Virgo' },
  { value: 'LIBRA', label: 'Libra' },
  { value: 'SCORPIO', label: 'Scorpio' },
  { value: 'SAGITTARIUS', label: 'Sagittarius' },
  { value: 'CAPRICORN', label: 'Capricorn' },
  { value: 'AQUARIUS', label: 'Aquarius' },
  { value: 'PISCES', label: 'Pisces' },
];

const CSV_HEADERS = ['period', 'zodiacSign', 'prediction', 'luckyNumber', 'color', 'education', 'expense'] as const;

function createInitialForm(): HoroscopeForm {
  return {
    period: 'daily',
    zodiacSign: 'ARIES',
    prediction: '',
    luckyNumber: '',
    color: '',
    education: '',
    expense: '',
  };
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
}

function isPeriod(value: string): value is HoroscopePeriod {
  return PERIOD_OPTIONS.some((option) => option.value === value);
}

function isZodiac(value: string): value is ZodiacSign {
  return ZODIAC_OPTIONS.some((option) => option.value === value);
}

interface HoroscopeDraftManagerProps {
  pageTitle: string;
  infoText: string;
  breadcrumbLabel: string;
  enableCsv: boolean;
}

export default function HoroscopeDraftManager({
  pageTitle,
  infoText,
  breadcrumbLabel,
  enableCsv,
}: HoroscopeDraftManagerProps) {
  const [formData, setFormData] = useState<HoroscopeForm>(createInitialForm());
  const [drafts, setDrafts] = useState<HoroscopeDraft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const totals = useMemo(
    () =>
      PERIOD_OPTIONS.map((period) => ({
        ...period,
        count: drafts.filter((draft) => draft.period === period.value).length,
      })),
    [drafts]
  );

  const filteredDrafts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return drafts;
    return drafts.filter((draft) =>
      [
        draft.period,
        draft.zodiacSign,
        draft.prediction,
        draft.luckyNumber,
        draft.color,
        draft.education,
        draft.expense,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [drafts, searchTerm]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.prediction.trim()) nextErrors.prediction = 'Horoscope text is required';
    if (!formData.luckyNumber.trim()) nextErrors.luckyNumber = 'Lucky number is required';
    if (!formData.color.trim()) nextErrors.color = 'Color is required';
    if (!formData.education.trim()) nextErrors.education = 'Education is required';
    if (!formData.expense.trim()) nextErrors.expense = 'Expense is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(createInitialForm());
    setErrors({});
    setEditingId(null);
  };

  const handleAddDraft = () => {
    if (!validate()) return;

    const nextDraft: HoroscopeDraft = {
      id: editingId ?? createId(),
      ...formData,
      prediction: formData.prediction.trim(),
      luckyNumber: formData.luckyNumber.trim(),
      color: formData.color.trim(),
      education: formData.education.trim(),
      expense: formData.expense.trim(),
    };

    setDrafts((prev) =>
      editingId ? prev.map((draft) => (draft.id === editingId ? nextDraft : draft)) : [nextDraft, ...prev]
    );
    setMessage(editingId ? 'Draft updated.' : 'Draft added.');
    resetForm();
  };

  const handleEdit = (draft: HoroscopeDraft) => {
    setFormData({
      period: draft.period,
      zodiacSign: draft.zodiacSign,
      prediction: draft.prediction,
      luckyNumber: draft.luckyNumber,
      color: draft.color,
      education: draft.education,
      expense: draft.expense,
    });
    setEditingId(draft.id);
  };

  const handleDelete = (id: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.id !== id));
    if (editingId === id) resetForm();
    setMessage('Draft removed.');
  };

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setMessage('CSV must include headers and at least one row.');
        return;
      }

      const headers = rows[0];
      const missing = CSV_HEADERS.filter((header) => !headers.includes(header));
      if (missing.length > 0) {
        setMessage(`Missing CSV columns: ${missing.join(', ')}`);
        return;
      }

      const imported: HoroscopeDraft[] = rows.slice(1).flatMap((row) => {
        const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])) as Record<string, string>;
        const period = record.period?.toLowerCase();
        const zodiacSign = record.zodiacSign?.toUpperCase();
        if (!isPeriod(period) || !isZodiac(zodiacSign)) return [];

        return [{
          id: createId(),
          period,
          zodiacSign,
          prediction: record.prediction ?? '',
          luckyNumber: record.luckyNumber ?? '',
          color: record.color ?? '',
          education: record.education ?? '',
          expense: record.expense ?? '',
        }];
      });

      if (imported.length === 0) {
        setMessage('No valid horoscope rows found in CSV.');
        return;
      }

      setDrafts((prev) => [...imported, ...prev]);
      setMessage(`${imported.length} rows imported from CSV.`);
    } catch {
      setMessage('Failed to read CSV file.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: breadcrumbLabel }]} />

        <PageHeaderWithInfo title={pageTitle} infoText={infoText} />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {totals.map((item) => (
            <div key={item.value} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="text-3xl font-bold text-black dark:text-white mt-2">{item.count}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Draft entries</div>
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-1 ${enableCsv ? 'xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]' : ''} gap-6`}>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">{editingId ? 'Edit Draft' : 'Add Single Horoscope'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Create horoscope entries manually. This screen is frontend-ready and can later be connected to backend horoscope APIs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="period" className="form-label">Period</label>
                <select id="period" name="period" value={formData.period} onChange={handleInputChange} className="form-input">
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="zodiacSign" className="form-label">Zodiac Sign</label>
                <select id="zodiacSign" name="zodiacSign" value={formData.zodiacSign} onChange={handleInputChange} className="form-input">
                  {ZODIAC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group md:col-span-2">
                <label htmlFor="prediction" className="form-label">Horoscope Text</label>
                <textarea id="prediction" name="prediction" rows={5} value={formData.prediction} onChange={handleInputChange} className={`form-input ${errors.prediction ? 'error' : ''}`} />
                {errors.prediction && <span className="form-error">{errors.prediction}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="luckyNumber" className="form-label">Lucky Number</label>
                <input id="luckyNumber" name="luckyNumber" value={formData.luckyNumber} onChange={handleInputChange} className={`form-input ${errors.luckyNumber ? 'error' : ''}`} />
                {errors.luckyNumber && <span className="form-error">{errors.luckyNumber}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="color" className="form-label">Color</label>
                <input id="color" name="color" value={formData.color} onChange={handleInputChange} className={`form-input ${errors.color ? 'error' : ''}`} />
                {errors.color && <span className="form-error">{errors.color}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="education" className="form-label">Education</label>
                <input id="education" name="education" value={formData.education} onChange={handleInputChange} className={`form-input ${errors.education ? 'error' : ''}`} />
                {errors.education && <span className="form-error">{errors.education}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="expense" className="form-label">Expense</label>
                <input id="expense" name="expense" value={formData.expense} onChange={handleInputChange} className={`form-input ${errors.expense ? 'error' : ''}`} />
                {errors.expense && <span className="form-error">{errors.expense}</span>}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" className="btn-primary btn-small" onClick={handleAddDraft}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                <span>{editingId ? 'Update Draft' : 'Add Draft'}</span>
              </button>
              <button type="button" className="btn-secondary btn-small" onClick={resetForm}>Reset</button>
            </div>
          </div>

          {enableCsv ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-emerald-600" />
                  <div>
                    <h2 className="text-xl font-bold text-black dark:text-white">CSV Upload</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Import multiple horoscope rows in one step.</p>
                  </div>
                </div>

                <div style={{ border: '1px dashed #94a3b8', borderRadius: 14, padding: 20, background: '#f8fafc' }}>
                  <div className="text-sm font-semibold text-black">Required CSV columns</div>
                  <div className="text-sm text-slate-600 mt-2">{CSV_HEADERS.join(', ')}</div>
                  <label className="btn-secondary btn-small" style={{ marginTop: 16, cursor: 'pointer' }}>
                    <Upload size={16} />
                    <span>Upload CSV</span>
                    <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {message ? (
          <div style={{ padding: 12, borderRadius: 10, background: '#eff6ff', color: '#1e3a8a', fontSize: 14, fontWeight: 600 }}>
            {message}
          </div>
        ) : null}

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-black dark:text-white">Horoscope Draft Table</h2>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search draft rows..."
              className="form-input max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Period</th>
                  <th className="py-3 pr-4">Zodiac Sign</th>
                  <th className="py-3 pr-4">Prediction</th>
                  <th className="py-3 pr-4">Lucky Number</th>
                  <th className="py-3 pr-4">Color</th>
                  <th className="py-3 pr-4">Education</th>
                  <th className="py-3 pr-4">Expense</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrafts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No horoscope drafts yet.
                    </td>
                  </tr>
                ) : (
                  filteredDrafts.map((draft) => (
                    <tr key={draft.id} className="border-b border-slate-100 dark:border-slate-800 align-top">
                      <td className="py-3 pr-4 font-medium text-black dark:text-white">
                        {PERIOD_OPTIONS.find((item) => item.value === draft.period)?.label ?? draft.period}
                      </td>
                      <td className="py-3 pr-4">{ZODIAC_OPTIONS.find((item) => item.value === draft.zodiacSign)?.label ?? draft.zodiacSign}</td>
                      <td className="py-3 pr-4 min-w-[260px] text-slate-600 dark:text-slate-300">{draft.prediction}</td>
                      <td className="py-3 pr-4">{draft.luckyNumber}</td>
                      <td className="py-3 pr-4">{draft.color}</td>
                      <td className="py-3 pr-4">{draft.education}</td>
                      <td className="py-3 pr-4">{draft.expense}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button type="button" className="btn-icon-edit" onClick={() => handleEdit(draft)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="btn-icon-delete" onClick={() => handleDelete(draft.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
