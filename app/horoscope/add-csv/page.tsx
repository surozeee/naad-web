'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloudUpload, Download, FileSpreadsheet, Loader2, Pencil, Plus, Save, Send, Trash2, Upload, X } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { horoscopeApi } from '@/app/lib/crm.service';
import { masterService } from '@/app/lib/master.service';
import {
  buildHoroscopeRequest,
  computeOverallRating,
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
import {
  adIsoToBsIso,
  deriveBsPeriodSelection,
  formatIsoDate,
  resolveHoroscopePeriodDates,
  resolvePeriodDatesFromCsvFields,
} from '@/app/lib/horoscope-date-period';
import { HoroscopeLanguageTabs } from '@/app/horoscope/components/HoroscopeLanguageTabs';
import { HoroscopeColorPicker } from '@/app/horoscope/components/HoroscopeColorPicker';
import { HoroscopeRatingsPanel } from '@/app/horoscope/components/HoroscopeRatingsPanel';
import { BsDateText } from '@/app/horoscope/components/BsDateText';
import { HoroscopePeriodDateField } from '@/app/horoscope/components/HoroscopePeriodDateField';
import { useHoroscopeI18n } from '@/app/lib/horoscope-i18n';
import { localizeDigits } from '@/app/lib/nepali-digits';

interface HoroscopeEntry {
  id: string;
  horoscopeType: HoroscopeTypeEnum;
  startDate: string;
  endDate: string;
  zodiacSign: ZodiacSignEnum;
  luckyNumber: string;
  luckyColor: string;
  luckyTime: string;
  overallRating?: number;
  loveRating?: number;
  careerRating?: number;
  moneyRating?: number;
  healthRating?: number;
  familyRating?: number;
  educationRating?: number;
  travelRating?: number;
  luckRating?: number;
  localized: HoroscopeLocalizedFields;
  serverId?: string;
}

type HoroscopeFormState = Omit<HoroscopeEntry, 'id' | 'serverId'>;

const STORAGE_KEY = 'horoscope-add-csv-drafts-v5';
const TYPE_TABS: HoroscopeTypeEnum[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const ZODIAC_OPTIONS: ZodiacSignEnum[] = [
  'ARIES',
  'TAURUS',
  'GEMINI',
  'CANCER',
  'LEO',
  'VIRGO',
  'LIBRA',
  'SCORPIO',
  'SAGITTARIUS',
  'CAPRICORN',
  'AQUARIUS',
  'PISCES',
];

const FORM_TEXT_FIELDS: HoroscopeTextField[] = [...HOROSCOPE_TEXT_FIELDS];

const CSV_BASE_HEADERS = [
  'horoscopeType',
  'zodiacSign',
  'date', // DAILY: one BS date (YYYY-MM-DD)
  'bsYear', // WEEKLY / MONTHLY / YEARLY
  'bsMonth', // WEEKLY / MONTHLY (1–12 or name)
  'bsWeek', // WEEKLY (1–5)
  'luckyNumber',
  'luckyColor',
  'luckyTime',
  'overallRating',
  'loveRating',
  'careerRating',
  'financeRating',
  'healthRating',
  'familyRating',
  'educationRating',
  'travelRating',
  'luckRating',
  'status',
] as const;

function buildCsvHeaders(languages: HoroscopeLanguageOption[]): string[] {
  const langCodes = languages.length
    ? languages.map((l) => l.uiCode)
    : DEFAULT_HOROSCOPE_LANGUAGES.map((l) => l.uiCode);
  return [
    ...CSV_BASE_HEADERS,
    ...FORM_TEXT_FIELDS.flatMap((f) => langCodes.map((code) => `${f}_${code}`)),
  ];
}

function todayIso(): string {
  return formatIsoDate(new Date());
}

function createEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialForm(
  type: HoroscopeTypeEnum,
  languages: HoroscopeLanguageOption[] = DEFAULT_HOROSCOPE_LANGUAGES
): HoroscopeFormState {
  const period = resolveHoroscopePeriodDates(type, todayIso());
  return {
    horoscopeType: type,
    startDate: period.startDate,
    endDate: period.endDate,
    zodiacSign: 'ARIES',
    luckyNumber: '',
    luckyColor: '',
    luckyTime: '',
    overallRating: undefined,
    loveRating: undefined,
    careerRating: undefined,
    moneyRating: undefined,
    healthRating: undefined,
    familyRating: undefined,
    educationRating: undefined,
    travelRating: undefined,
    luckRating: undefined,
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
  return (ZODIAC_OPTIONS as string[]).includes(value);
}

function resolveLocalizedField(
  rowData: Record<string, string>,
  field: HoroscopeTextField,
  languages: HoroscopeLanguageOption[]
) {
  const fallback = rowData[field] ?? '';
  const out: Record<string, string> = {};
  for (const lang of languages) {
    out[lang.uiCode] =
      rowData[`${field}_${lang.uiCode}`] ??
      (lang.uiCode === 'ne' ? rowData[`${field}_np`] : undefined) ??
      (lang.isBase ? fallback : '') ??
      '';
  }
  if (!languages.length) {
    out.en = rowData[`${field}_en`] ?? fallback;
  }
  return out;
}

function parseOptionalRating(raw?: string): number | undefined {
  if (!raw?.trim()) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
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
    overallRating: entry.overallRating,
    loveRating: entry.loveRating,
    careerRating: entry.careerRating,
    moneyRating: entry.moneyRating,
    healthRating: entry.healthRating,
    familyRating: entry.familyRating,
    educationRating: entry.educationRating,
    travelRating: entry.travelRating,
    luckRating: entry.luckRating,
    localized: entry.localized,
  };
}

function statusTone(message: string): 'success' | 'error' | 'info' {
  if (!message) return 'info';
  if (/fail|error|invalid|http 4|http 5|required|no valid/i.test(message)) return 'error';
  if (/synced|imported|downloaded|added|updated|created|finished|saved|published|preview ready/i.test(message))
    return 'success';
  return 'info';
}


export default function AddHoroscopeCsvPage() {
  const { t, typeLabel, zodiacName, uiCode } = useHoroscopeI18n();
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
  const [draftsHydrated, setDraftsHydrated] = useState(false);
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<HoroscopeEntry[]>([]);
  const [csvPreviewFileName, setCsvPreviewFileName] = useState('');
  const [csvPreviewError, setCsvPreviewError] = useState('');
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const uploadDraftInputRef = useRef<HTMLInputElement | null>(null);

  const activeLangOption = useMemo(
    () => findHoroscopeLanguage(languages, activeLanguage) ?? getBaseHoroscopeLanguage(languages),
    [languages, activeLanguage]
  );
  const baseLang = useMemo(() => getBaseHoroscopeLanguage(languages), [languages]);

  useEffect(() => {
    masterService.language
      .listActive()
      .then((res) => {
        const raw = res?.data;
        const arr = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
        const resolved = resolveHoroscopeLanguages(arr);
        setLanguages(resolved);
        if (resolved.length) {
          setActiveLanguage(getBaseHoroscopeLanguage(resolved).uiCode);
          setFormData((prev) => ({
            ...prev,
            localized: createEmptyLocalizedFields(resolved),
          }));
        }
      })
      .catch(() => setLanguages([]));
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
    setFormData((prev) => {
      const period = resolveHoroscopePeriodDates(activeType, prev.startDate || todayIso());
      return {
        ...prev,
        horoscopeType: activeType,
        startDate: period.startDate,
        endDate: period.endDate,
      };
    });
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
      counts[lang.uiCode] = items.filter((entry) =>
        Boolean(entry.localized.summary[lang.uiCode]?.trim())
      ).length;
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
      (groupedEntries.find((g) => g.type === activeType)?.items ?? []).filter((entry) =>
        Boolean(entry.localized.summary[activeLangOption.uiCode]?.trim())
      ),
    [groupedEntries, activeType, activeLangOption]
  );

  const activeDraftIdSet = useMemo(() => new Set(activeDrafts.map((e) => e.id)), [activeDrafts]);
  const selectedVisibleIds = useMemo(
    () => selectedDraftIds.filter((id) => activeDraftIdSet.has(id)),
    [selectedDraftIds, activeDraftIdSet]
  );
  const allVisibleSelected =
    activeDrafts.length > 0 && selectedVisibleIds.length === activeDrafts.length;

  // Drop stale selections when tab/language/draft list changes
  useEffect(() => {
    setSelectedDraftIds((prev) => prev.filter((id) => activeDraftIdSet.has(id)));
  }, [activeDraftIdSet]);

  const toggleDraftSelected = (id: string) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllDrafts = () => {
    if (allVisibleSelected) {
      setSelectedDraftIds((prev) => prev.filter((id) => !activeDraftIdSet.has(id)));
      return;
    }
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      for (const entry of activeDrafts) next.add(entry.id);
      return [...next];
    });
  };

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
    const nextErrors: Record<string, string> = {};
    if (!formData.zodiacSign) nextErrors.zodiacSign = 'Zodiac sign is required';
    if (!formData.startDate) nextErrors.startDate = 'Date is required';
    if (!formData.endDate) nextErrors.endDate = 'End date is required';
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
      overallRating: computeOverallRating(formData),
      serverId: editingId ? entries.find((x) => x.id === editingId)?.serverId : undefined,
    };
    setEntries((prev) => (editingId ? prev.map((item) => (item.id === editingId ? payload : item)) : [payload, ...prev]));
    setCsvMessage(editingId ? 'Draft updated.' : 'Draft added.');
    resetForm();
  };

  const handleEdit = (entry: HoroscopeEntry) => {
    setActiveType(entry.horoscopeType);
    const period = resolveHoroscopePeriodDates(entry.horoscopeType, entry.startDate || todayIso());
    setFormData({
      horoscopeType: entry.horoscopeType,
      startDate: period.startDate,
      endDate: period.endDate,
      zodiacSign: entry.zodiacSign,
      luckyNumber: entry.luckyNumber,
      luckyColor: entry.luckyColor,
      luckyTime: entry.luckyTime ?? '',
      overallRating: entry.overallRating,
      loveRating: entry.loveRating,
      careerRating: entry.careerRating,
      moneyRating: entry.moneyRating,
      healthRating: entry.healthRating,
      familyRating: entry.familyRating,
      educationRating: entry.educationRating,
      travelRating: entry.travelRating,
      luckRating: entry.luckRating,
      localized: JSON.parse(JSON.stringify(entry.localized)) as HoroscopeLocalizedFields,
    });
    setEditingId(entry.id);
    setCsvMessage('');
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    setSelectedDraftIds((prev) => prev.filter((x) => x !== id));
    if (editingId === id) resetForm();
    setCsvMessage('Draft removed.');
  };

  const parseCsvTextToEntries = useCallback(
    (text: string): { entries: HoroscopeEntry[]; error?: string } => {
      const rows = parseCsvRows(text);
      if (rows.length < 2) {
        return { entries: [], error: 'CSV must include a header row and at least one data row.' };
      }
      const headerMap = rows[0].map((cell) => normalizeCsvValue(cell).toLowerCase().replace(/[\s-]+/g, ''));
      const imported: HoroscopeEntry[] = [];
      for (const row of rows.slice(1)) {
        const rowData = Object.fromEntries(
          headerMap.map((header, index) => [header, normalizeCsvValue(row[index] ?? '')])
        ) as Record<string, string>;
        const horoscopeType = (rowData.horoscopetype ?? rowData.period ?? activeType).toUpperCase() as HoroscopeTypeEnum;
        const zodiacSign = (rowData.zodiacsign ?? '').toUpperCase();
        if (!TYPE_TABS.includes(horoscopeType) || !isValidZodiac(zodiacSign)) continue;

        const period = resolvePeriodDatesFromCsvFields({
          horoscopeType,
          date: rowData.date,
          bsYear: rowData.bsyear,
          bsMonth: rowData.bsmonth,
          bsWeek: rowData.bsweek,
          startDate: rowData.startdate,
          endDate: rowData.enddate,
        });
        if (!period) continue;
        const { startDate, endDate } = period;

        const localized = createEmptyLocalizedFields(languages);
        for (const field of HOROSCOPE_TEXT_FIELDS) {
          localized[field] = resolveLocalizedField(rowData, field, languages);
        }
        const entry: HoroscopeEntry = {
          id: createEntryId(),
          horoscopeType,
          startDate,
          endDate,
          zodiacSign,
          luckyNumber: rowData.luckynumber ?? '',
          luckyColor: rowData.luckycolor ?? rowData.color ?? '',
          luckyTime: rowData.luckytime ?? '',
          loveRating: parseOptionalRating(rowData.loverating),
          careerRating: parseOptionalRating(rowData.careerrating),
          moneyRating: parseOptionalRating(rowData.financerating ?? rowData.moneyrating),
          healthRating: parseOptionalRating(rowData.healthrating),
          familyRating: parseOptionalRating(rowData.familyrating),
          educationRating: parseOptionalRating(rowData.educationrating),
          travelRating: parseOptionalRating(rowData.travelrating),
          luckRating: parseOptionalRating(rowData.luckrating),
          overallRating: undefined,
          localized,
        };
        entry.overallRating = computeOverallRating(entry);
        imported.push(entry);
      }
      if (imported.length === 0) {
        return {
          entries: [],
          error:
            'No valid rows. Use date (daily), or bsYear/bsMonth/bsWeek (weekly), bsYear/bsMonth (monthly), bsYear (yearly).',
        };
      }
      return { entries: imported };
    },
    [activeType, languages]
  );

  const handleUploadDraft = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const { entries: imported, error } = parseCsvTextToEntries(text);
      if (error || !imported.length) {
        setCsvPreviewOpen(false);
        setCsvPreviewRows([]);
        setCsvPreviewError(error || 'No valid rows found.');
        setCsvMessage(error || 'No valid rows found.');
        return;
      }
      setCsvPreviewFileName(file.name);
      setCsvPreviewRows(imported);
      setCsvPreviewError('');
      setCsvPreviewOpen(true);
      setCsvMessage(`Preview ready: ${imported.length} row(s) from ${file.name}`);
    } catch {
      setCsvMessage('Failed to read CSV file.');
      setCsvPreviewError('Failed to read CSV file.');
    }
  };

  const confirmUploadDraft = () => {
    if (!csvPreviewRows.length) return;
    setEntries((prev) => [...csvPreviewRows, ...prev]);
    setCsvMessage(`${csvPreviewRows.length} row(s) added to local drafts.`);
    setCsvPreviewOpen(false);
    setCsvPreviewRows([]);
    setCsvPreviewFileName('');
  };

  const cancelUploadDraft = () => {
    setCsvPreviewOpen(false);
    setCsvPreviewRows([]);
    setCsvPreviewFileName('');
    setCsvPreviewError('');
    setCsvMessage('Upload cancelled.');
  };

  const handleDownloadSample = () => {
    if (!languages.length) {
      setCsvMessage('No active languages. Enable languages in Master before downloading a template.');
      return;
    }
    const headers = buildCsvHeaders(languages);
    const period = resolveHoroscopePeriodDates(activeType, todayIso());
    const bsSel = deriveBsPeriodSelection(period.startDate);
    const dailyBs = adIsoToBsIso(period.startDate) || period.startDate;
    const base = getBaseHoroscopeLanguage(languages);

    const sampleZodiacs: ZodiacSignEnum[] = ['ARIES', 'TAURUS', 'GEMINI'];
    const sampleLines = sampleZodiacs.map((zodiac, index) => {
      const localized = createEmptyLocalizedFields(languages);
      for (const lang of languages) {
        localized.summary[lang.uiCode] =
          lang.uiCode === base.uiCode
            ? `${zodiac} ${activeType.toLowerCase()} overview — focused action and confident decisions.`
            : `${zodiac} overview (${lang.label}).`;
        localized.love[lang.uiCode] =
          lang.uiCode === base.uiCode
            ? 'Open communication may strengthen your relationships.'
            : `Love note (${lang.label}).`;
        localized.career[lang.uiCode] =
          lang.uiCode === base.uiCode ? 'Steady progress at work is favored.' : `Career note (${lang.label}).`;
        localized.money[lang.uiCode] =
          lang.uiCode === base.uiCode ? 'Plan expenses carefully.' : `Finance note (${lang.label}).`;
        localized.health[lang.uiCode] =
          lang.uiCode === base.uiCode ? 'Rest and balance support wellness.' : `Health note (${lang.label}).`;
      }

      const dateCol = activeType === 'DAILY' ? dailyBs : '';
      const yearCol =
        activeType === 'WEEKLY' || activeType === 'MONTHLY' || activeType === 'YEARLY'
          ? String(bsSel.year)
          : '';
      const monthCol =
        activeType === 'WEEKLY' || activeType === 'MONTHLY' ? String(bsSel.month) : '';
      const weekCol = activeType === 'WEEKLY' ? String(Math.min(5, bsSel.week + (index % 2))) : '';

      const cells = [
        activeType,
        zodiac,
        dateCol,
        yearCol,
        monthCol,
        weekCol,
        String(3 + index),
        index === 0 ? 'Red, Gold' : index === 1 ? 'Blue' : 'Green',
        index === 0 ? '10:30 AM-12:00 PM' : 'Morning',
        '', // overallRating auto-averaged
        '3.5',
        '4.0',
        '3.5',
        '4.0',
        '3.5',
        '4.5',
        '3.5',
        '4.0',
        'DRAFT',
        ...FORM_TEXT_FIELDS.flatMap((f) => languages.map((lang) => localized[f][lang.uiCode] ?? '')),
      ];
      return cells.map(escapeCsvCell).join(',');
    });

    const csvBody = [`${headers.map(escapeCsvCell).join(',')}`, ...sampleLines].join('\n');
    const blob = new Blob([`\uFEFF${csvBody}\n`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horoscope-${activeType.toLowerCase()}-sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
    const periodHint =
      activeType === 'DAILY'
        ? 'date (BS)'
        : activeType === 'WEEKLY'
          ? 'bsYear + bsMonth + bsWeek'
          : activeType === 'MONTHLY'
            ? 'bsYear + bsMonth'
            : 'bsYear';
    setCsvMessage(`Sample CSV downloaded for ${activeType} (${periodHint}).`);
  };

  const resolveServerId = async (entry: HoroscopeEntry): Promise<string | undefined> => {
    if (entry.serverId) return entry.serverId;
    const res = await horoscopeApi.list({
      pageNo: 0,
      pageSize: 1,
      horoscopeType: entry.horoscopeType,
      startDate: entry.startDate,
      endDate: entry.endDate,
      zodiacSign: entry.zodiacSign,
      status: 'ACTIVE',
    });
    return ((res.result ?? res.content ?? []) as HoroscopeResponse[])[0]?.id;
  };

  const handleSaveDraft = async () => {
    const toSave = entries.filter((e) => e.horoscopeType === activeType);
    if (toSave.length === 0) {
      setCsvMessage('No drafts to save on this tab. Upload a CSV or add drafts first.');
      return;
    }
    if (syncing) return;
    setSyncing(true);
    setCsvMessage('');
    try {
      const idUpdates = new Map<string, string>();
      const rowErrors: string[] = [];
      let saved = 0;
      for (const entry of toSave) {
        const period = resolveHoroscopePeriodDates(entry.horoscopeType, entry.startDate || todayIso());
        const normalizedEntry: HoroscopeEntry = {
          ...entry,
          startDate: entry.startDate?.trim() || period.startDate,
          endDate: entry.endDate?.trim() || period.endDate,
        };
        if (normalizedEntry.horoscopeType === 'DAILY') {
          normalizedEntry.endDate = normalizedEntry.startDate;
        }
        const multilang = entryToMultilangEntry(normalizedEntry);
        const validationError = validateHoroscopeMultilangEntry(multilang, languages);
        if (validationError) {
          rowErrors.push(`${entry.zodiacSign}: ${validationError}`);
          continue;
        }
        const body = buildHoroscopeRequest({ ...multilang, publishStatus: 'DRAFT' }, languages);
        try {
          const existingId = entry.serverId ?? (await resolveServerId(normalizedEntry));
          if (existingId) {
            await horoscopeApi.update(existingId, body);
            idUpdates.set(entry.id, existingId);
          } else {
            await horoscopeApi.create(body);
            const createdId = await resolveServerId(normalizedEntry);
            if (createdId) idUpdates.set(entry.id, createdId);
          }
          saved += 1;
        } catch (err) {
          rowErrors.push(`${entry.zodiacSign}: ${err instanceof Error ? err.message : 'Save failed'}`);
        }
      }
      setEntries((prev) => prev.map((e) => (idUpdates.has(e.id) ? { ...e, serverId: idUpdates.get(e.id) } : e)));
      setCsvMessage(
        rowErrors.length > 0
          ? `Saved ${saved} draft(s) with ${rowErrors.length} error(s): ${rowErrors.slice(0, 3).join('; ')}`
          : `Saved ${saved} draft(s) to server (upsert by zodiac + type + date range).`
      );
      await refreshServerList();
    } catch (e) {
      setCsvMessage(e instanceof Error ? e.message : 'Save draft failed');
    } finally {
      setSyncing(false);
    }
  };

  const handlePublish = async () => {
    const selectedSet = new Set(selectedVisibleIds);
    const toPublish = activeDrafts.filter((e) => selectedSet.has(e.id));
    if (toPublish.length === 0) {
      setCsvMessage(t('add.selectDraftsToPublish'));
      return;
    }
    if (syncing) return;
    setSyncing(true);
    setCsvMessage('');
    try {
      const publishedIds = new Set<string>();
      const idUpdates = new Map<string, string>();
      const rowErrors: string[] = [];
      for (const entry of toPublish) {
        try {
          const period = resolveHoroscopePeriodDates(entry.horoscopeType, entry.startDate || todayIso());
          const normalizedEntry: HoroscopeEntry = {
            ...entry,
            startDate: entry.startDate?.trim() || period.startDate,
            endDate: entry.endDate?.trim() || period.endDate,
          };
          if (normalizedEntry.horoscopeType === 'DAILY') {
            normalizedEntry.endDate = normalizedEntry.startDate;
          }

          // Status-only: must already exist on server (Save Draft first). No create/update.
          let serverId = entry.serverId ?? (await resolveServerId(normalizedEntry));
          if (!serverId) {
            rowErrors.push(`${entry.zodiacSign}: ${t('add.saveDraftBeforePublish')}`);
            continue;
          }
          await horoscopeApi.changePublishStatus(serverId, 'PUBLISHED');
          publishedIds.add(entry.id);
          idUpdates.set(entry.id, serverId);
        } catch (err) {
          rowErrors.push(`${entry.zodiacSign}: ${err instanceof Error ? err.message : 'Publish failed'}`);
        }
      }
      setEntries((prev) =>
        prev.map((e) => (idUpdates.has(e.id) ? { ...e, serverId: idUpdates.get(e.id) } : e))
      );
      setSelectedDraftIds((prev) => prev.filter((id) => !publishedIds.has(id)));
      const published = publishedIds.size;
      setCsvMessage(
        rowErrors.length > 0
          ? `Published ${published} with ${rowErrors.length} error(s): ${rowErrors.slice(0, 3).join('; ')}`
          : `Published ${published} — status set to PUBLISHED.`
      );
      await refreshServerList();
    } catch (e) {
      setCsvMessage(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="horoscope-csv-page space-y-4 max-w-[1400px] text-black dark:text-white">
        <Breadcrumb
          items={[
            { label: t('common.horoscope'), href: '/horoscope' },
            { label: t('add.breadcrumbAdd') },
          ]}
        />
        <PageHeaderWithInfo title={t('add.pageTitle')} infoText={t('add.infoText')} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-600">
            {TYPE_TABS.map((tabType) => (
              <button
                key={tabType}
                type="button"
                className={`horoscope-tab px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  activeType === tabType ? 'is-active' : 'border-transparent hover:text-black dark:hover:text-white'
                }`}
                onClick={() => setActiveType(tabType)}
              >
                {typeLabel(tabType)}
                <span className="ml-1 text-[10px] opacity-70">
                  ({localizeDigits(totals.find((x) => x.type === tabType)?.count ?? 0, uiCode)})
                </span>
              </button>
            ))}
          </div>
          {csvMessage ? (
            <p className={`horoscope-status max-w-xl ${statusTone(csvMessage) === 'error' ? 'is-error' : statusTone(csvMessage) === 'success' ? 'is-success' : 'is-info'}`}>
              {csvMessage}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="horoscope-panel rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-black dark:text-white">
                {editingId ? t('add.editDraft') : t('add.newDraft')}
              </h2>
              <span className="text-[11px] font-medium uppercase tracking-wide horoscope-muted">
                {typeLabel(activeType)}
              </span>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider horoscope-key">
                  {t('add.periodAndLuck')}
                </p>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex flex-col gap-1 min-w-[9rem] w-[9.5rem] shrink-0">
                      <span className="text-xs font-semibold horoscope-key">{t('add.zodiac')}</span>
                      <select
                        name="zodiacSign"
                        value={formData.zodiacSign}
                        onChange={handleInputChange}
                        className="form-input text-sm py-1.5 h-9"
                      >
                        {ZODIAC_OPTIONS.map((sign) => (
                          <option key={sign} value={sign}>
                            {zodiacName(sign)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <HoroscopePeriodDateField
                      inline
                      horoscopeType={activeType}
                      startDate={formData.startDate}
                      endDate={formData.endDate}
                      onChange={({ startDate, endDate }) =>
                        setFormData((prev) => ({ ...prev, startDate, endDate }))
                      }
                    />
                  </div>
                  {errors.startDate || errors.endDate ? (
                    <p className="text-[11px] text-red-600 -mt-1">
                      {errors.startDate || errors.endDate}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                  <label className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-semibold horoscope-key">{t('common.luckyNumber')}</span>
                    <input
                      name="luckyNumber"
                      value={formData.luckyNumber}
                      onChange={handleInputChange}
                      placeholder={t('add.placeholderLuckyNumber')}
                      className="form-input text-sm py-1.5 h-9"
                    />
                  </label>
                  <label className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-semibold horoscope-key">{t('common.luckyTime')}</span>
                    <input
                      name="luckyTime"
                      value={formData.luckyTime}
                      onChange={handleInputChange}
                      placeholder={t('add.placeholderLuckyTime')}
                      className="form-input text-sm py-1.5 h-9"
                    />
                  </label>
                  <label className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-semibold horoscope-key">{t('common.mood')}</span>
                    <input
                      value={formData.localized.mood[baseLang.uiCode] ?? ''}
                      onChange={(e) => handleLocalizedChange('mood', baseLang.uiCode, e.target.value)}
                      placeholder={t('add.placeholderMood')}
                      className="form-input text-sm py-1.5 h-9"
                    />
                  </label>
                </div>
                </div>
                <HoroscopeColorPicker
                  value={formData.luckyColor}
                  onChange={(luckyColor) => setFormData((p) => ({ ...p, luckyColor }))}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider horoscope-key">
                  {t('common.ratings')}
                </p>
                <HoroscopeRatingsPanel
                  value={{
                    loveRating: formData.loveRating,
                    careerRating: formData.careerRating,
                    moneyRating: formData.moneyRating,
                    healthRating: formData.healthRating,
                    familyRating: formData.familyRating,
                    educationRating: formData.educationRating,
                    travelRating: formData.travelRating,
                    luckRating: formData.luckRating,
                    overallRating: formData.overallRating,
                  }}
                  onChange={(ratings) => setFormData((p) => ({ ...p, ...ratings }))}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider horoscope-key">
                    {t('common.content')}
                  </p>
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  role="tabpanel"
                  aria-label={`${activeLangOption.label} content`}
                >
                  {FORM_TEXT_FIELDS.filter((field) => !activeLangOption.isBase || field !== 'mood').map((field) => (
                    <div key={field} className={field === 'summary' ? 'md:col-span-2' : ''}>
                      <label className="text-xs font-semibold horoscope-key">
                        {t(`common.fields.${field}`)}
                      </label>
                      <textarea
                        rows={field === 'summary' ? 3 : 2}
                        value={formData.localized[field][activeLanguage] ?? ''}
                        onChange={(e) => handleLocalizedChange(field, activeLanguage, e.target.value)}
                        className="form-input w-full mt-1 text-sm py-2"
                        placeholder={t(`common.fields.${field}`)}
                      />
                      {errors[`${field}_${activeLanguage}`] ? (
                        <p className="text-[11px] text-red-600 mt-0.5">{errors[`${field}_${activeLanguage}`]}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={handleAddOrUpdate} className="btn-primary btn-small inline-flex items-center gap-1.5">
                  {editingId ? <Save size={13} /> : <Plus size={13} />}
                  {editingId ? t('add.updateDraft') : t('add.addDraft')}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary btn-small">
                  {t('add.reset')}
                </button>
                <button type="button" onClick={handleSaveDraft} disabled={syncing} className="btn-secondary btn-small inline-flex items-center gap-1.5">
                  {syncing ? <Loader2 className="animate-spin" size={13} /> : <CloudUpload size={13} />}
                  {t('add.saveDraft')}
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="horoscope-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet size={16} className="text-black dark:text-white" />
                <h2 className="text-sm font-semibold text-black dark:text-white">{t('add.csvImport')}</h2>
              </div>
              <p className="text-xs horoscope-muted mb-3">{t('add.csvHint')}</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={handleDownloadSample} className="btn-secondary btn-small inline-flex items-center gap-1 text-xs">
                  <Download size={12} /> {t('add.sample')}
                </button>
                <label className="btn-primary btn-small inline-flex items-center gap-1 cursor-pointer text-xs">
                  <Upload size={12} /> {t('add.uploadDraft')}
                  <input
                    ref={uploadDraftInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleUploadDraft}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={syncing || entries.length === 0}
                  className="btn-secondary btn-small inline-flex items-center gap-1 text-xs disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="animate-spin" size={12} /> : <CloudUpload size={12} />}
                  {t('add.saveDraft')}
                </button>
              </div>
            </div>

            <div className="horoscope-panel rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-black dark:text-white">{t('add.records')}</h2>
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

              <div className="max-h-[280px] overflow-y-auto px-4 pb-3" role="tabpanel">
                <div className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide horoscope-muted">
                    {t('add.localDrafts', { lang: activeLangOption.label })}
                  </p>
                  {activeDrafts.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-black dark:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate =
                                selectedVisibleIds.length > 0 && !allVisibleSelected;
                            }
                          }}
                          onChange={toggleSelectAllDrafts}
                          className="rounded border-slate-300"
                        />
                        <span>{t('add.selectAll')}</span>
                        <span className="horoscope-muted font-normal">
                          (
                          {t('add.selectedCount', {
                            selected: localizeDigits(selectedVisibleIds.length, uiCode),
                            total: localizeDigits(activeDrafts.length, uiCode),
                          })}
                          )
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={syncing || selectedVisibleIds.length === 0}
                        className="btn-primary btn-small inline-flex items-center gap-1 text-xs disabled:opacity-50"
                        title={
                          selectedVisibleIds.length === 0
                            ? t('add.selectDraftsToPublish')
                            : t('add.publishSelected')
                        }
                      >
                        {syncing ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                        {t('add.publish')}
                        {selectedVisibleIds.length > 0
                          ? ` (${localizeDigits(selectedVisibleIds.length, uiCode)})`
                          : ''}
                      </button>
                    </div>
                  ) : null}
                </div>
                {activeDrafts.length === 0 ? (
                  <p className="text-xs horoscope-muted py-2">
                    {t('add.noLocalDrafts', { lang: activeLangOption.label })}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {activeDrafts.map((entry) => {
                      const checked = selectedDraftIds.includes(entry.id);
                      return (
                      <li
                        key={entry.id}
                        className={`flex items-start justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          checked
                            ? 'border-blue-400 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <label className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer text-black dark:text-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDraftSelected(entry.id)}
                            className="mt-0.5 rounded border-slate-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold">{zodiacName(entry.zodiacSign)}</div>
                            <div className="text-[10px] horoscope-muted">
                              <BsDateText startDate={entry.startDate} endDate={entry.endDate} />
                            </div>
                            <div className="truncate">
                              {entry.localized.summary[activeLangOption.uiCode] || '—'}
                            </div>
                          </div>
                        </label>
                        <div className="flex shrink-0 gap-0.5">
                          <button type="button" onClick={() => handleEdit(entry)} className="btn-icon-edit p-1"><Pencil size={12} /></button>
                          <button type="button" onClick={() => handleDelete(entry.id)} className="btn-icon-delete p-1"><Trash2 size={12} /></button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                )}

                <p className="text-[10px] font-semibold uppercase tracking-wide horoscope-muted pt-3 pb-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                  {t('add.onServer', { lang: activeLangOption.label })}
                  <span className="ml-1 font-normal normal-case">
                    ({localizeDigits(serverLangCounts[activeLangOption.uiCode] ?? 0, uiCode)})
                  </span>
                </p>
                {serverLoading ? (
                  <p className="text-xs horoscope-muted py-1">{t('add.loading')}</p>
                ) : activeServerRows.length === 0 ? (
                  <p className="text-xs horoscope-muted py-1">{t('add.noServerRecords')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {activeServerRows.map((h) => (
                      <li key={h.id} className="rounded-lg border border-slate-200 dark:border-slate-600 px-2.5 py-2 text-xs text-black dark:text-white">
                        <div className="font-semibold">
                          {h.zodiacSign ? zodiacName(h.zodiacSign as ZodiacSignEnum) : '—'}
                        </div>
                        <div className="text-[10px] horoscope-muted">
                          <BsDateText startDate={h.startDate} endDate={h.endDate} />
                          {h.publishStatus ? ` · ${h.publishStatus}` : ''}
                        </div>
                        <div className="truncate">
                          {getHoroscopeTextForLanguage(h, 'summary', activeLangOption) || '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>

        {csvPreviewOpen ? (
          <div className="modal-overlay" onClick={cancelUploadDraft}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 960, width: '95%' }}
            >
              <div className="modal-header">
                <div>
                  <h2 className="text-base font-semibold">{t('add.previewTitle')}</h2>
                  <p className="text-xs horoscope-muted mt-0.5">
                    {t('add.previewMeta', {
                      file: csvPreviewFileName || 'CSV',
                      count: localizeDigits(csvPreviewRows.length, uiCode),
                    })}
                  </p>
                </div>
                <button type="button" className="modal-close" onClick={cancelUploadDraft} aria-label={t('add.close')}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                {csvPreviewError ? (
                  <p className="text-sm text-red-600">{csvPreviewError}</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table country-data-table text-xs">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t('add.colType')}</th>
                          <th>{t('add.colZodiac')}</th>
                          <th>{t('add.colPeriod')}</th>
                          <th>{t('add.colLucky')}</th>
                          <th>{t('add.colColor')}</th>
                          <th>{t('add.colOverall')}</th>
                          <th>{t('add.colOverview')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreviewRows.map((row, idx) => {
                          const base = getBaseHoroscopeLanguage(languages);
                          return (
                            <tr key={row.id}>
                              <td>{localizeDigits(idx + 1, uiCode)}</td>
                              <td>{typeLabel(row.horoscopeType)}</td>
                              <td className="font-semibold">{zodiacName(row.zodiacSign)}</td>
                              <td>
                                <BsDateText startDate={row.startDate} endDate={row.endDate} />
                              </td>
                              <td>
                                {row.luckyNumber
                                  ? localizeDigits(row.luckyNumber, uiCode)
                                  : '—'}
                              </td>
                              <td className="max-w-[8rem] truncate" title={row.luckyColor}>
                                {row.luckyColor || '—'}
                              </td>
                              <td>
                                {row.overallRating != null
                                  ? localizeDigits(Number(row.overallRating).toFixed(1), uiCode)
                                  : '—'}
                              </td>
                              <td className="max-w-[14rem] truncate" title={row.localized.summary[base.uiCode] || ''}>
                                {row.localized.summary[base.uiCode] || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={cancelUploadDraft}>
                  {t('add.cancel')}
                </button>
                <button
                  type="button"
                  className="btn-primary inline-flex items-center gap-1.5"
                  onClick={confirmUploadDraft}
                  disabled={!csvPreviewRows.length}
                >
                  <Upload size={14} />
                  {t('add.confirmUploadCount', {
                    count: localizeDigits(csvPreviewRows.length, uiCode),
                  })}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
