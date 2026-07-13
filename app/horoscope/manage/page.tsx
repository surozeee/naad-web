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
  computeOverallRating,
  DEFAULT_HOROSCOPE_LANGUAGES,
  findHoroscopeLanguage,
  getBaseHoroscopeLanguage,
  getHoroscopeTextForLanguage,
  hasHoroscopeTranslation,
  HOROSCOPE_TEXT_FIELDS,
  isValidHoroscopeRating,
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
import { formatIsoDate, resolveHoroscopePeriodDates } from '@/app/lib/horoscope-date-period';
import { HoroscopeLanguageTabs } from '@/app/horoscope/components/HoroscopeLanguageTabs';
import { HoroscopePeriodDateField } from '@/app/horoscope/components/HoroscopePeriodDateField';
import { HoroscopeColorPicker } from '@/app/horoscope/components/HoroscopeColorPicker';
import { HoroscopeRatingsPanel } from '@/app/horoscope/components/HoroscopeRatingsPanel';
import { BsDateText } from '@/app/horoscope/components/BsDateText';

const ZODIAC_OPTIONS: ZodiacSignEnum[] = [
  'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
  'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

const TYPE_TABS: HoroscopeTypeEnum[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const PUBLISH_STATUSES: HoroscopePublishStatusEnum[] = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
];

const FIELD_LABELS: Partial<Record<HoroscopeTextField, string>> = {
  summary: 'Overview',
  love: 'Love & Relationships',
  career: 'Career & Business',
  money: 'Finance & Wealth',
  health: 'Health & Wellness',
  family: 'Family & Social Life',
  education: 'Education & Growth',
  travel: 'Travel & Relocation',
  advice: 'Guidance',
  mood: 'Mood',
};

const FORM_TEXT_FIELDS: HoroscopeTextField[] = [...HOROSCOPE_TEXT_FIELDS];

const RATING_FIELDS = [
  { key: 'loveRating' as const, label: 'Love Rating' },
  { key: 'careerRating' as const, label: 'Career Rating' },
  { key: 'moneyRating' as const, label: 'Finance Rating' },
  { key: 'healthRating' as const, label: 'Health Rating' },
  { key: 'familyRating' as const, label: 'Family Rating' },
  { key: 'educationRating' as const, label: 'Education Rating' },
  { key: 'travelRating' as const, label: 'Travel Rating' },
  { key: 'luckRating' as const, label: 'Luck Rating' },
];

const emptyForm = (type: HoroscopeTypeEnum = 'DAILY'): HoroscopeRequest => {
  const period = resolveHoroscopePeriodDates(type, formatIsoDate(new Date()));
  return {
    zodiacSign: 'ARIES',
    horoscopeType: type,
    startDate: period.startDate,
    endDate: period.endDate,
    publishStatus: 'DRAFT',
    locales: [],
  };
};

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
  const [languagesLoaded, setLanguagesLoaded] = useState(false);
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
        if (resolved.length) {
          setActiveLang(getBaseHoroscopeLanguage(resolved).uiCode);
        }
      })
      .catch(() => {
        /* Keep DEFAULT_HOROSCOPE_LANGUAGES boot state */
      })
      .finally(() => setLanguagesLoaded(true));
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
    setForm(emptyForm(activeType));
    setLocales(createEmptyLocalesMap(languages));
    setEditingId(null);
    if (languages.length) setActiveLang(getBaseHoroscopeLanguage(languages).uiCode);
  };

  useEffect(() => {
    setForm((prev) => {
      const period = resolveHoroscopePeriodDates(activeType, prev.startDate || formatIsoDate(new Date()));
      return {
        ...prev,
        horoscopeType: activeType,
        startDate: period.startDate,
        endDate: period.endDate,
      };
    });
  }, [activeType]);

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
    if (!languages.length) {
      await Swal.fire({ icon: 'error', text: 'No active languages configured. Enable languages in Master.' });
      return;
    }

    const body: HoroscopeRequest = {
      ...form,
      horoscopeType: activeType,
      locales: Object.values(locales).map(trimLocale).filter((row) =>
        HOROSCOPE_TEXT_FIELDS.some((f) => row[f]?.trim())
      ),
    };

    if (!body.startDate || !body.endDate) {
      await Swal.fire({ icon: 'error', text: 'Start and end dates are required.' });
      return;
    }
    if (activeType === 'DAILY' && body.startDate !== body.endDate) {
      await Swal.fire({ icon: 'error', text: 'Daily horoscope start and end dates must match.' });
      return;
    }
    if (body.endDate < body.startDate) {
      await Swal.fire({ icon: 'error', text: 'End date must not be before start date.' });
      return;
    }

    for (const r of RATING_FIELDS) {
      if (!isValidHoroscopeRating(body[r.key])) {
        await Swal.fire({ icon: 'error', text: `${r.label} must be 0.0–5.0 in steps of 0.5.` });
        return;
      }
    }

    body.overallRating = computeOverallRating(body);

    try {
      if (editingId) await horoscopeApi.update(editingId, body);
      else await horoscopeApi.create(body);
      await load();
      reset();
      await Swal.fire({ icon: 'success', text: editingId ? 'Horoscope updated.' : 'Horoscope created.' });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    }
  };

  const editRow = async (row: HoroscopeResponse) => {
    const detail = await horoscopeApi.getById(row.id);
    const d = detail.data as HoroscopeResponse | undefined;
    if (!d) return;
    setEditingId(d.id);
    setActiveType(d.horoscopeType);
    const period = resolveHoroscopePeriodDates(d.horoscopeType, d.startDate || formatIsoDate(new Date()));
    setForm({
      zodiacSign: d.zodiacSign,
      horoscopeType: d.horoscopeType,
      summary: d.summary,
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
      familyRating: d.familyRating,
      educationRating: d.educationRating,
      travelRating: d.travelRating,
      luckRating: d.luckRating,
      overallRating: d.overallRating,
      startDate: period.startDate,
      endDate: period.endDate,
      publishStatus: d.publishStatus ?? 'DRAFT',
      locales: d.locales,
    });
    setLocales(localesFromResponse(d, languages));
    setActiveLang(getBaseHoroscopeLanguage(languages).uiCode);
  };

  const removeRow = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete horoscope?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });
    if (!confirm.isConfirmed) return;
    await horoscopeApi.delete(id);
    await load();
  };

  const publishRow = async (id: string, status: HoroscopePublishStatusEnum) => {
    await horoscopeApi.changePublishStatus(id, status);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="horoscope-csv-page space-y-5 text-black dark:text-white">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Manage Horoscope' }]} />
        <PageHeaderWithInfo
          title="Horoscope Content Manager"
          infoText="Languages come from Master → Language (active list only). Ratings use 0.0–5.0 in 0.5 steps. Base language stores the main row; other active languages are translations."
        />

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-600">
          {TYPE_TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`horoscope-tab px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                activeType === t ? 'is-active' : 'border-transparent'
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

        {languagesLoaded && !languages.length ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            No active languages. Enable at least one language in Master before creating content.
          </p>
        ) : (
          <HoroscopeLanguageTabs languages={languages} activeUiCode={activeLang} onChange={setActiveLang} />
        )}

        <form
          onSubmit={submit}
          className="horoscope-panel rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold">
            {editingId ? 'Edit' : 'New'} · {activeLanguage?.label ?? '—'} · {activeType.toLowerCase()}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold">Zodiac Sign</span>
              <select
                className="form-input"
                value={form.zodiacSign}
                onChange={(e) => setForm((p) => ({ ...p, zodiacSign: e.target.value as ZodiacSignEnum }))}
              >
                {ZODIAC_OPTIONS.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </label>
            <HoroscopePeriodDateField
              horoscopeType={activeType}
              startDate={form.startDate}
              endDate={form.endDate}
              onChange={({ startDate, endDate }) => setForm((p) => ({ ...p, startDate, endDate }))}
            />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold">Status</span>
              <select
                className="form-input"
                value={form.publishStatus ?? 'DRAFT'}
                onChange={(e) => setForm((p) => ({ ...p, publishStatus: e.target.value as HoroscopePublishStatusEnum }))}
              >
                {PUBLISH_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          {activeLanguage?.isBase && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold">Lucky number</span>
                  <input className="form-input" placeholder="e.g. 7" value={form.luckyNumber ?? ''} onChange={(e) => setForm((p) => ({ ...p, luckyNumber: e.target.value }))} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold">Lucky time</span>
                  <input className="form-input" placeholder="e.g. Morning" value={form.luckyTime ?? ''} onChange={(e) => setForm((p) => ({ ...p, luckyTime: e.target.value }))} />
                </label>
              </div>
              <HoroscopeColorPicker
                value={form.luckyColor}
                onChange={(luckyColor) => setForm((p) => ({ ...p, luckyColor }))}
              />
              <div>
                <HoroscopeRatingsPanel
                  value={{
                    loveRating: form.loveRating,
                    careerRating: form.careerRating,
                    moneyRating: form.moneyRating,
                    healthRating: form.healthRating,
                    familyRating: form.familyRating,
                    educationRating: form.educationRating,
                    travelRating: form.travelRating,
                    luckRating: form.luckRating,
                    overallRating: form.overallRating,
                  }}
                  onChange={(ratings) => setForm((p) => ({ ...p, ...ratings }))}
                />
              </div>
            </>
          )}

          <div className="space-y-3">
            {FORM_TEXT_FIELDS.filter((f) => activeLanguage?.isBase || f !== 'mood').map((field) => (
              <div key={field}>
                <label className="text-xs font-semibold mb-1 block">{FIELD_LABELS[field]}</label>
                <textarea
                  className="form-input w-full"
                  rows={field === 'summary' ? 3 : 2}
                  placeholder={FIELD_LABELS[field]}
                  value={getDisplayValue(field)}
                  onChange={(e) => setDisplayValue(field, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-small" disabled={!languages.length}>
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn-secondary btn-small" onClick={reset}>Reset</button>
          </div>
        </form>

        <div className="horoscope-panel rounded-xl p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">
            {activeLanguage?.label ?? '—'} horoscopes ({activeType.toLowerCase()})
          </h3>
          {loading ? (
            <p className="horoscope-muted text-sm">Loading…</p>
          ) : tableRows.length === 0 ? (
            <p className="text-sm horoscope-muted">
              {activeLanguage?.isBase
                ? 'No horoscopes for this period.'
                : `No ${activeLanguage?.label ?? ''} translations yet.`}
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-600">
                  <th className="py-2 pr-3">Zodiac</th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Overview</th>
                  <th className="py-2 pr-3">Overall</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((x) => (
                  <tr key={x.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-2 pr-3 font-medium">{x.zodiacSign}</td>
                    <td className="py-2 pr-3 whitespace-nowrap horoscope-muted">
                      <BsDateText startDate={x.startDate} endDate={x.endDate} />
                    </td>
                    <td className="py-2 pr-3 max-w-[280px] truncate">
                      {getHoroscopeTextForLanguage(x, 'summary', activeLanguage) || '—'}
                    </td>
                    <td className="py-2 pr-3">{x.overallRating != null ? Number(x.overallRating).toFixed(1) : '—'}</td>
                    <td className="py-2 pr-3">{x.publishStatus ?? 'DRAFT'}</td>
                    <td className="py-2 space-x-1 whitespace-nowrap">
                      <button type="button" className="btn-secondary btn-small" onClick={() => editRow(x)}>Edit</button>
                      {x.publishStatus !== 'PUBLISHED' && (
                        <button type="button" className="btn-primary btn-small" onClick={() => publishRow(x.id, 'PUBLISHED')}>Publish</button>
                      )}
                      {x.publishStatus === 'PUBLISHED' && (
                        <button type="button" className="btn-secondary btn-small" onClick={() => publishRow(x.id, 'UNPUBLISHED')}>Unpublish</button>
                      )}
                      {x.publishStatus !== 'ARCHIVED' && (
                        <button type="button" className="btn-secondary btn-small" onClick={() => publishRow(x.id, 'ARCHIVED')}>Archive</button>
                      )}
                      <button type="button" className="btn-icon-delete" onClick={() => removeRow(x.id)}>Del</button>
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
