'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { FileSpreadsheet, Pencil, Plus, Save, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';

type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ZodiacOption =
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

interface HoroscopeEntry {
  id: string;
  period: HoroscopePeriod;
  zodiacSign: ZodiacOption;
  prediction: string;
  luckyNumber: string;
  color: string;
  education: string;
  expense: string;
}

type HoroscopeFormState = Omit<HoroscopeEntry, 'id'>;

const PERIOD_OPTIONS: Array<{ value: HoroscopePeriod; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const ZODIAC_OPTIONS: Array<{ value: ZodiacOption; label: string }> = [
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

function createInitialForm(): HoroscopeFormState {
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

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentCell = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i += 1;
      currentRow.push(currentCell.trim());
      if (currentRow.some((value) => value !== '')) rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((value) => value !== '')) rows.push(currentRow);
  }

  return rows;
}

function isValidPeriod(value: string): value is HoroscopePeriod {
  return PERIOD_OPTIONS.some((item) => item.value === value);
}

function isValidZodiac(value: string): value is ZodiacOption {
  return ZODIAC_OPTIONS.some((item) => item.value === value);
}

function normalizeCsvValue(value: string): string {
  return value.trim().replace(/^"|"$/g, '');
}

export default function AddHoroscopeCsvPage() {
  const [formData, setFormData] = useState<HoroscopeFormState>(createInitialForm());
  const [entries, setEntries] = useState<HoroscopeEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvMessage, setCsvMessage] = useState<string>('');

  const totals = useMemo(
    () =>
      PERIOD_OPTIONS.map((period) => ({
        ...period,
        count: entries.filter((entry) => entry.period === period.value).length,
      })),
    [entries]
  );

  const groupedEntries = useMemo(
    () =>
      PERIOD_OPTIONS.map((period) => ({
        ...period,
        items: entries.filter((entry) => entry.period === period.value),
      })),
    [entries]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!formData.period) nextErrors.period = 'Period is required';
    if (!formData.zodiacSign) nextErrors.zodiacSign = 'Zodiac sign is required';
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

  const handleAddOrUpdate = () => {
    if (!validateForm()) return;

    const payload: HoroscopeEntry = {
      id: editingId ?? createEntryId(),
      period: formData.period,
      zodiacSign: formData.zodiacSign,
      prediction: formData.prediction.trim(),
      luckyNumber: formData.luckyNumber.trim(),
      color: formData.color.trim(),
      education: formData.education.trim(),
      expense: formData.expense.trim(),
    };

    setEntries((prev) =>
      editingId ? prev.map((item) => (item.id === editingId ? payload : item)) : [payload, ...prev]
    );
    setCsvMessage(editingId ? 'Horoscope draft updated.' : 'Horoscope draft added.');
    resetForm();
  };

  const handleEdit = (entry: HoroscopeEntry) => {
    setFormData({
      period: entry.period,
      zodiacSign: entry.zodiacSign,
      prediction: entry.prediction,
      luckyNumber: entry.luckyNumber,
      color: entry.color,
      education: entry.education,
      expense: entry.expense,
    });
    setEditingId(entry.id);
    setCsvMessage('');
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setCsvMessage('Horoscope draft removed.');
  };

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);

      if (rows.length < 2) {
        setCsvMessage('CSV must include a header row and at least one data row.');
        return;
      }

      const headerMap = rows[0].map((cell) => normalizeCsvValue(cell).toLowerCase());
      const missingHeaders = CSV_HEADERS.filter((header) => !headerMap.includes(header));

      if (missingHeaders.length > 0) {
        setCsvMessage(`Missing CSV columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const importedEntries: HoroscopeEntry[] = [];

      for (const row of rows.slice(1)) {
        const rowData = Object.fromEntries(
          headerMap.map((header, index) => [header, normalizeCsvValue(row[index] ?? '')])
        ) as Record<string, string>;

        const period = rowData.period?.toLowerCase();
        const zodiacSign = rowData.zodiacSign?.toUpperCase();

        if (!isValidPeriod(period) || !isValidZodiac(zodiacSign)) continue;

        importedEntries.push({
          id: createEntryId(),
          period,
          zodiacSign,
          prediction: rowData.prediction ?? '',
          luckyNumber: rowData.luckyNumber ?? '',
          color: rowData.color ?? '',
          education: rowData.education ?? '',
          expense: rowData.expense ?? '',
        });
      }

      if (importedEntries.length === 0) {
        setCsvMessage('No valid horoscope rows were found in the CSV file.');
        return;
      }

      setEntries((prev) => [...importedEntries, ...prev]);
      setCsvMessage(`${importedEntries.length} horoscope rows imported from CSV.`);
    } catch {
      setCsvMessage('Failed to read CSV file.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Add Horoscope CSV' }]} />

        <PageHeaderWithInfo
          title="Add Horoscope CSV"
          infoText="Create horoscope entries one by one for daily, weekly, monthly, and yearly periods, or import multiple zodiac entries from CSV."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {totals.map((item) => (
            <div
              key={item.value}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-lg"
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="text-3xl font-bold text-black dark:text-white mt-2">{item.count}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Draft entries</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)] gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-black dark:text-white">
                {editingId ? 'Edit Horoscope Draft' : 'Add Single Horoscope'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Add one zodiac horoscope at a time with period-specific details.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="period" className="form-label">
                    Period <span className="required">*</span>
                  </label>
                  <select
                    id="period"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    className={`form-input ${errors.period ? 'error' : ''}`}
                  >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.period && <span className="form-error">{errors.period}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="zodiacSign" className="form-label">
                    Zodiac Sign <span className="required">*</span>
                  </label>
                  <select
                    id="zodiacSign"
                    name="zodiacSign"
                    value={formData.zodiacSign}
                    onChange={handleInputChange}
                    className={`form-input ${errors.zodiacSign ? 'error' : ''}`}
                  >
                    {ZODIAC_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.zodiacSign && <span className="form-error">{errors.zodiacSign}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="prediction" className="form-label">
                  Horoscope Text <span className="required">*</span>
                </label>
                <textarea
                  id="prediction"
                  name="prediction"
                  rows={5}
                  value={formData.prediction}
                  onChange={handleInputChange}
                  className={`form-input ${errors.prediction ? 'error' : ''}`}
                  placeholder="Write the horoscope prediction here..."
                />
                {errors.prediction && <span className="form-error">{errors.prediction}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="luckyNumber" className="form-label">
                    Lucky Number <span className="required">*</span>
                  </label>
                  <input
                    id="luckyNumber"
                    name="luckyNumber"
                    type="text"
                    value={formData.luckyNumber}
                    onChange={handleInputChange}
                    className={`form-input ${errors.luckyNumber ? 'error' : ''}`}
                    placeholder="e.g. 7"
                  />
                  {errors.luckyNumber && <span className="form-error">{errors.luckyNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="color" className="form-label">
                    Color <span className="required">*</span>
                  </label>
                  <input
                    id="color"
                    name="color"
                    type="text"
                    value={formData.color}
                    onChange={handleInputChange}
                    className={`form-input ${errors.color ? 'error' : ''}`}
                    placeholder="e.g. Red"
                  />
                  {errors.color && <span className="form-error">{errors.color}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="education" className="form-label">
                    Education <span className="required">*</span>
                  </label>
                  <input
                    id="education"
                    name="education"
                    type="text"
                    value={formData.education}
                    onChange={handleInputChange}
                    className={`form-input ${errors.education ? 'error' : ''}`}
                    placeholder="e.g. Good progress"
                  />
                  {errors.education && <span className="form-error">{errors.education}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="expense" className="form-label">
                    Expense <span className="required">*</span>
                  </label>
                  <input
                    id="expense"
                    name="expense"
                    type="text"
                    value={formData.expense}
                    onChange={handleInputChange}
                    className={`form-input ${errors.expense ? 'error' : ''}`}
                    placeholder="e.g. Balanced"
                  />
                  {errors.expense && <span className="form-error">{errors.expense}</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-primary btn-small" onClick={handleAddOrUpdate}>
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  <span>{editingId ? 'Update Draft' : 'Add Draft'}</span>
                </button>
                <button type="button" className="btn-secondary btn-small" onClick={resetForm}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-emerald-600" />
                  <div>
                    <h2 className="text-xl font-bold text-black dark:text-white">CSV Upload</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Import multiple horoscope rows in one step.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div
                  style={{
                    border: '1px dashed #94a3b8',
                    borderRadius: 14,
                    padding: 20,
                    background: '#f8fafc',
                  }}
                >
                  <div className="text-sm font-semibold text-black">Required CSV columns</div>
                  <div className="text-sm text-slate-600 mt-2">{CSV_HEADERS.join(', ')}</div>
                  <label className="btn-secondary btn-small" style={{ marginTop: 16, cursor: 'pointer' }}>
                    <Upload size={16} />
                    <span>Upload CSV</span>
                    <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                {csvMessage ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      background: '#eff6ff',
                      color: '#1e3a8a',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {csvMessage}
                  </div>
                ) : null}

                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div className="text-sm font-semibold text-black">Sample row</div>
                  <div className="text-xs text-slate-600 mt-2">
                    daily,ARIES,"Today brings progress and new confidence.",7,Red,Good progress,Balanced
                  </div>
                  <div className="text-xs text-slate-500 mt-3">
                    Draft entries stay on this page until a backend save API is added.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-black dark:text-white">Draft Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Review added horoscope items grouped by period.
                </p>
              </div>

              <div className="p-6 space-y-5">
                {entries.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    No horoscope drafts yet. Add one manually or import a CSV file.
                  </div>
                ) : (
                  groupedEntries.map((group) => (
                    <div key={group.value}>
                      <div className="text-sm font-bold text-black dark:text-white mb-3">
                        {group.label} ({group.items.length})
                      </div>
                      {group.items.length === 0 ? (
                        <div className="text-sm text-slate-400 mb-4">No entries in this period.</div>
                      ) : (
                        <div className="space-y-3">
                          {group.items.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                              style={{ background: '#ffffff' }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-base font-semibold text-black">
                                    {ZODIAC_OPTIONS.find((item) => item.value === entry.zodiacSign)?.label ?? entry.zodiacSign}
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1">{entry.prediction}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button type="button" className="btn-icon-edit" onClick={() => handleEdit(entry)}>
                                    <Pencil size={16} />
                                  </button>
                                  <button type="button" className="btn-icon-delete" onClick={() => handleDelete(entry.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                                <div><strong>Lucky Number:</strong> {entry.luckyNumber}</div>
                                <div><strong>Color:</strong> {entry.color}</div>
                                <div><strong>Education:</strong> {entry.education}</div>
                                <div><strong>Expense:</strong> {entry.expense}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
