'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { horoscopeApi } from '@/app/lib/crm.service';
import { masterService } from '@/app/lib/master.service';
import {
  createEmptyLocalesMap,
  DEFAULT_HOROSCOPE_LANGUAGES,
  findHoroscopeLanguage,
  getBaseHoroscopeLanguage,
  getHoroscopeTextForLanguage,
  hasHoroscopeTranslation,
  HOROSCOPE_TEXT_FIELDS,
  localesFromResponse,
  resolveHoroscopeLanguages,
  type HoroscopeLanguageOption,
  type HoroscopeTextField,
} from '@/app/lib/horoscope-multilang';
import type {
  HoroscopeLocaleRequest,
  HoroscopePublishStatusEnum,
  HoroscopeRequest,
  HoroscopeResponse,
  HoroscopeTypeEnum,
  LanguageEnumCode,
  ZodiacSignEnum,
} from '@/app/lib/crm.types';
import { HoroscopeLanguageTabs } from '@/app/horoscope/components/HoroscopeLanguageTabs';

const ZODIAC_OPTIONS: ZodiacSignEnum[] = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

const TYPE_TABS: HoroscopeTypeEnum[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const FIELD_LABELS: Record<HoroscopeTextField, string> = {
  title: 'Title',
  summary: 'Overview / Summary',
  description: 'Description',
  love: 'Love & Relationship',
  career: 'Career & Business',
  money: 'Money & Finance',
  health: 'Health & Wellness',
  family: 'Family & Social Life',
  education: 'Education',
  travel: 'Travel',
  advice: 'Advice',
  mood: 'Mood',
};

const emptyForm = (): HoroscopeRequest => ({
  zodiacSign: 'ARIES',
  horoscopeType: 'DAILY',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  publishStatus: 'DRAFT',
  locales: [],
});

function trimLocale(row: HoroscopeLocaleRequest): HoroscopeLocaleRequest {
  const out: HoroscopeLocaleRequest = { language: row.language };
  for (const f of HOROSCOPE_TEXT_FIELDS) {
    const v = row[f]?.trim();
    if (v) out[f] = v;
  }
  return out;
}

export default function HoroscopeManagePage() {
  const [languages, setLanguages] = useState<HoroscopeLanguageOption[]>(DEFAULT_HOROSCOPE_LANGUAGES);
  const [activeType, setActiveType] = useState<HoroscopeTypeEnum>('DAILY');
  const [activeLang, setActiveLang] = useState('en');
  const [items, setItems] = useState<HoroscopeResponse[]>([]);
  const [form, setForm] = useState<HoroscopeRequest>(emptyForm());
  const [locales, setLocales] = useState<Record<string, HoroscopeLocaleRequest>>(() =>
    createEmptyLocalesMap(DEFAULT_HOROSCOPE_LANGUAGES)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeLanguage = useMemo(
    () => findHoroscopeLanguage(languages, activeLang) ?? getBaseHoroscopeLanguage(languages),
    [languages, activeLang]
  );

  useEffect(() => {
    masterService.language
      .listActive()
      .then((res) => {
        const raw = res?.data;
        const arr = Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
        const resolved = resolveHoroscopeLanguages(arr);
        setLanguages(resolved);
        setLocales(createEmptyLocalesMap(resolved));
      })
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await horoscopeApi.list({
        pageNo: 0,
        pageSize: 100,
        sortBy: 'startDate',
        sortDirection: 'desc',
        horoscopeType: activeType,
      });
      setItems((h.result ?? h.content ?? []) as HoroscopeResponse[]);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const reset = () => {
    setForm({ ...emptyForm(), horoscopeType: activeType });
    setLocales(createEmptyLocalesMap(languages));
    setEditingId(null);
    setActiveLang(getBaseHoroscopeLanguage(languages).uiCode);
  };

  const setEnField = (field: HoroscopeTextField, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const setLocaleField = (lang: LanguageEnumCode, field: HoroscopeTextField, value: string) => {
    setLocales((p) => ({ ...p, [lang]: { ...p[lang], language: lang, [field]: value } }));
  };

  const getDisplayValue = (field: HoroscopeTextField): string => {
    if (activeLanguage.isBase) return (form[field] as string) ?? '';
    return locales[activeLanguage.backendCode]?.[field] ?? '';
  };

  const setDisplayValue = (field: HoroscopeTextField, value: string) => {
    if (activeLanguage.isBase) setEnField(field, value);
    else setLocaleField(activeLanguage.backendCode, field, value);
  };

  const tableRows = useMemo(
    () =>
      activeLanguage.isBase
        ? items
        : items.filter((row) => hasHoroscopeTranslation(row, activeLanguage)),
    [items, activeLanguage]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: HoroscopeRequest = {
      ...form,
      horoscopeType: activeType,
      locales: Object.values(locales).map(trimLocale).filter((row) =>
        HOROSCOPE_TEXT_FIELDS.some((f) => row[f]?.trim())
      ),
    };

    if (!body.title?.trim()) {
      await Swal.fire({ icon: 'error', text: `${getBaseHoroscopeLanguage(languages).label} title is required.` });
      return;
    }
    if (!body.startDate || !body.endDate) {
      await Swal.fire({ icon: 'error', text: 'Start and end dates are required.' });
      return;
    }

    if (editingId) await horoscopeApi.update(editingId, body);
    else await horoscopeApi.create(body);
    await load();
    reset();
  };

  const editRow = async (row: HoroscopeResponse) => {
    const detail = await horoscopeApi.getById(row.id);
    const d = detail.data as HoroscopeResponse | undefined;
    if (!d) return;
    setEditingId(d.id);
    setActiveType(d.horoscopeType);
    setForm({
      zodiacSign: d.zodiacSign,
      horoscopeType: d.horoscopeType,
      title: d.title,
      summary: d.summary,
      description: d.description,
      love: d.love,
      career: d.career,
      money: d.money,
      health: d.health,
      family: d.family,
      education: d.education,
      travel: d.travel,
      advice: d.advice,
      luckyNumber: d.luckyNumber,
      luckyColor: d.luckyColor,
      luckyTime: d.luckyTime,
      mood: d.mood,
      loveRating: d.loveRating,
      careerRating: d.careerRating,
      moneyRating: d.moneyRating,
      healthRating: d.healthRating,
      overallRating: d.overallRating,
      startDate: d.startDate,
      endDate: d.endDate,
      publishStatus: d.publishStatus ?? 'DRAFT',
      locales: d.locales,
    });
    setLocales(localesFromResponse(d, languages));
    setActiveLang(getBaseHoroscopeLanguage(languages).uiCode);
  };

  const removeRow = async (id: string) => {
    await horoscopeApi.delete(id);
    await load();
  };

  const publishRow = async (id: string, status: HoroscopePublishStatusEnum) => {
    await horoscopeApi.changePublishStatus(id, status);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Manage Horoscope' }]} />
        <PageHeaderWithInfo
          title="Horoscope CRUD"
          infoText="Choose a period type and language. Each language has its own table and form section — English is the base record; other languages are locale translations."
        />

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          {TYPE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeType === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => {
                setActiveType(t);
                setForm((p) => ({ ...p, horoscopeType: t }));
              }}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <HoroscopeLanguageTabs
          languages={languages}
          activeUiCode={activeLang}
          onChange={setActiveLang}
        />

        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {activeLanguage.label} content
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              className="form-input"
              value={form.zodiacSign}
              onChange={(e) => setForm((p) => ({ ...p, zodiacSign: e.target.value as ZodiacSignEnum }))}
            >
              {ZODIAC_OPTIONS.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
            <input type="date" className="form-input" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
            <select
              className="form-input"
              value={form.publishStatus ?? 'DRAFT'}
              onChange={(e) => setForm((p) => ({ ...p, publishStatus: e.target.value as HoroscopePublishStatusEnum }))}
            >
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as HoroscopePublishStatusEnum[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {activeLanguage.isBase && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className="form-input" placeholder="Lucky Number" value={form.luckyNumber ?? ''} onChange={(e) => setForm((p) => ({ ...p, luckyNumber: e.target.value }))} />
              <input className="form-input" placeholder="Lucky Color" value={form.luckyColor ?? ''} onChange={(e) => setForm((p) => ({ ...p, luckyColor: e.target.value }))} />
              <input className="form-input" placeholder="Lucky Time" value={form.luckyTime ?? ''} onChange={(e) => setForm((p) => ({ ...p, luckyTime: e.target.value }))} />
              <input className="form-input" placeholder="Mood" value={form.mood ?? ''} onChange={(e) => setForm((p) => ({ ...p, mood: e.target.value }))} />
              {(['loveRating', 'careerRating', 'moneyRating', 'healthRating', 'overallRating'] as const).map((r) => (
                <input
                  key={r}
                  type="number"
                  min={1}
                  max={5}
                  className="form-input"
                  placeholder={r.replace('Rating', ' rating')}
                  value={form[r] ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, [r]: e.target.value ? Number(e.target.value) : undefined }))}
                />
              ))}
            </div>
          )}

          <div className="space-y-3">
            {HOROSCOPE_TEXT_FIELDS.filter((f) => activeLanguage.isBase || f !== 'mood').map((field) => (
              <div key={field}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{FIELD_LABELS[field]}</label>
                <textarea
                  className="form-input w-full"
                  rows={field === 'title' ? 1 : 2}
                  placeholder={FIELD_LABELS[field]}
                  value={getDisplayValue(field)}
                  onChange={(e) => setDisplayValue(field, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-small">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-secondary btn-small" onClick={reset}>Reset</button>
          </div>
        </form>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            {activeLanguage.label} horoscopes ({activeType.toLowerCase()})
          </h3>
          {loading ? (
            <p>Loading...</p>
          ) : tableRows.length === 0 ? (
            <p className="text-sm text-slate-500">
              {activeLanguage.isBase
                ? 'No horoscopes for this period.'
                : `No ${activeLanguage.label} translations yet.`}
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Zodiac</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Summary</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td className="py-2 pr-3">{x.zodiacSign}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{x.startDate} → {x.endDate}</td>
                    <td className="py-2 pr-3 max-w-[200px] truncate">
                      {getHoroscopeTextForLanguage(x, 'title', activeLanguage) || '—'}
                    </td>
                    <td className="py-2 pr-3 max-w-[280px] truncate">
                      {getHoroscopeTextForLanguage(x, 'summary', activeLanguage) || '—'}
                    </td>
                    <td className="py-2 pr-3">{x.publishStatus ?? 'DRAFT'}</td>
                    <td className="py-2 space-x-1 whitespace-nowrap">
                      <button type="button" className="btn-icon-edit" onClick={() => editRow(x)}>E</button>
                      {x.publishStatus !== 'PUBLISHED' && (
                        <button type="button" className="btn-secondary btn-small" onClick={() => publishRow(x.id, 'PUBLISHED')}>Pub</button>
                      )}
                      <button type="button" className="btn-icon-delete" onClick={() => removeRow(x.id)}>D</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
