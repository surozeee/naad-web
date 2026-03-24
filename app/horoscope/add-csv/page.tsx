'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { FileSpreadsheet, Globe, Pencil, Plus, Save, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';

type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type LanguageCode = 'en' | 'np' | 'hi';
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

type LocalizedText = Record<LanguageCode, string>;

interface HoroscopeEntry {
  id: string;
  period: HoroscopePeriod;
  zodiacSign: ZodiacOption;
  luckyNumber: string;
  prediction: LocalizedText;
  color: LocalizedText;
  education: LocalizedText;
  expense: LocalizedText;
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

const LANGUAGES: Array<{ code: LanguageCode; label: string; badge: string }> = [
  { code: 'en', label: 'English', badge: 'EN' },
  { code: 'np', label: 'Nepali', badge: 'NP' },
  { code: 'hi', label: 'Hindi', badge: 'HI' },
];

const CSV_HEADERS = [
  'period',
  'zodiacSign',
  'luckyNumber',
  'prediction_en',
  'prediction_np',
  'prediction_hi',
  'color_en',
  'color_np',
  'color_hi',
  'education_en',
  'education_np',
  'education_hi',
  'expense_en',
  'expense_np',
  'expense_hi',
] as const;

function createLocalizedText(): LocalizedText {
  return { en: '', np: '', hi: '' };
}

function createInitialForm(): HoroscopeFormState {
  return {
    period: 'daily',
    zodiacSign: 'ARIES',
    luckyNumber: '',
    prediction: createLocalizedText(),
    color: createLocalizedText(),
    education: createLocalizedText(),
    expense: createLocalizedText(),
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
      currentCell = '';
      currentRow = [];
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

function normalizeCsvValue(value: string): string {
  return value.trim().replace(/^"|"$/g, '');
}

function isValidPeriod(value: string): value is HoroscopePeriod {
  return PERIOD_OPTIONS.some((item) => item.value === value);
}

function isValidZodiac(value: string): value is ZodiacOption {
  return ZODIAC_OPTIONS.some((item) => item.value === value);
}

function resolveLocalizedField(
  rowData: Record<string, string>,
  baseName: 'prediction' | 'color' | 'education' | 'expense'
): LocalizedText {
  // Keep backward compatibility with old single-column CSV (e.g. prediction).
  const fallback = rowData[baseName] ?? '';
  return {
    en: rowData[`${baseName}_en`] ?? fallback,
    np: rowData[`${baseName}_np`] ?? fallback,
    hi: rowData[`${baseName}_hi`] ?? fallback,
  };
}

export default function AddHoroscopeCsvPage() {
  const [formData, setFormData] = useState<HoroscopeFormState>(createInitialForm());
  const [entries, setEntries] = useState<HoroscopeEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvMessage, setCsvMessage] = useState('');

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

  const handleLocalizedChange = (
    section: 'prediction' | 'color' | 'education' | 'expense',
    lang: LanguageCode,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [lang]: value },
    }));
    const key = `${section}_${lang}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!formData.period) nextErrors.period = 'Period is required';
    if (!formData.zodiacSign) nextErrors.zodiacSign = 'Zodiac sign is required';
    if (!formData.luckyNumber.trim()) nextErrors.luckyNumber = 'Lucky number is required';

    for (const lang of LANGUAGES) {
      if (!formData.prediction[lang.code].trim()) nextErrors[`prediction_${lang.code}`] = `Prediction (${lang.label}) is required`;
      if (!formData.color[lang.code].trim()) nextErrors[`color_${lang.code}`] = `Color (${lang.label}) is required`;
      if (!formData.education[lang.code].trim()) nextErrors[`education_${lang.code}`] = `Education (${lang.label}) is required`;
      if (!formData.expense[lang.code].trim()) nextErrors[`expense_${lang.code}`] = `Expense (${lang.label}) is required`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(createInitialForm());
    setErrors({});
    setEditingId(null);
    setActiveLanguage('en');
  };

  const handleAddOrUpdate = () => {
    if (!validateForm()) return;

    const payload: HoroscopeEntry = {
      id: editingId ?? createEntryId(),
      period: formData.period,
      zodiacSign: formData.zodiacSign,
      luckyNumber: formData.luckyNumber.trim(),
      prediction: {
        en: formData.prediction.en.trim(),
        np: formData.prediction.np.trim(),
        hi: formData.prediction.hi.trim(),
      },
      color: {
        en: formData.color.en.trim(),
        np: formData.color.np.trim(),
        hi: formData.color.hi.trim(),
      },
      education: {
        en: formData.education.en.trim(),
        np: formData.education.np.trim(),
        hi: formData.education.hi.trim(),
      },
      expense: {
        en: formData.expense.en.trim(),
        np: formData.expense.np.trim(),
        hi: formData.expense.hi.trim(),
      },
    };

    setEntries((prev) => (editingId ? prev.map((item) => (item.id === editingId ? payload : item)) : [payload, ...prev]));
    setCsvMessage(editingId ? 'Horoscope draft updated.' : 'Horoscope draft added.');
    resetForm();
  };

  const handleEdit = (entry: HoroscopeEntry) => {
    setFormData({
      period: entry.period,
      zodiacSign: entry.zodiacSign,
      luckyNumber: entry.luckyNumber,
      prediction: { ...entry.prediction },
      color: { ...entry.color },
      education: { ...entry.education },
      expense: { ...entry.expense },
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
      const hasNewMultilangHeaders = CSV_HEADERS.every((header) => headerMap.includes(header));
      const hasLegacyHeaders = ['period', 'zodiacsign', 'prediction', 'luckynumber', 'color', 'education', 'expense'].every((header) =>
        headerMap.includes(header)
      );

      if (!hasNewMultilangHeaders && !hasLegacyHeaders) {
        setCsvMessage('CSV headers are invalid. Use multilingual template columns shown on this page.');
        return;
      }

      const importedEntries: HoroscopeEntry[] = [];

      for (const row of rows.slice(1)) {
        const rowData = Object.fromEntries(headerMap.map((header, index) => [header, normalizeCsvValue(row[index] ?? '')])) as Record<
          string,
          string
        >;

        const period = rowData.period?.toLowerCase();
        const zodiacSign = rowData.zodiacsign?.toUpperCase();
        if (!isValidPeriod(period) || !isValidZodiac(zodiacSign)) continue;

        importedEntries.push({
          id: createEntryId(),
          period,
          zodiacSign,
          luckyNumber: rowData.luckynumber ?? '',
          prediction: resolveLocalizedField(rowData, 'prediction'),
          color: resolveLocalizedField(rowData, 'color'),
          education: resolveLocalizedField(rowData, 'education'),
          expense: resolveLocalizedField(rowData, 'expense'),
        });
      }

      if (importedEntries.length === 0) {
        setCsvMessage('No valid horoscope rows were found in the CSV file.');
        return;
      }

      setEntries((prev) => [...importedEntries, ...prev]);
      setCsvMessage(`${importedEntries.length} horoscope rows imported.`);
    } catch {
      setCsvMessage('Failed to read CSV file.');
    }
  };

  const activeLangLabel = LANGUAGES.find((lang) => lang.code === activeLanguage)?.label ?? 'English';
  const activePredictionError = errors[`prediction_${activeLanguage}`];
  const activeColorError = errors[`color_${activeLanguage}`];
  const activeEducationError = errors[`education_${activeLanguage}`];
  const activeExpenseError = errors[`expense_${activeLanguage}`];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Add Horoscope CSV' }]} />

        <PageHeaderWithInfo
          title="Horoscope CSV Manager"
          infoText="Create professional multilingual horoscope drafts (English, Nepali, Hindi) one by one or via CSV bulk upload."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {totals.map((item) => (
            <div key={item.value} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{item.count}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Draft entries</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] gap-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Horoscope Draft' : 'Create Horoscope Draft'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Fill period + zodiac once, then add localized content for each supported language.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="period" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Period
                  </label>
                  <select
                    id="period"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.period ? <p className="mt-1 text-xs text-red-600">{errors.period}</p> : null}
                </div>

                <div>
                  <label htmlFor="zodiacSign" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Zodiac Sign
                  </label>
                  <select
                    id="zodiacSign"
                    name="zodiacSign"
                    value={formData.zodiacSign}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    {ZODIAC_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.zodiacSign ? <p className="mt-1 text-xs text-red-600">{errors.zodiacSign}</p> : null}
                </div>

                <div>
                  <label htmlFor="luckyNumber" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Lucky Number
                  </label>
                  <input
                    id="luckyNumber"
                    name="luckyNumber"
                    value={formData.luckyNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 7"
                    className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                  {errors.luckyNumber ? <p className="mt-1 text-xs text-red-600">{errors.luckyNumber}</p> : null}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/50 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mr-2">
                    <Globe size={16} />
                    Content Language
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setActiveLanguage(lang.code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        activeLanguage === lang.code
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {lang.badge} - {lang.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Horoscope Text ({activeLangLabel})</label>
                    <textarea
                      rows={4}
                      value={formData.prediction[activeLanguage]}
                      onChange={(e) => handleLocalizedChange('prediction', activeLanguage, e.target.value)}
                      placeholder={`Write ${activeLangLabel} horoscope prediction...`}
                      className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                    {activePredictionError ? <p className="mt-1 text-xs text-red-600">{activePredictionError}</p> : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Color ({activeLangLabel})</label>
                      <input
                        value={formData.color[activeLanguage]}
                        onChange={(e) => handleLocalizedChange('color', activeLanguage, e.target.value)}
                        placeholder="e.g. Red"
                        className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                      {activeColorError ? <p className="mt-1 text-xs text-red-600">{activeColorError}</p> : null}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Education ({activeLangLabel})</label>
                      <input
                        value={formData.education[activeLanguage]}
                        onChange={(e) => handleLocalizedChange('education', activeLanguage, e.target.value)}
                        placeholder="e.g. Good progress"
                        className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                      {activeEducationError ? <p className="mt-1 text-xs text-red-600">{activeEducationError}</p> : null}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expense ({activeLangLabel})</label>
                      <input
                        value={formData.expense[activeLanguage]}
                        onChange={(e) => handleLocalizedChange('expense', activeLanguage, e.target.value)}
                        placeholder="e.g. Balanced"
                        className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                      {activeExpenseError ? <p className="mt-1 text-xs text-red-600">{activeExpenseError}</p> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleAddOrUpdate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? 'Update Draft' : 'Add Draft'}
                </button>
                <button type="button" onClick={resetForm} className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-emerald-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">CSV Upload (Multilingual)</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bulk import with EN / NP / HI columns.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Required CSV columns</div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 break-words">{CSV_HEADERS.join(', ')}</div>
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    <Upload size={16} />
                    Upload CSV
                    <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
                  </label>
                </div>

                {csvMessage ? <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/40 px-4 py-3 text-sm font-medium text-indigo-800 dark:text-indigo-200">{csvMessage}</div> : null}

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Sample Row</div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 break-all">
                    daily,ARIES,7,"Great day","उत्तम दिन","शानदार दिन","Red","रातो","लाल","Good progress","राम्रो प्रगति","अच्छी प्रगति","Balanced","सन्तुलित","संतुलित"
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Draft Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review content before backend integration/save API.</p>
              </div>

              <div className="p-6 space-y-5">
                {entries.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No drafts yet. Add one manually or import a CSV file.</div>
                ) : (
                  groupedEntries.map((group) => (
                    <div key={group.value}>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                        {group.label} ({group.items.length})
                      </div>
                      {group.items.length === 0 ? (
                        <div className="text-sm text-slate-400 mb-4">No entries in this period.</div>
                      ) : (
                        <div className="space-y-3">
                          {group.items.map((entry) => (
                            <div key={entry.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-base font-semibold text-slate-900 dark:text-white">
                                    {ZODIAC_OPTIONS.find((item) => item.value === entry.zodiacSign)?.label ?? entry.zodiacSign}
                                  </div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{entry.prediction.en}</div>
                                </div>
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => handleEdit(entry)} className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-600 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <Pencil size={16} />
                                  </button>
                                  <button type="button" onClick={() => handleDelete(entry.id)} className="inline-flex items-center justify-center rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-3 mt-4 text-xs">
                                {LANGUAGES.map((lang) => (
                                  <div key={`${entry.id}-${lang.code}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40">
                                    <div className="font-semibold text-slate-800 dark:text-slate-300 mb-1">{lang.badge}</div>
                                    <div className="text-slate-600 dark:text-slate-400">Prediction: {entry.prediction[lang.code]}</div>
                                    <div className="text-slate-600 dark:text-slate-400 mt-1">Color: {entry.color[lang.code]}</div>
                                    <div className="text-slate-600 dark:text-slate-400 mt-1">Education: {entry.education[lang.code]}</div>
                                    <div className="text-slate-600 dark:text-slate-400 mt-1">Expense: {entry.expense[lang.code]}</div>
                                  </div>
                                ))}
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
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
