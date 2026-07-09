'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CloudUpload, Download, FileSpreadsheet, Loader2, Pencil, Plus, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { horoscopeApi } from '@/app/lib/crm.service';
import { masterService } from '@/app/lib/master.service';
import {
  buildHoroscopeRequest,
  createEmptyLocalizedFields,
  DEFAULT_HOROSCOPE_LANGUAGES,
  findHoroscopeLanguage,
  getBaseHoroscopeLanguage,
  getHoroscopeTextForLanguage,
  hasHoroscopeTranslation,
  HOROSCOPE_TEXT_FIELDS,
  resolveHoroscopeLanguages,
  type HoroscopeLanguageOption,
  type HoroscopeLocalizedFields,
  type HoroscopeTextField,
  validateHoroscopeMultilangEntry,
} from '@/app/lib/horoscope-multilang';
import type { HoroscopeResponse, HoroscopeTypeEnum, ZodiacSignEnum } from '@/app/lib/crm.types';
import { HoroscopeLanguageTabs } from '@/app/horoscope/components/HoroscopeLanguageTabs';

interface HoroscopeEntry {
  id: string;
  horoscopeType: HoroscopeTypeEnum;
  startDate: string;
  endDate: string;
  zodiacSign: ZodiacSignEnum;
  luckyNumber: string;
  luckyColor: string;
  luckyTime: string;
  localized: HoroscopeLocalizedFields;
  serverId?: string;
}

type HoroscopeFormState = Omit<HoroscopeEntry, 'id' | 'serverId'>;

const STORAGE_KEY = 'horoscope-add-csv-drafts-v4';
const TYPE_TABS: HoroscopeTypeEnum[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const ZODIAC_OPTIONS: Array<{ value: ZodiacSignEnum; label: string }> = [
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

const FIELD_LABELS: Record<HoroscopeTextField, string> = {
  title: 'Title',
  summary: 'Overview',
  description: 'Description',
  love: 'Love',
  career: 'Career',
  money: 'Money',
  health: 'Health',
  family: 'Family',
  education: 'Education',
  travel: 'Travel',
  advice: 'Advice',
  mood: 'Mood',
};

const PRIMARY_FIELDS: HoroscopeTextField[] = ['title', 'summary', 'description'];
const EXTRA_FIELDS = HOROSCOPE_TEXT_FIELDS.filter((f) => !PRIMARY_FIELDS.includes(f));

const CSV_BASE_HEADERS = [
  'horoscopeType',
  'zodiacSign',
  'startDate',
  'endDate',
  'luckyNumber',
  'luckyColor',
  'luckyTime',
] as const;

const CSV_HEADERS = [
  ...CSV_BASE_HEADERS,
  ...HOROSCOPE_TEXT_FIELDS.flatMap((f) => [`${f}_en`, `${f}_np`, `${f}_hi`]),
] as const;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialForm(
  type: HoroscopeTypeEnum,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): HoroscopeFormState {
  const d = todayIso();
  return {
    horoscopeType: type,
    startDate: d,
    endDate: d,
    zodiacSign: 'ARIES',
    luckyNumber: '',
    luckyColor: '',
    luckyTime: '',
    localized: createEmptyLocalizedFields(languages),
  };
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
      } else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i += 1;
      currentRow.push(currentCell);
      if (currentRow.some((c) => c.trim())) rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else currentCell += char;
  }
  currentRow.push(currentCell);
  if (currentRow.some((c) => c.trim())) rows.push(currentRow);
  return rows;
}

function normalizeCsvValue(value: string): string {
  return value.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isValidZodiac(value: string): value is ZodiacSignEnum {
  return ZODIAC_OPTIONS.some((item) => item.value === value);
}

function resolveLocalizedField(rowData: Record<string, string>, field: HoroscopeTextField) {
  const fallback = rowData[field] ?? '';
  return {
    en: rowData[`${field}_en`] ?? fallback,
    np: rowData[`${field}_np`] ?? '',
    hi: rowData[`${field}_hi`] ?? '',
  };
}

function entryToMultilangEntry(entry: HoroscopeEntry) {
  return {
    zodiacSign: entry.zodiacSign,
    horoscopeType: entry.horoscopeType,
    startDate: entry.startDate,
    endDate: entry.endDate,
    luckyNumber: entry.luckyNumber,
    luckyColor: entry.luckyColor,
    luckyTime: entry.luckyTime,
    localized: entry.localized,
  };
}


export default function AddHoroscopeCsvPage() {
  const [languages, setLanguages] = useState<HoroscopeLanguageOption[]>(DEFAULT_HOROSCOPE_LANGUAGES);
  const [activeType, setActiveType] = useState<HoroscopeTypeEnum>('DAILY');
  const [formData, setFormData] = useState<HoroscopeFormState>(() => createInitialForm('DAILY'));
  const [entries, setEntries] = useState<HoroscopeEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvMessage, setCsvMessage] = useState('');
  const [serverRows, setServerRows] = useState<HoroscopeResponse[]>([]);
  const [serverLoading, setServerLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [serverCsvBusy, setServerCsvBusy] = useState(false);
  const [draftsHydrated, setDraftsHydrated] = useState(false);

  const activeLangOption = useMemo(
    () => findHoroscopeLanguage(languages, activeLanguage) ?? getBaseHoroscopeLanguage(languages),
    [languages, activeLanguage]
  );

  useEffect(() => {
    masterService.language
      .listActive()
      .then((res) => {
        const raw = res?.data;
        const arr = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
        setLanguages(resolveHoroscopeLanguages(arr));
      })
      .catch(() => undefined);
  }, []);

  const refreshServerList = useCallback(async () => {
    setServerLoading(true);
    try {
      const res = await horoscopeApi.list({
        pageNo: 0,
        pageSize: 200,
        horoscopeType: activeType,
        status: 'ACTIVE',
      });
      setServerRows((res.result ?? res.content ?? []) as HoroscopeResponse[]);
    } catch {
      setServerRows([]);
    } finally {
      setServerLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HoroscopeEntry[];
        if (Array.isArray(parsed)) setEntries(parsed);
      }
    } catch {
      /* ignore */
    } finally {
      setDraftsHydrated(true);
    }
  }, []);

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

  useEffect(() => {
    setFormData((prev) => ({ ...prev, horoscopeType: activeType }));
  }, [activeType]);

  const totals = useMemo(() => {
    return TYPE_TABS.map((t) => ({
      type: t,
      count: entries.filter((e) => e.horoscopeType === t).length,
    }));
  }, [entries]);

  const groupedEntries = useMemo(() => {
    return TYPE_TABS.map((t) => ({
      type: t,
      items: entries.filter((e) => e.horoscopeType === t),
    }));
  }, [entries]);

  const draftLangCounts = useMemo(() => {
    const items = groupedEntries.find((g) => g.type === activeType)?.items ?? [];
    const counts: Record<string, number> = {};
    for (const lang of languages) {
      counts[lang.uiCode] = items.filter((entry) => {
        if (lang.isBase) return Boolean(entry.localized.title[lang.uiCode]?.trim());
        return Boolean(
          entry.localized.title[lang.uiCode]?.trim() || entry.localized.summary[lang.uiCode]?.trim()
        );
      }).length;
    }
    return counts;
  }, [groupedEntries, activeType, languages]);

  const serverLangCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lang of languages) {
      counts[lang.uiCode] = lang.isBase
        ? serverRows.length
        : serverRows.filter((h) => hasHoroscopeTranslation(h, lang)).length;
    }
    return counts;
  }, [serverRows, languages]);

  const activeDrafts = useMemo(
    () =>
      (groupedEntries.find((g) => g.type === activeType)?.items ?? []).filter((entry) => {
        if (activeLangOption.isBase) return Boolean(entry.localized.title[activeLangOption.uiCode]?.trim());
        return Boolean(
          entry.localized.title[activeLangOption.uiCode]?.trim() ||
            entry.localized.summary[activeLangOption.uiCode]?.trim()
        );
      }),
    [groupedEntries, activeType, activeLangOption]
  );

  const activeServerRows = useMemo(
    () =>
      activeLangOption.isBase
        ? serverRows
        : serverRows.filter((h) => hasHoroscopeTranslation(h, activeLangOption)),
    [serverRows, activeLangOption]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLocalizedChange = (field: HoroscopeTextField, lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      localized: {
        ...prev.localized,
        [field]: { ...prev.localized[field], [lang]: value },
      },
    }));
    const key = `${field}_${lang}`;
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    const base = getBaseHoroscopeLanguage(languages);
    const nextErrors: Record<string, string> = {};
    if (!formData.zodiacSign) nextErrors.zodiacSign = 'Zodiac sign is required';
    if (!formData.startDate) nextErrors.startDate = 'Start date is required';
    if (!formData.endDate) nextErrors.endDate = 'End date is required';
    if (!formData.localized.title[base.uiCode]?.trim()) {
      nextErrors[`title_${base.uiCode}`] = `${base.label} title is required`;
    }
    if (!formData.localized.summary[base.uiCode]?.trim()) {
      nextErrors[`summary_${base.uiCode}`] = `${base.label} summary is required`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(createInitialForm(activeType, languages));
    setErrors({});
    setEditingId(null);
    setActiveLanguage(getBaseHoroscopeLanguage(languages).uiCode);
  };

  const handleAddOrUpdate = () => {
    if (!validateForm()) return;
    const payload: HoroscopeEntry = {
      id: editingId ?? createEntryId(),
      ...formData,
      luckyNumber: formData.luckyNumber.trim(),
      luckyColor: formData.luckyColor.trim(),
      luckyTime: formData.luckyTime.trim(),
      serverId: editingId ? entries.find((x) => x.id === editingId)?.serverId : undefined,
    };
    setEntries((prev) => (editingId ? prev.map((item) => (item.id === editingId ? payload : item)) : [payload, ...prev]));
    setCsvMessage(editingId ? 'Draft updated.' : 'Draft added.');
    resetForm();
  };

  const handleEdit = (entry: HoroscopeEntry) => {
    setActiveType(entry.horoscopeType);
    setFormData({
      horoscopeType: entry.horoscopeType,
      startDate: entry.startDate,
      endDate: entry.endDate,
      zodiacSign: entry.zodiacSign,
      luckyNumber: entry.luckyNumber,
      luckyColor: entry.luckyColor,
      luckyTime: entry.luckyTime,
      localized: JSON.parse(JSON.stringify(entry.localized)) as HoroscopeLocalizedFields,
    });
    setEditingId(entry.id);
    setCsvMessage('');
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setCsvMessage('Draft removed.');
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
      const imported: HoroscopeEntry[] = [];
      for (const row of rows.slice(1)) {
        const rowData = Object.fromEntries(
          headerMap.map((header, index) => [header, normalizeCsvValue(row[index] ?? '')])
        ) as Record<string, string>;
        const horoscopeType = (rowData.horoscopetype ?? rowData.period ?? activeType).toUpperCase() as HoroscopeTypeEnum;
        const zodiacSign = (rowData.zodiacsign ?? '').toUpperCase();
        const startDate = rowData.startdate ?? todayIso();
        const endDate = rowData.enddate ?? startDate;
        if (!TYPE_TABS.includes(horoscopeType) || !isValidZodiac(zodiacSign)) continue;
        const localized = HOROSCOPE_TEXT_FIELDS.reduce((acc, field) => {
          acc[field] = resolveLocalizedField(rowData, field);
          return acc;
        }, createEmptyLocalizedFields());
        imported.push({
          id: createEntryId(),
          horoscopeType,
          startDate,
          endDate,
          zodiacSign,
          luckyNumber: rowData.luckynumber ?? '',
          luckyColor: rowData.luckycolor ?? rowData.color ?? '',
          luckyTime: rowData.luckytime ?? '',
          localized,
        });
      }
      if (imported.length === 0) {
        setCsvMessage('No valid rows. Check horoscopeType, zodiacSign, startDate, endDate.');
        return;
      }
      setEntries((prev) => [...imported, ...prev]);
      setCsvMessage(`${imported.length} row(s) imported into drafts.`);
    } catch {
      setCsvMessage('Failed to read CSV file.');
    }
  };

  const handleDownloadSample = () => {
    const headerLine = CSV_HEADERS.map(escapeCsvCell).join(',');
    const localized = createEmptyLocalizedFields();
    localized.title.en = 'A productive day ahead';
    localized.summary.en = 'Today brings fresh energy.';
    const sampleCells = [
      activeType,
      'ARIES',
      todayIso(),
      todayIso(),
      '7',
      'Red',
      '10:00 AM - 12:00 PM',
      ...HOROSCOPE_TEXT_FIELDS.flatMap((f) => [
        localized[f].en,
        localized[f].np,
        localized[f].hi,
      ]),
    ];
    const blob = new Blob([`${headerLine}\n${sampleCells.map(escapeCsvCell).join(',')}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horoscope-multilingual-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    setCsvMessage('Sample CSV downloaded.');
  };

  const handleSyncDrafts = async () => {
    if (entries.length === 0) {
      setCsvMessage('No drafts to sync.');
      return;
    }
    setSyncing(true);
    setCsvMessage('');
    try {
      const idUpdates = new Map<string, string>();
      const rowErrors: string[] = [];
      for (const entry of entries) {
        const validationError = validateHoroscopeMultilangEntry(entryToMultilangEntry(entry), languages);
        if (validationError) {
          rowErrors.push(`${entry.zodiacSign}: ${validationError}`);
          continue;
        }
        const body = buildHoroscopeRequest(entryToMultilangEntry(entry), languages);
        const existingId = entry.serverId;
        try {
          if (existingId) {
            await horoscopeApi.update(existingId, body);
            idUpdates.set(entry.id, existingId);
          } else {
            const res = await horoscopeApi.list({
              pageNo: 0,
              pageSize: 1,
              horoscopeType: entry.horoscopeType,
              startDate: entry.startDate,
              endDate: entry.endDate,
              zodiacSign: entry.zodiacSign,
              status: 'ACTIVE',
            });
            const found = ((res.result ?? res.content ?? []) as HoroscopeResponse[])[0];
            if (found) {
              await horoscopeApi.update(found.id, body);
              idUpdates.set(entry.id, found.id);
            } else {
              await horoscopeApi.create(body);
            }
          }
        } catch (err) {
          rowErrors.push(`${entry.zodiacSign}: ${err instanceof Error ? err.message : 'Save failed'}`);
        }
      }
      setEntries((prev) => prev.map((e) => (idUpdates.has(e.id) ? { ...e, serverId: idUpdates.get(e.id) } : e)));
      setCsvMessage(
        rowErrors.length > 0
          ? `Synced with ${rowErrors.length} error(s): ${rowErrors.slice(0, 3).join('; ')}`
          : 'Drafts synced (upsert by zodiac + type + date range).'
      );
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
    try {
      const result = await horoscopeApi.importCsv(file);
      const parts: string[] = [];
      if (result.created != null) parts.push(`created ${result.created}`);
      if (result.updated != null) parts.push(`updated ${result.updated}`);
      if (result.errors?.length) parts.push(`${result.errors.length} row error(s)`);
      setCsvMessage(parts.length ? `Server CSV: ${parts.join(', ')}` : 'Server CSV import finished.');
      await refreshServerList();
    } catch (err) {
      setCsvMessage(err instanceof Error ? err.message : 'Server CSV import failed');
    } finally {
      setServerCsvBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-3 max-w-[1400px]">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Add Horoscope CSV' }]} />
        <PageHeaderWithInfo
          title="Horoscope CSV Manager"
          infoText="Pick period type, then use language tabs to enter or review EN / NE / HI content per draft."
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
            {TYPE_TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px ${
                  activeType === t
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveType(t)}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
                <span className="ml-1 text-[10px] opacity-70">({totals.find((x) => x.type === t)?.count ?? 0})</span>
              </button>
            ))}
          </div>
          {csvMessage ? (
            <p className="text-xs text-indigo-700 dark:text-indigo-300 truncate max-w-md">{csvMessage}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-3">
          <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold">{editingId ? 'Edit draft' : 'New draft'}</h2>
              <span className="text-[11px] text-slate-500">{activeType.toLowerCase()}</span>
            </div>

            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <select name="zodiacSign" value={formData.zodiacSign} onChange={handleInputChange} className="form-input text-sm py-1.5 col-span-2 md:col-span-1">
                  {ZODIAC_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="form-input text-sm py-1.5" title="Start date" />
                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="form-input text-sm py-1.5" title="End date" />
                <input name="luckyNumber" value={formData.luckyNumber} onChange={handleInputChange} placeholder="Lucky #" className="form-input text-sm py-1.5" />
                <input name="luckyColor" value={formData.luckyColor} onChange={handleInputChange} placeholder="Color" className="form-input text-sm py-1.5" />
                <input name="luckyTime" value={formData.luckyTime} onChange={handleInputChange} placeholder="Time" className="form-input text-sm py-1.5" />
              </div>

              <HoroscopeLanguageTabs
                languages={languages}
                activeUiCode={activeLanguage}
                onChange={setActiveLanguage}
                variant="underline"
                compact
              />

              <div
                key={activeLanguage}
                className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1"
                role="tabpanel"
                aria-label={`${activeLangOption.label} content`}
              >
                {HOROSCOPE_TEXT_FIELDS.map((field) => (
                  <div key={field} className={field === 'description' || field === 'summary' ? 'md:col-span-2' : ''}>
                    <label className="text-[11px] font-medium text-slate-500">{FIELD_LABELS[field]}</label>
                    <textarea
                      rows={field === 'title' ? 1 : field === 'description' || field === 'summary' ? 2 : 1}
                      value={formData.localized[field][activeLanguage] ?? ''}
                      onChange={(e) => handleLocalizedChange(field, activeLanguage, e.target.value)}
                      className="form-input w-full mt-0.5 text-sm py-1.5 min-h-[2rem]"
                      placeholder={FIELD_LABELS[field]}
                    />
                    {errors[`${field}_${activeLanguage}`] ? (
                      <p className="text-[11px] text-red-600 mt-0.5">{errors[`${field}_${activeLanguage}`]}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={handleAddOrUpdate} className="btn-primary btn-small inline-flex items-center gap-1">
                  {editingId ? <Save size={13} /> : <Plus size={13} />}
                  {editingId ? 'Update' : 'Add draft'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary btn-small">Reset</button>
                <button type="button" onClick={handleSyncDrafts} disabled={syncing} className="btn-secondary btn-small inline-flex items-center gap-1">
                  {syncing ? <Loader2 className="animate-spin" size={13} /> : <CloudUpload size={13} />}
                  Sync all
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <FileSpreadsheet size={15} className="text-slate-500" />
                <h2 className="text-sm font-semibold">CSV import</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={handleDownloadSample} className="btn-secondary btn-small inline-flex items-center gap-1 text-xs">
                  <Download size={12} /> Sample
                </button>
                <label className="btn-primary btn-small inline-flex items-center gap-1 cursor-pointer text-xs">
                  <Upload size={12} /> Draft
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>
                <label className="btn-secondary btn-small inline-flex items-center gap-1 cursor-pointer text-xs">
                  {serverCsvBusy ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                  Server
                  <input type="file" accept=".csv" onChange={handleServerCsvUpload} className="hidden" disabled={serverCsvBusy} />
                </label>
                <button type="button" onClick={() => refreshServerList()} className="btn-secondary btn-small inline-flex items-center gap-1 text-xs">
                  {serverLoading ? <Loader2 className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-semibold">Records</h2>
              </div>

              <div className="px-3 pt-2">
                <HoroscopeLanguageTabs
                  languages={languages}
                  activeUiCode={activeLanguage}
                  onChange={setActiveLanguage}
                  variant="underline"
                  compact
                  counts={draftLangCounts}
                />
              </div>

              <div className="max-h-[280px] overflow-y-auto px-3 pb-2" role="tabpanel">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 py-1.5">
                  Local drafts · {activeLangOption.label}
                </p>
                {activeDrafts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No {activeLangOption.label} drafts.</p>
                ) : (
                  <ul className="space-y-1">
                    {activeDrafts.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start justify-between gap-2 rounded border border-slate-100 dark:border-slate-700 px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold">{entry.zodiacSign}</div>
                          <div className="text-[10px] text-slate-500">{entry.startDate} → {entry.endDate}</div>
                          <div className="truncate text-slate-600 dark:text-slate-300">
                            {entry.localized.title[activeLangOption.uiCode] || '—'}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <button type="button" onClick={() => handleEdit(entry)} className="btn-icon-edit p-1"><Pencil size={12} /></button>
                          <button type="button" onClick={() => handleDelete(entry.id)} className="btn-icon-delete p-1"><Trash2 size={12} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 pt-2 pb-1.5 border-t border-slate-100 dark:border-slate-700 mt-2">
                  On server · {activeLangOption.label}
                  <span className="ml-1 font-normal normal-case">({serverLangCounts[activeLangOption.uiCode] ?? 0})</span>
                </p>
                {serverLoading ? (
                  <p className="text-xs text-slate-500 py-1">Loading…</p>
                ) : activeServerRows.length === 0 ? (
                  <p className="text-xs text-slate-500 py-1">No server records.</p>
                ) : (
                  <ul className="space-y-1">
                    {activeServerRows.map((h) => (
                      <li key={h.id} className="rounded border border-slate-100 dark:border-slate-700 px-2 py-1.5 text-xs">
                        <div className="font-semibold">{h.zodiacSign}</div>
                        <div className="text-[10px] text-slate-500">{h.startDate} → {h.endDate}</div>
                        <div className="truncate text-slate-600 dark:text-slate-300">
                          {getHoroscopeTextForLanguage(h, 'title', activeLangOption) || '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
