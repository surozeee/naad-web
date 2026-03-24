'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { horoscopeApi, horoscopePeriodApi } from '@/app/lib/crm.service';
import type {
  HoroscopeLocaleRequest,
  HoroscopePeriodResponse,
  HoroscopeRequest,
  HoroscopeResponse,
  LanguageEnumCode,
  ZodiacSignEnum,
} from '@/app/lib/crm.types';

const ZODIAC_OPTIONS: ZodiacSignEnum[] = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];
const LANG_OPTIONS: LanguageEnumCode[] = ['EN', 'NE'];

type LocaleRow = HoroscopeLocaleRequest & { key: string };

const emptyLocale = (): LocaleRow => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  language: 'EN',
  prediction: '',
  luckyNumber: '',
  color: '',
  education: '',
  expense: '',
});

const emptyForm = (): HoroscopeRequest => ({
  zodiacSign: 'ARIES',
  periodId: '',
  prediction: '',
  luckyNumber: '',
  color: '',
  education: '',
  expense: '',
  locales: [],
});

export default function HoroscopeManagePage() {
  const [items, setItems] = useState<HoroscopeResponse[]>([]);
  const [periods, setPeriods] = useState<HoroscopePeriodResponse[]>([]);
  const [form, setForm] = useState<HoroscopeRequest>(emptyForm());
  const [locales, setLocales] = useState<LocaleRow[]>([emptyLocale()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, p] = await Promise.all([
        horoscopeApi.list({ pageNo: 0, pageSize: 100, sortBy: 'createdAt', sortDirection: 'desc' }),
        horoscopePeriodApi.listActive(),
      ]);
      setItems((h.result ?? h.content ?? []) as HoroscopeResponse[]);
      setPeriods((p.data ?? []) as HoroscopePeriodResponse[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const periodLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    periods.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [periods]);

  const reset = () => {
    setForm(emptyForm());
    setLocales([emptyLocale()]);
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: HoroscopeRequest = {
      ...form,
      prediction: form.prediction.trim(),
      luckyNumber: form.luckyNumber.trim(),
      color: form.color.trim(),
      education: form.education.trim(),
      expense: form.expense.trim(),
      locales: locales
        .filter((x) => x.language && x.prediction.trim())
        .map(({ key, ...row }) => ({
          ...row,
          prediction: row.prediction.trim(),
          luckyNumber: row.luckyNumber.trim(),
          color: row.color.trim(),
          education: row.education.trim(),
          expense: row.expense.trim(),
        })),
    };

    if (!body.periodId) {
      await Swal.fire({ icon: 'error', text: 'Please select period.' });
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
    setForm({
      zodiacSign: d.zodiacSign,
      periodId: d.periodId,
      prediction: d.prediction,
      luckyNumber: d.luckyNumber,
      color: d.color,
      education: d.education,
      expense: d.expense,
      locales: d.locales ?? [],
    });
    setLocales((d.locales ?? []).map((x) => ({ key: `${x.language}-${Math.random()}`, ...x })) || [emptyLocale()]);
  };

  const removeRow = async (id: string) => {
    await horoscopeApi.delete(id);
    await load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Breadcrumb items={[{ label: 'Horoscope', href: '/horoscope' }, { label: 'Manage Horoscope' }]} />
        <PageHeaderWithInfo title="Horoscope CRUD" infoText="Single-controller powered horoscope CRUD with multilingual locale rows." />

        <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="form-input" value={form.zodiacSign} onChange={(e) => setForm((p) => ({ ...p, zodiacSign: e.target.value as ZodiacSignEnum }))}>
              {ZODIAC_OPTIONS.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
            <select className="form-input" value={form.periodId} onChange={(e) => setForm((p) => ({ ...p, periodId: e.target.value }))}>
              <option value="">Select Period</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="form-input" placeholder="Lucky Number" value={form.luckyNumber} onChange={(e) => setForm((p) => ({ ...p, luckyNumber: e.target.value }))} />
            <input className="form-input" placeholder="Color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
            <input className="form-input" placeholder="Education" value={form.education} onChange={(e) => setForm((p) => ({ ...p, education: e.target.value }))} />
            <input className="form-input" placeholder="Expense" value={form.expense} onChange={(e) => setForm((p) => ({ ...p, expense: e.target.value }))} />
            <textarea className="form-input md:col-span-3" rows={3} placeholder="Prediction" value={form.prediction} onChange={(e) => setForm((p) => ({ ...p, prediction: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <h3 className="font-semibold">Locales</h3>
              <button type="button" className="btn-secondary btn-small" onClick={() => setLocales((p) => [...p, { ...emptyLocale(), language: LANG_OPTIONS[0] }])}>Add Locale</button>
            </div>
            {locales.map((row) => (
              <div key={row.key} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <select className="form-input" value={row.language} onChange={(e) => setLocales((prev) => prev.map((x) => x.key === row.key ? { ...x, language: e.target.value as LanguageEnumCode } : x))}>
                  {LANG_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <input className="form-input" placeholder="Lucky number" value={row.luckyNumber} onChange={(e) => setLocales((prev) => prev.map((x) => x.key === row.key ? { ...x, luckyNumber: e.target.value } : x))} />
                <input className="form-input" placeholder="Color" value={row.color} onChange={(e) => setLocales((prev) => prev.map((x) => x.key === row.key ? { ...x, color: e.target.value } : x))} />
                <input className="form-input" placeholder="Education" value={row.education} onChange={(e) => setLocales((prev) => prev.map((x) => x.key === row.key ? { ...x, education: e.target.value } : x))} />
                <input className="form-input" placeholder="Expense" value={row.expense} onChange={(e) => setLocales((prev) => prev.map((x) => x.key === row.key ? { ...x, expense: e.target.value } : x))} />
                <button type="button" className="btn-icon-delete" onClick={() => setLocales((prev) => prev.filter((x) => x.key !== row.key))}>X</button>
                <textarea className="form-input md:col-span-6" rows={2} placeholder="Localized prediction" value={row.prediction} onChange={(e) => setLocales((prev) => prev.map((x) => x.key === row.key ? { ...x, prediction: e.target.value } : x))} />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-small">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" className="btn-secondary btn-small" onClick={reset}>Reset</button>
          </div>
        </form>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          {loading ? <p>Loading...</p> : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th>Zodiac</th><th>Period</th><th>Prediction</th><th>Locales</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id} className="border-b">
                    <td>{x.zodiacSign}</td>
                    <td>{x.periodName ?? periodLabelMap.get(x.periodId) ?? x.period}</td>
                    <td>{x.prediction?.slice(0, 80)}</td>
                    <td>{x.locales?.map((l) => l.language).join(', ') || '-'}</td>
                    <td className="space-x-2">
                      <button type="button" className="btn-icon-edit" onClick={() => editRow(x)}>E</button>
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
