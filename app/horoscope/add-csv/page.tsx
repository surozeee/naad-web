'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CloudUpload, Download, FileSpreadsheet, Globe, Loader2, Pencil, Plus, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { horoscopeApi, horoscopePeriodApi } from '@/app/lib/crm.service';
import type {
  HoroscopePeriodEnum,
  HoroscopePeriodResponse,
  HoroscopeRequest,
  HoroscopeResponse,
} from '@/app/lib/crm.types';

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
  periodId: string;
  zodiacSign: ZodiacOption;
  luckyNumber: string;
  prediction: LocalizedText;
  color: LocalizedText;
  education: LocalizedText;
  expense: LocalizedText;
  serverId?: string;
}

type HoroscopeFormState = Omit<HoroscopeEntry, 'id' | 'serverId'>;

const STORAGE_KEY = 'horoscope-add-csv-drafts-v3';

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
  'periodId',
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

const PERIOD_SLUG_TO_ENUM: Record<string, HoroscopePeriodEnum> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createLocalizedText(): LocalizedText {
  return { en: '', np: '', hi: '' };
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

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isValidZodiac(value: string): value is ZodiacOption {
  return ZODIAC_OPTIONS.some((item) => item.value === value);
}

function resolveLocalizedField(
  rowData: Record<string, string>,
  baseName: 'prediction' | 'color' | 'education' | 'expense'
): LocalizedText {
  const fallback = rowData[baseName] ?? '';
  return {
    en: rowData[`${baseName}_en`] ?? fallback,
    np: rowData[`${baseName}_np`] ?? fallback,
    hi: rowData[`${baseName}_hi`] ?? fallback,
  };
}

function periodLabel(periods: HoroscopePeriodResponse[], periodId: string): string {
  const p = periods.find((x) => x.id === periodId);
  if (!p) return periodId.slice(0, 8) + '…';
  return `${p.name} (${p.horoscope})`;
}

function resolvePeriodIdFromRow(
  rowData: Record<string, string>,
  periods: HoroscopePeriodResponse[]
): string | null {
  const rawId = (rowData.periodid ?? rowData.periodId ?? '').trim();
  if (rawId && UUID_RE.test(rawId)) {
    if (periods.some((p) => p.id === rawId)) return rawId;
  }
  const slug = (rowData.period ?? '').trim().toLowerCase();
  if (!slug) return null;
  const asEnum = PERIOD_SLUG_TO_ENUM[slug] ?? (slug.toUpperCase() as HoroscopePeriodEnum);
  const match = periods.find((p) => p.horoscope === asEnum);
  return match?.id ?? null;
}

function entryToRequest(entry: HoroscopeEntry, periodId: string): HoroscopeRequest {
  const ln = entry.luckyNumber.trim();
  const locales = [
    {
      language: 'NE' as const,
      prediction: entry.prediction.np.trim(),
      luckyNumber: ln,
      color: entry.color.np.trim(),
      education: entry.education.np.trim(),
      expense: entry.expense.np.trim(),
    },
    {
      language: 'HI' as const,
      prediction: entry.prediction.hi.trim(),
      luckyNumber: ln,
      color: entry.color.hi.trim(),
      education: entry.education.hi.trim(),
      expense: entry.expense.hi.trim(),
    },
  ];
  return {
    zodiacSign: entry.zodiacSign,
    periodId,
    prediction: entry.prediction.en.trim(),
    luckyNumber: ln,
    color: entry.color.en.trim(),
    education: entry.education.en.trim(),
    expense: entry.expense.en.trim(),
    locales,
  };
}

function migrateLegacyStoredEntry(
  raw: Record<string, unknown>,
  periods: HoroscopePeriodResponse[]
): HoroscopeEntry | null {
  if (raw.periodId && typeof raw.periodId === 'string' && raw.zodiacSign) {
    return raw as unknown as HoroscopeEntry;
  }
  const legacyPeriod = raw.period as string | undefined;
  const slug = legacyPeriod?.toLowerCase() ?? '';
  const enumVal = PERIOD_SLUG_TO_ENUM[slug];
  const pid = enumVal ? periods.find((p) => p.horoscope === enumVal)?.id : undefined;
  if (!pid || !raw.zodiacSign) return null;
  return {
    id: typeof raw.id === 'string' ? raw.id : createEntryId(),
    periodId: pid,
    zodiacSign: raw.zodiacSign as ZodiacOption,
    luckyNumber: String(raw.luckyNumber ?? ''),
    prediction: (raw.prediction as LocalizedText) ?? createLocalizedText(),
    color: (raw.color as LocalizedText) ?? createLocalizedText(),
    education: (raw.education as LocalizedText) ?? createLocalizedText(),
    expense: (raw.expense as LocalizedText) ?? createLocalizedText(),
    serverId: typeof raw.serverId === 'string' ? raw.serverId : undefined,
  };
}

export default function AddHoroscopeCsvPage() {
  const [periods, setPeriods] = useState<HoroscopePeriodResponse[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState<string | null>(null);

  const [formData, setFormData] = useState<HoroscopeFormState | null>(null);
  const [entries, setEntries] = useState<HoroscopeEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvMessage, setCsvMessage] = useState('');

  const [serverRows, setServerRows] = useState<HoroscopeResponse[]>([]);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [serverCsvBusy, setServerCsvBusy] = useState(false);
  const [draftsHydrated, setDraftsHydrated] = useState(false);

  const workingPeriodId = formData?.periodId ?? '';

  const loadPeriods = useCallback(async () => {
    setPeriodsLoading(true);
    setPeriodsError(null);
    try {
      const { data } = await horoscopePeriodApi.listActive();
      const list = data ?? [];
      setPeriods(list);
      setFormData((prev) => {
        if (prev && list.some((p) => p.id === prev.periodId)) return prev;
        const first = list[0];
        if (!first) return prev;
        return {
          periodId: first.id,
          zodiacSign: 'ARIES',
          luckyNumber: '',
          prediction: createLocalizedText(),
          color: createLocalizedText(),
          education: createLocalizedText(),
          expense: createLocalizedText(),
        };
      });
    } catch (e) {
      setPeriodsError(e instanceof Error ? e.message : 'Failed to load horoscope periods');
    } finally {
      setPeriodsLoading(false);
    }
  }, []);

  const refreshServerList = useCallback(async () => {
    if (!workingPeriodId) {
      setServerRows([]);
      return;
    }
    setServerLoading(true);
    setServerError(null);
    try {
      const res = await horoscopeApi.list({
        pageNo: 0,
        pageSize: 200,
        periodId: workingPeriodId,
        status: 'ACTIVE',
      });
      const items = res.result ?? res.content ?? [];
      setServerRows(items);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Failed to load horoscopes');
      setServerRows([]);
    } finally {
      setServerLoading(false);
    }
  }, [workingPeriodId]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (periods.length === 0) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const next: HoroscopeEntry[] = [];
          for (const item of parsed) {
            if (item && typeof item === 'object') {
              const m = migrateLegacyStoredEntry(item as Record<string, unknown>, periods);
              if (m) next.push(m);
            }
          }
          if (next.length > 0) setEntries(next);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setDraftsHydrated(true);
    }
  }, [periods]);

  useEffect(() => {
    if (!draftsHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries, draftsHydrated]);

  useEffect(() => {
    refreshServerList();
  }, [refreshServerList]);

  const createInitialFormForPeriod = (periodId: string): HoroscopeFormState => ({
    periodId,
    zodiacSign: 'ARIES',
    luckyNumber: '',
    prediction: createLocalizedText(),
    color: createLocalizedText(),
    education: createLocalizedText(),
    expense: createLocalizedText(),
  });

  useEffect(() => {
    if (!periodsLoading && periods.length > 0 && !formData) {
      setFormData(createInitialFormForPeriod(periods[0].id));
    }
  }, [periodsLoading, periods, formData]);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.periodId, (map.get(e.periodId) ?? 0) + 1);
    }
    return periods.map((p) => ({
      periodId: p.id,
      label: `${p.name} (${p.horoscope})`,
      count: map.get(p.id) ?? 0,
    }));
  }, [entries, periods]);

  const groupedEntries = useMemo(() => {
    return periods.map((p) => ({
      periodId: p.id,
      label: `${p.name} (${p.horoscope})`,
      items: entries.filter((e) => e.periodId === p.id),
    }));
  }, [entries, periods]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLocalizedChange = (
    section: 'prediction' | 'color' | 'education' | 'expense',
    lang: LanguageCode,
    value: string
  ) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [section]: { ...prev[section], [lang]: value },
          }
        : prev
    );
    const key = `${section}_${lang}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    const nextErrors: Record<string, string> = {};
    if (!formData.periodId) nextErrors.periodId = 'Select a horoscope period';
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
    const pid = formData?.periodId ?? periods[0]?.id ?? '';
    setFormData(pid ? createInitialFormForPeriod(pid) : null);
    setErrors({});
    setEditingId(null);
    setActiveLanguage('en');
  };

  const handleAddOrUpdate = () => {
    if (!validateForm() || !formData) return;
    const payload: HoroscopeEntry = {
      id: editingId ?? createEntryId(),
      periodId: formData.periodId,
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
      serverId: editingId ? entries.find((x) => x.id === editingId)?.serverId : undefined,
    };
    setEntries((prev) => (editingId ? prev.map((item) => (item.id === editingId ? payload : item)) : [payload, ...prev]));
    setCsvMessage(editingId ? 'Draft updated.' : 'Draft added.');
    resetForm();
  };

  const handleEdit = (entry: HoroscopeEntry) => {
    setFormData({
      periodId: entry.periodId,
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
    setCsvMessage('Draft removed.');
  };

  const clearAllDrafts = () => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setCsvMessage('All local drafts cleared.');
  };

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (periods.length === 0) {
      setCsvMessage('Load horoscope periods first.');
      return;
    }
    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      if (rows.length < 2) {
        setCsvMessage('CSV must include a header row and at least one data row.');
        return;
      }
      const headerMap = rows[0].map((cell) => normalizeCsvValue(cell).toLowerCase());
      const requiredMultilang = CSV_HEADERS.filter((h) => h !== 'periodId' && h !== 'period');
      const hasMultilang = requiredMultilang.every((header) => headerMap.includes(header));
      const hasLegacy = ['zodiacsign', 'prediction', 'luckynumber', 'color', 'education', 'expense'].every((h) => headerMap.includes(h));
      if (!hasMultilang && !hasLegacy) {
        setCsvMessage('Invalid CSV headers. Use the template from “Download sample CSV”.');
        return;
      }
      const importedEntries: HoroscopeEntry[] = [];
      for (const row of rows.slice(1)) {
        const rowData = Object.fromEntries(headerMap.map((header, index) => [header, normalizeCsvValue(row[index] ?? '')])) as Record<
          string,
          string
        >;
        const periodId = resolvePeriodIdFromRow(rowData, periods);
        const zodiacSign = rowData.zodiacsign?.toUpperCase() ?? '';
        if (!periodId || !isValidZodiac(zodiacSign)) continue;
        importedEntries.push({
          id: createEntryId(),
          periodId,
          zodiacSign,
          luckyNumber: rowData.luckynumber ?? '',
          prediction: resolveLocalizedField(rowData, 'prediction'),
          color: resolveLocalizedField(rowData, 'color'),
          education: resolveLocalizedField(rowData, 'education'),
          expense: resolveLocalizedField(rowData, 'expense'),
        });
      }
      if (importedEntries.length === 0) {
        setCsvMessage('No valid rows. Each row needs a matching periodId or period (daily/weekly/monthly/yearly) and a valid zodiacSign.');
        return;
      }
      setEntries((prev) => [...importedEntries, ...prev]);
      setCsvMessage(`${importedEntries.length} row(s) imported into drafts.`);
    } catch {
      setCsvMessage('Failed to read CSV file.');
    }
  };

  const handleDownloadSample = () => {
    const pid = formData?.periodId ?? periods[0]?.id ?? '';
    if (!pid) {
      setCsvMessage('No period available for the sample file.');
      return;
    }
    const headerLine = CSV_HEADERS.map(escapeCsvCell).join(',');
    const sample = [
      pid,
      '',
      'ARIES',
      '7',
      'Great day',
      'उत्तम दिन',
      'शानदार दिन',
      'Red',
      'रातो',
      'लाल',
      'Good progress',
      'राम्रो प्रगति',
      'अच्छी प्रगति',
      'Balanced',
      'सन्तुलित',
      'संतुलित',
    ]
      .map(escapeCsvCell)
      .join(',');
    const blob = new Blob([`${headerLine}\n${sample}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horoscope-multilingual-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    setCsvMessage('Sample CSV downloaded. Replace periodId with your horoscope period UUID from the dropdown if needed.');
  };

  const handleSyncDrafts = async () => {
    if (entries.length === 0) {
      setCsvMessage('No drafts to sync.');
      return;
    }
    setSyncing(true);
    setCsvMessage('');
    try {
      const byPeriod = new Map<string, HoroscopeEntry[]>();
      for (const en of entries) {
        const list = byPeriod.get(en.periodId) ?? [];
        list.push(en);
        byPeriod.set(en.periodId, list);
      }
      const idUpdates = new Map<string, string>();
      for (const [periodId, list] of byPeriod) {
        let res = await horoscopeApi.list({
          pageNo: 0,
          pageSize: 500,
          periodId,
          status: 'ACTIVE',
        });
        let existing = res.result ?? res.content ?? [];
        const byZodiac = new Map<string, string>();
        for (const h of existing) {
          if (h.zodiacSign) byZodiac.set(h.zodiacSign, h.id);
        }
        for (const entry of list) {
          const body = entryToRequest(entry, periodId);
          const existingId = entry.serverId ?? byZodiac.get(entry.zodiacSign);
          if (existingId) {
            await horoscopeApi.update(existingId, body);
            idUpdates.set(entry.id, existingId);
          } else {
            await horoscopeApi.create(body);
          }
        }
        res = await horoscopeApi.list({
          pageNo: 0,
          pageSize: 500,
          periodId,
          status: 'ACTIVE',
        });
        existing = res.result ?? res.content ?? [];
        for (const entry of list) {
          const found = existing.find((h) => h.zodiacSign === entry.zodiacSign);
          if (found) idUpdates.set(entry.id, found.id);
        }
      }
      setEntries((prev) => prev.map((e) => (idUpdates.has(e.id) ? { ...e, serverId: idUpdates.get(e.id) } : e)));
      setCsvMessage('Drafts synced to the server (create/update by zodiac + period).');
      await refreshServerList();
    } catch (e) {
      setCsvMessage(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleServerCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setServerCsvBusy(true);
    setCsvMessage('');
    try {
      const result = await horoscopeApi.importCsv(file);
      const parts: string[] = [];
      if (result.created != null) parts.push(`created ${result.created}`);
      if (result.updated != null) parts.push(`updated ${result.updated}`);
      if (result.errors?.length) parts.push(`${result.errors.length} row error(s)`);
      setCsvMessage(parts.length ? `Server CSV: ${parts.join(', ')}` : 'Server CSV import finished.');
      await refreshServerList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Server CSV import failed';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setCsvMessage(
          'Server CSV endpoint is not available yet. Use client CSV import and “Sync drafts to server”, or add POST /horoscope/import-csv on Event-Service.'
        );
      } else {
        setCsvMessage(msg);
      }
    } finally {
      setServerCsvBusy(false);
    }
  };

  const activeLangLabel = LANGUAGES.find((lang) => lang.code === activeLanguage)?.label ?? 'English';
  const activePredictionError = errors[`prediction_${activeLanguage}`];
  const activeColorError = errors[`color_${activeLanguage}`];
  const activeEducationError = errors[`education_${activeLanguage}`];
  const activeExpenseError = errors[`expense_${activeLanguage}`];

  if (periodsLoading && periods.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center gap-2 py-24 text-slate-600 dark:text-slate-400">
          <Loader2 className="animate-spin" size={22} />
          Loading horoscope periods…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Add Horoscope CSV' }]} />

        <PageHeaderWithInfo
          title="Horoscope CSV Manager"
          infoText="Drafts are stored in this browser. Pick an Event-Service horoscope period (UUID), edit EN / NP / HI fields, import CSV, then sync to create or update horoscopes. Nepali maps to backend language NE."
        />

        {periodsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {periodsError}{' '}
            <button type="button" onClick={() => loadPeriods()} className="underline font-semibold">
              Retry
            </button>
          </div>
        ) : null}

        {periods.length === 0 && !periodsLoading ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            No active horoscope periods. Create periods in CRM first, then reload this page.
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {totals.map((item) => (
            <div key={item.periodId} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
              <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{item.count}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Local drafts</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Saved on server (selected period)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Same period as in the form below.</p>
            </div>
            <button
              type="button"
              onClick={() => refreshServerList()}
              disabled={!workingPeriodId || serverLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              {serverLoading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
          <div className="p-6">
            {serverError ? <p className="text-sm text-red-600 mb-3">{serverError}</p> : null}
            {!workingPeriodId ? (
              <p className="text-sm text-slate-500">Select a period in the form to load server horoscopes.</p>
            ) : serverRows.length === 0 && !serverLoading ? (
              <p className="text-sm text-slate-500">No active horoscopes for this period yet.</p>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {serverRows.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm flex flex-wrap justify-between gap-2"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white">{h.zodiacSign}</span>
                    <span className="text-slate-600 dark:text-slate-400 line-clamp-2">{h.prediction}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] gap-6">
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit draft' : 'Create draft'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">English is stored as the main record; Nepali (NE) and Hindi are stored as locales.</p>
            </div>

            {formData ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="periodId" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Horoscope period (backend)
                    </label>
                    <select
                      id="periodId"
                      name="periodId"
                      value={formData.periodId}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      {periods.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} ({option.horoscope})
                        </option>
                      ))}
                    </select>
                    {errors.periodId ? <p className="mt-1 text-xs text-red-600">{errors.periodId}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="zodiacSign" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Zodiac sign
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
                      Lucky number
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
                      Content language
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
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Prediction ({activeLangLabel})</label>
                      <textarea
                        rows={4}
                        value={formData.prediction[activeLanguage]}
                        onChange={(e) => handleLocalizedChange('prediction', activeLanguage, e.target.value)}
                        placeholder={`Write ${activeLangLabel} prediction…`}
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
                  <button
                    type="button"
                    onClick={handleAddOrUpdate}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    {editingId ? <Save size={16} /> : <Plus size={16} />}
                    {editingId ? 'Update draft' : 'Add draft'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncDrafts}
                    disabled={syncing || entries.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {syncing ? <Loader2 className="animate-spin" size={16} /> : <CloudUpload size={16} />}
                    Sync drafts to server
                  </button>
                  <button
                    type="button"
                    onClick={clearAllDrafts}
                    disabled={entries.length === 0}
                    className="inline-flex items-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Clear local drafts
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">Loading form…</div>
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={20} className="text-emerald-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">CSV (client → drafts)</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">EN / NP / HI columns; periodId or period slug per row.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Columns</div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 break-words">{CSV_HEADERS.join(', ')}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      disabled={periods.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      <Download size={16} />
                      Download sample CSV
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      <Upload size={16} />
                      Upload CSV
                      <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Server CSV import (optional)</div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    When Event-Service exposes POST /horoscope/import-csv (multipart file), this uploads the file directly. Otherwise use sync above.
                  </p>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {serverCsvBusy ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    Upload CSV to server
                    <input type="file" accept=".csv,text/csv" onChange={handleServerCsvUpload} className="hidden" disabled={serverCsvBusy} />
                  </label>
                </div>

                {csvMessage ? (
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/40 px-4 py-3 text-sm font-medium text-indigo-800 dark:text-indigo-200">
                    {csvMessage}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Draft list</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Grouped by backend period. Sync sends create or update per zodiac.</p>
              </div>

              <div className="p-6 space-y-5">
                {entries.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">No drafts. Add one or import CSV.</div>
                ) : (
                  groupedEntries.map((group) => (
                    <div key={group.periodId}>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                        {group.label} ({group.items.length})
                      </div>
                      {group.items.length === 0 ? (
                        <div className="text-sm text-slate-400 mb-4">No drafts for this period.</div>
                      ) : (
                        <div className="space-y-3">
                          {group.items.map((entry) => (
                            <div key={entry.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-base font-semibold text-slate-900 dark:text-white">
                                    {ZODIAC_OPTIONS.find((item) => item.value === entry.zodiacSign)?.label ?? entry.zodiacSign}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">{periodLabel(periods, entry.periodId)}</div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{entry.prediction.en}</div>
                                  {entry.serverId ? (
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Synced (id {entry.serverId.slice(0, 8)}…)</div>
                                  ) : null}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(entry)}
                                    className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-600 p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(entry.id)}
                                    className="inline-flex items-center justify-center rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-3 mt-4 text-xs">
                                {LANGUAGES.map((lang) => (
                                  <div
                                    key={`${entry.id}-${lang.code}`}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40"
                                  >
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
