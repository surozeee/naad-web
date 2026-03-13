'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LayoutGrid, List, MapPin, Plus, Save, Tag, X } from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { NepaliDatepicker, ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { eventApi, eventCategoryApi } from '@/app/lib/crm.service';
import type { EventRequest } from '@/app/lib/crm.types';

declare global {
  interface Window {
    ad2bs?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    bs2ad?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
  }
}

interface CategoryOption {
  id: string;
  name: string;
}

interface EventCalendarItem {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  address: string;
  categoryId: string;
  categoryName?: string;
  status: 'active' | 'inactive' | 'deleted';
}

interface EventCalendarForm {
  name: string;
  description: string;
  categoryId: string;
  address: string;
  startBsDate: string;
  endBsDate: string;
  startTime: string;
  endTime: string;
}

interface BsDateParts {
  year: number;
  month: number;
  day: number;
}

interface AdMonthParts {
  year: number;
  month: number;
}

interface CalendarCell {
  bsDate: string;
  bsDay: number;
  adDate: Date;
  adDay: number;
  inCurrentMonth: boolean;
  eventCount: number;
}

const WEEK_DAYS = [
  { np: 'आइतबार', en: 'Sunday' },
  { np: 'सोमबार', en: 'Monday' },
  { np: 'मङ्गलबार', en: 'Tuesday' },
  { np: 'बुधबार', en: 'Wednesday' },
  { np: 'बिहीबार', en: 'Thursday' },
  { np: 'शुक्रबार', en: 'Friday' },
  { np: 'शनिबार', en: 'Saturday' },
];

const BS_MONTH_NAMES_NP = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
const BS_MONTH_NAMES_EN = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
const AD_MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toAdYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toNepaliDigits(value: number | string): string {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(value).replace(/\d/g, (digit) => map[Number(digit)] ?? digit);
}

function adDateToBsParts(date: Date): BsDateParts {
  if (typeof window === 'undefined' || typeof window.ad2bs !== 'function') {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }
  try {
    const converted = window.ad2bs({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });

    if (
      converted &&
      typeof converted === 'object' &&
      typeof converted.year === 'number' &&
      typeof converted.month === 'number' &&
      typeof converted.day === 'number' &&
      !Number.isNaN(converted.year) &&
      !Number.isNaN(converted.month) &&
      !Number.isNaN(converted.day)
    ) {
      return converted;
    }
  } catch {}

  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

function formatBsDate(parts: BsDateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function parseBsDate(bsDate: string): BsDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bsDate || '');
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatBsMonthYearLabel(parts: BsDateParts | null): string {
  if (!parts || !BS_MONTH_NAMES_NP[parts.month - 1] || !BS_MONTH_NAMES_EN[parts.month - 1]) return 'लोड हुँदैछ...';
  return `${toNepaliDigits(parts.year)} ${BS_MONTH_NAMES_NP[parts.month - 1]} | ${BS_MONTH_NAMES_EN[parts.month - 1]}`;
}

function formatBsSelectedDateLabel(parts: BsDateParts | null): string {
  if (!parts || !BS_MONTH_NAMES_NP[parts.month - 1]) return 'Nepali date not selected';
  return `${toNepaliDigits(parts.year)} ${BS_MONTH_NAMES_NP[parts.month - 1]} ${toNepaliDigits(parts.day)}`;
}

function formatAdDateLabel(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return 'English date not available';
  return date.toLocaleDateString('en-US', { dateStyle: 'full' });
}

function formatAdMonthYearLabel(parts: AdMonthParts | null): string {
  if (!parts || !AD_MONTH_NAMES_EN[parts.month - 1]) return 'Loading...';
  return `${AD_MONTH_NAMES_EN[parts.month - 1]} ${parts.year}`;
}

function adDateToBsString(date: Date): string {
  return formatBsDate(adDateToBsParts(date));
}

function bsDateToAdDate(bsDate: string): Date | null {
  if (typeof window === 'undefined' || typeof window.bs2ad !== 'function' || !bsDate) return null;
  try {
    const converted = window.bs2ad(bsDate);
    if (
      !converted ||
      typeof converted !== 'object' ||
      typeof converted.year !== 'number' ||
      typeof converted.month !== 'number' ||
      typeof converted.day !== 'number'
    ) {
      return null;
    }

    const date = new Date(converted.year, converted.month - 1, converted.day);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function bsPartsToAdDate(parts: BsDateParts): Date | null {
  return bsDateToAdDate(formatBsDate(parts));
}

function bsDateTimeToIso(bsDate: string, time: string): string {
  const adDate = bsDateToAdDate(bsDate);
  if (!adDate || !time) return '';
  const [hours, minutes] = time.split(':').map((part) => Number(part || '0'));
  adDate.setHours(hours, minutes, 0, 0);
  return adDate.toISOString();
}

function formatDisplayDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function getNextBsMonth(month: BsDateParts): BsDateParts {
  return month.month === 12
    ? { year: month.year + 1, month: 1, day: 1 }
    : { year: month.year, month: month.month + 1, day: 1 };
}

function getPrevBsMonth(month: BsDateParts): BsDateParts {
  return month.month === 1
    ? { year: month.year - 1, month: 12, day: 1 }
    : { year: month.year, month: month.month - 1, day: 1 };
}

function getNextAdMonth(month: AdMonthParts): AdMonthParts {
  return month.month === 12
    ? { year: month.year + 1, month: 1 }
    : { year: month.year, month: month.month + 1 };
}

function getPrevAdMonth(month: AdMonthParts): AdMonthParts {
  return month.month === 1
    ? { year: month.year - 1, month: 12 }
    : { year: month.year, month: month.month - 1 };
}

function mapApiToItem(raw: Record<string, unknown>): EventCalendarItem {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  const category = raw.category as Record<string, unknown> | undefined;
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    address: String(raw.address ?? ''),
    categoryId: raw.categoryId ? String(raw.categoryId) : category?.id ? String(category.id) : '',
    categoryName: category?.name ? String(category.name) : undefined,
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
  };
}

function createInitialForm(selectedBsDate: string): EventCalendarForm {
  return {
    name: '',
    description: '',
    categoryId: '',
    address: '',
    startBsDate: selectedBsDate,
    endBsDate: selectedBsDate,
    startTime: '09:00',
    endTime: '10:00',
  };
}

export default function EventCalendarPage() {
  const [calendarReady, setCalendarReady] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'BS' | 'AD'>('BS');
  const [selectedBsDate, setSelectedBsDate] = useState('');
  const [currentBsMonth, setCurrentBsMonth] = useState<BsDateParts | null>(null);
  const [currentAdMonth, setCurrentAdMonth] = useState<AdMonthParts | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [events, setEvents] = useState<EventCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<EventCalendarForm>(createInitialForm(''));

  useEffect(() => {
    let cancelled = false;

    ensureOfficialLibrary()
      .then(() => {
        if (cancelled) return;
        const todayBs = adDateToBsParts(new Date());
        const todayBsString = formatBsDate(todayBs);
        setCalendarReady(true);
        setCurrentBsMonth((prev) => prev || { year: todayBs.year, month: todayBs.month, day: 1 });
        setCurrentAdMonth((prev) => prev || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
        setSelectedBsDate((prev) => prev || todayBsString);
      })
      .catch(() => {
        if (cancelled) return;
        const fallbackDate = new Date();
        const fallback = { year: fallbackDate.getFullYear(), month: fallbackDate.getMonth() + 1, day: fallbackDate.getDate() };
        setCalendarReady(true);
        setCurrentBsMonth((prev) => prev || { year: fallback.year, month: fallback.month, day: 1 });
        setCurrentAdMonth((prev) => prev || { year: fallback.year, month: fallback.month });
        setSelectedBsDate((prev) => prev || formatBsDate(fallback));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await eventCategoryApi.listActive();
      const list = (res.data ?? []) as Record<string, unknown>[];
      setCategories(list.map((row) => ({ id: String(row.id ?? ''), name: String(row.name ?? '') })));
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventApi.list({
        pageNo: 0,
        pageSize: 500,
        sortBy: 'startDate',
        sortDirection: 'asc',
      });
      const list = (res.result ?? res.content ?? []) as Record<string, unknown>[];
      setEvents(list.map(mapApiToItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, [fetchCategories, fetchEvents]);

  const eventCountByBsDate = useMemo(
    () =>
      events.reduce<Record<string, number>>((acc, event) => {
        const key = adDateToBsString(new Date(event.startDate));
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    [events]
  );

  const currentMonthMeta = useMemo(() => {
    if (!currentBsMonth) return null;
    const firstDayAd = bsPartsToAdDate({ year: currentBsMonth.year, month: currentBsMonth.month, day: 1 });
    const nextMonthAd = bsPartsToAdDate(getNextBsMonth(currentBsMonth));
    if (!firstDayAd || !nextMonthAd) return null;
    const firstWeekDay = firstDayAd.getDay();
    const daysInMonth = Math.round((nextMonthAd.getTime() - firstDayAd.getTime()) / (1000 * 60 * 60 * 24));
    return { firstWeekDay, daysInMonth };
  }, [currentBsMonth]);

  const calendarDays = useMemo(() => {
    const cells: CalendarCell[] = [];

    if (calendarMode === 'BS') {
      if (!currentBsMonth || !currentMonthMeta) return [] as CalendarCell[];
      const prevMonth = getPrevBsMonth(currentBsMonth);
      const nextMonth = getNextBsMonth(currentBsMonth);

      const prevFirstAd = bsPartsToAdDate(prevMonth);
      const currentFirstAd = bsPartsToAdDate({ year: currentBsMonth.year, month: currentBsMonth.month, day: 1 });
      const nextFirstAd = bsPartsToAdDate(nextMonth);
      if (!prevFirstAd || !currentFirstAd || !nextFirstAd) return [] as CalendarCell[];

      const prevDaysInMonth = Math.round((currentFirstAd.getTime() - prevFirstAd.getTime()) / (1000 * 60 * 60 * 24));

      for (let i = currentMonthMeta.firstWeekDay - 1; i >= 0; i -= 1) {
        const day = prevDaysInMonth - i;
        const bsDate = formatBsDate({ year: prevMonth.year, month: prevMonth.month, day });
        const adDate = bsDateToAdDate(bsDate);
        if (!adDate) continue;
        cells.push({
          bsDate,
          bsDay: day,
          adDate,
          adDay: adDate.getDate(),
          inCurrentMonth: false,
          eventCount: eventCountByBsDate[bsDate] ?? 0,
        });
      }

      for (let day = 1; day <= currentMonthMeta.daysInMonth; day += 1) {
        const bsDate = formatBsDate({ year: currentBsMonth.year, month: currentBsMonth.month, day });
        const adDate = bsDateToAdDate(bsDate);
        if (!adDate) continue;
        cells.push({
          bsDate,
          bsDay: day,
          adDate,
          adDay: adDate.getDate(),
          inCurrentMonth: true,
          eventCount: eventCountByBsDate[bsDate] ?? 0,
        });
      }

      let nextDay = 1;
      while (cells.length < 42) {
        const bsDate = formatBsDate({ year: nextMonth.year, month: nextMonth.month, day: nextDay });
        const adDate = bsDateToAdDate(bsDate);
        if (!adDate) break;
        cells.push({
          bsDate,
          bsDay: nextDay,
          adDate,
          adDay: adDate.getDate(),
          inCurrentMonth: false,
          eventCount: eventCountByBsDate[bsDate] ?? 0,
        });
        nextDay += 1;
      }

      return cells;
    }

    if (!currentAdMonth) return [] as CalendarCell[];

    const firstDayAd = new Date(currentAdMonth.year, currentAdMonth.month - 1, 1);
    const firstWeekDay = firstDayAd.getDay();
    const daysInMonth = new Date(currentAdMonth.year, currentAdMonth.month, 0).getDate();
    const prevMonth = getPrevAdMonth(currentAdMonth);
    const nextMonth = getNextAdMonth(currentAdMonth);
    const prevDaysInMonth = new Date(prevMonth.year, prevMonth.month, 0).getDate();

    for (let i = firstWeekDay - 1; i >= 0; i -= 1) {
      const day = prevDaysInMonth - i;
      const adDate = new Date(prevMonth.year, prevMonth.month - 1, day);
      const bsDate = adDateToBsString(adDate);
      const bsParts = parseBsDate(bsDate);
      if (!bsParts) continue;
      cells.push({
        bsDate,
        bsDay: bsParts.day,
        adDate,
        adDay: day,
        inCurrentMonth: false,
        eventCount: eventCountByBsDate[bsDate] ?? 0,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const adDate = new Date(currentAdMonth.year, currentAdMonth.month - 1, day);
      const bsDate = adDateToBsString(adDate);
      const bsParts = parseBsDate(bsDate);
      if (!bsParts) continue;
      cells.push({
        bsDate,
        bsDay: bsParts.day,
        adDate,
        adDay: day,
        inCurrentMonth: true,
        eventCount: eventCountByBsDate[bsDate] ?? 0,
      });
    }

    let nextDay = 1;
    while (cells.length < 42) {
      const adDate = new Date(nextMonth.year, nextMonth.month - 1, nextDay);
      const bsDate = adDateToBsString(adDate);
      const bsParts = parseBsDate(bsDate);
      if (!bsParts) break;
      cells.push({
        bsDate,
        bsDay: bsParts.day,
        adDate,
        adDay: nextDay,
        inCurrentMonth: false,
        eventCount: eventCountByBsDate[bsDate] ?? 0,
      });
      nextDay += 1;
    }

    return cells;
  }, [calendarMode, currentBsMonth, currentMonthMeta, currentAdMonth, eventCountByBsDate]);

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((event) => adDateToBsString(new Date(event.startDate)) === selectedBsDate)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [events, selectedBsDate]
  );

  useEffect(() => {
    if (calendarMode !== 'AD') return;
    const adDate = selectedBsDate ? bsDateToAdDate(selectedBsDate) : null;
    if (!adDate) return;

    setCurrentAdMonth((prev) => {
      const next = { year: adDate.getFullYear(), month: adDate.getMonth() + 1 };
      if (prev && prev.year === next.year && prev.month === next.month) return prev;
      return next;
    });
  }, [calendarMode, selectedBsDate]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const resetForm = useCallback(() => {
    setFormData(createInitialForm(selectedBsDate));
    setErrors({});
  }, [selectedBsDate]);

  const openAddModal = useCallback(
    (bsDate?: string) => {
      const nextDate = bsDate || selectedBsDate || (currentBsMonth ? formatBsDate({ ...currentBsMonth, day: 1 }) : '');
      setSelectedBsDate(nextDate);
      setFormData(createInitialForm(nextDate));
      setErrors({});
      setShowAddModal(true);
    },
    [currentBsMonth, selectedBsDate]
  );

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Event name is required';
    if (!formData.startBsDate) nextErrors.startBsDate = 'Start date is required';
    if (!formData.endBsDate) nextErrors.endBsDate = 'End date is required';
    if (!formData.startTime) nextErrors.startTime = 'Start time is required';
    if (!formData.endTime) nextErrors.endTime = 'End time is required';

    const startDateIso = bsDateTimeToIso(formData.startBsDate, formData.startTime);
    const endDateIso = bsDateTimeToIso(formData.endBsDate, formData.endTime);
    if (!startDateIso) nextErrors.startBsDate = 'Could not convert Nepali start date';
    if (!endDateIso) nextErrors.endBsDate = 'Could not convert Nepali end date';
    if (startDateIso && endDateIso && new Date(startDateIso) > new Date(endDateIso)) {
      nextErrors.endBsDate = 'End date/time must be after start date/time';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const body: EventRequest = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      categoryId: formData.categoryId || undefined,
      address: formData.address.trim() || undefined,
      startDate: bsDateTimeToIso(formData.startBsDate, formData.startTime),
      endDate: bsDateTimeToIso(formData.endBsDate, formData.endTime),
    };

    setSubmitting(true);
    try {
      await eventApi.create(body);
      await Swal.fire({
        title: 'Created',
        text: 'Event added to calendar.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      setSelectedBsDate(formData.startBsDate);
      const adDate = bsDateToAdDate(formData.startBsDate);
      if (adDate) {
        const bs = adDateToBsParts(adDate);
        setCurrentBsMonth({ year: bs.year, month: bs.month, day: 1 });
        setCurrentAdMonth({ year: adDate.getFullYear(), month: adDate.getMonth() + 1 });
      }
      setShowAddModal(false);
      resetForm();
      await fetchEvents();
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Failed to create event' }));
    } finally {
      setSubmitting(false);
    }
  };

  const todayBs = calendarReady ? adDateToBsString(new Date()) : '';
  const selectedBsParts = parseBsDate(selectedBsDate);
  const selectedAdDate = selectedBsDate ? bsDateToAdDate(selectedBsDate) : null;
  const monthTitle = calendarMode === 'BS'
    ? formatBsMonthYearLabel(currentBsMonth ?? selectedBsParts)
    : formatAdMonthYearLabel(currentAdMonth);
  const selectedMonthLabel = calendarMode === 'BS'
    ? currentBsMonth ? `${toNepaliDigits(currentBsMonth.year)} ${BS_MONTH_NAMES_NP[currentBsMonth.month - 1]}` : ''
    : formatAdMonthYearLabel(currentAdMonth);
  const selectedDateTitle = calendarMode === 'BS'
    ? formatBsSelectedDateLabel(selectedBsParts)
    : formatAdDateLabel(selectedAdDate);
  const secondarySelectedDateTitle = calendarMode === 'BS'
    ? formatAdDateLabel(selectedAdDate)
    : formatBsSelectedDateLabel(selectedBsParts);
  const weekdayLabels = calendarMode === 'BS'
    ? WEEK_DAYS.map((day) => ({ primary: day.np, secondary: day.en }))
    : WEEK_DAYS.map((day) => ({ primary: day.en, secondary: day.np }));
  const monthOptions = calendarMode === 'BS'
    ? BS_MONTH_NAMES_NP.map((label, index) => ({ value: index + 1, label: `${label} | ${BS_MONTH_NAMES_EN[index]}` }))
    : AD_MONTH_NAMES_EN.map((label, index) => ({ value: index + 1, label }));
  const yearOptions = calendarMode === 'BS'
    ? Array.from({ length: 131 }, (_, index) => 1970 + index)
    : Array.from({ length: 101 }, (_, index) => 1950 + index);
  const selectedMonthValue = calendarMode === 'BS' ? currentBsMonth?.month ?? '' : currentAdMonth?.month ?? '';
  const selectedYearValue = calendarMode === 'BS' ? currentBsMonth?.year ?? '' : currentAdMonth?.year ?? '';

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Event Management', href: '/event-management' }, { label: 'Calendar' }]} />
        <PageHeaderWithInfo
          title="Event Calendar"
          infoText="Tendernotice-style Nepali monthly calendar with event creation directly on the selected date."
        >
          <button type="button" className="btn-primary btn-small" onClick={() => openAddModal()}>
            <Plus size={16} />
            <span>Add Event</span>
          </button>
        </PageHeaderWithInfo>

        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.1fr) minmax(320px, 1fr)', gap: 20 }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700" style={{ overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CalendarDays size={20} color="#2563eb" />
                <div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{monthTitle}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400" style={{ marginTop: 4 }}>
                    Selected: {selectedDateTitle}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400" style={{ marginTop: 2 }}>
                    {calendarMode === 'BS' ? 'English' : 'Nepali'}: {secondarySelectedDateTitle}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <select
                  value={calendarMode}
                  onChange={(e) => {
                    const nextMode = e.target.value as 'BS' | 'AD';
                    setCalendarMode(nextMode);
                    if (nextMode === 'AD') {
                      const adSource =
                        selectedAdDate ??
                        (currentBsMonth ? bsPartsToAdDate({ year: currentBsMonth.year, month: currentBsMonth.month, day: 1 }) : null);
                      if (adSource) setCurrentAdMonth({ year: adSource.getFullYear(), month: adSource.getMonth() + 1 });
                    } else {
                      const today = new Date();
                      const bsToday = adDateToBsParts(today);
                      setCurrentBsMonth({ year: bsToday.year, month: bsToday.month, day: 1 });
                      setSelectedBsDate(formatBsDate(bsToday));
                    }
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="BS">BS</option>
                  <option value="AD">AD</option>
                </select>
                <select
                  value={selectedMonthValue}
                  onChange={(e) => {
                    const month = Number(e.target.value);
                    if (!month) return;
                    if (calendarMode === 'BS') {
                      setCurrentBsMonth((prev) => (prev ? { ...prev, month, day: 1 } : prev));
                    } else {
                      setCurrentAdMonth((prev) => (prev ? { ...prev, month } : prev));
                    }
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYearValue}
                  onChange={(e) => {
                    const year = Number(e.target.value);
                    if (!year) return;
                    if (calendarMode === 'BS') {
                      setCurrentBsMonth((prev) => (prev ? { ...prev, year, day: 1 } : prev));
                    } else {
                      setCurrentAdMonth((prev) => (prev ? { ...prev, year } : prev));
                    }
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {calendarMode === 'BS' ? toNepaliDigits(year) : year}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`btn-secondary btn-small ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  className={`btn-secondary btn-small ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => {
                    if (calendarMode === 'BS' && currentBsMonth) setCurrentBsMonth(getPrevBsMonth(currentBsMonth));
                    if (calendarMode === 'AD' && currentAdMonth) setCurrentAdMonth(getPrevAdMonth(currentAdMonth));
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  onClick={() => {
                    if (calendarMode === 'BS' && currentBsMonth) setCurrentBsMonth(getNextBsMonth(currentBsMonth));
                    if (calendarMode === 'AD' && currentAdMonth) setCurrentAdMonth(getNextAdMonth(currentAdMonth));
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid #e2e8f0' }}>
                  {weekdayLabels.map((day, idx) => {
                    const isSaturdayColumn = idx === 6;
                    return (
                    <div
                      key={`${day.primary}-${idx}`}
                      style={{
                        padding: '12px 10px',
                        borderRight: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        className="text-xs font-semibold"
                        style={{ color: isSaturdayColumn ? '#dc2626' : '#334155' }}
                      >
                        {day.primary}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: isSaturdayColumn ? '#f87171' : '#94a3b8' }}
                      >
                        {day.secondary}
                      </div>
                    </div>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                  {calendarDays.map((day, index) => {
                    const isSelected = day.bsDate === selectedBsDate;
                    const isToday = day.bsDate === todayBs;
                    const isOutsideMonth = !day.inCurrentMonth;
                    const isSaturdayColumn = index % 7 === 6;
                    const dayEvents = events.filter((event) => adDateToBsString(new Date(event.startDate)) === day.bsDate).slice(0, 2);
                    const primaryDateColor = isSelected
                      ? '#ffffff'
                      : isSaturdayColumn
                        ? isOutsideMonth
                          ? '#fca5a5'
                          : '#dc2626'
                        : isOutsideMonth
                          ? '#94a3b8'
                          : '#475569';
                    const secondaryDateColor = isSelected ? 'rgba(255,255,255,0.82)' : isOutsideMonth ? '#cbd5e1' : '#94a3b8';
                    const eventTextColor = isSelected
                      ? '#ffffff'
                      : isOutsideMonth
                        ? '#cbd5e1'
                        : isSaturdayColumn
                          ? '#dc2626'
                          : '#dc2626';
                    return (
                      <button
                        key={`${day.bsDate}-${index}`}
                        type="button"
                        onClick={() => {
                          setSelectedBsDate(day.bsDate);
                          setCurrentBsMonth((prev) => (prev && calendarMode === 'BS' ? { ...prev, year: parseBsDate(day.bsDate)?.year ?? prev.year, month: parseBsDate(day.bsDate)?.month ?? prev.month, day: 1 } : prev));
                          setCurrentAdMonth((prev) => (calendarMode === 'AD' ? { year: day.adDate.getFullYear(), month: day.adDate.getMonth() + 1 } : prev));
                        }}
                        style={{
                          minHeight: 126,
                          padding: 10,
                          borderRight: index % 7 !== 6 ? '1px solid #e2e8f0' : 'none',
                          borderBottom: '1px solid #e2e8f0',
                          background: isSelected ? '#0f5fae' : day.inCurrentMonth ? '#ffffff' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          textAlign: 'left',
                          position: 'relative',
                        }}
                      >
                        {isToday && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              fontSize: 10,
                              fontWeight: 700,
                              color: isSelected ? '#fff' : '#dc2626',
                            }}
                          >
                            आज
                          </span>
                        )}

                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              lineHeight: 1,
                              color: primaryDateColor,
                              textAlign: 'center',
                            }}
                          >
                            {calendarMode === 'BS' ? toNepaliDigits(day.bsDay) : day.adDay}
                          </div>
                        </div>

                        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 24 }}>
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              style={{
                                fontSize: 11,
                                lineHeight: 1.2,
                                color: eventTextColor,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {event.name}
                            </div>
                          ))}
                          {day.eventCount > 2 && (
                            <span style={{ fontSize: 11, color: isSelected ? '#ffffff' : isOutsideMonth ? '#94a3b8' : '#2563eb', fontWeight: 600 }}>
                              +{day.eventCount - 2} more
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            position: 'absolute',
                            right: 8,
                            bottom: 8,
                            fontSize: 11,
                            lineHeight: 1,
                            color: secondaryDateColor,
                            textAlign: 'right',
                          }}
                        >
                          {calendarMode === 'BS' ? day.adDay : toNepaliDigits(day.bsDay)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                {calendarDays
                  .filter((day) => day.eventCount > 0)
                  .map((day) => (
                    <button
                      key={day.bsDate}
                      type="button"
                      onClick={() => setSelectedBsDate(day.bsDate)}
                      style={{
                        border: day.bsDate === selectedBsDate ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 14,
                        textAlign: 'left',
                        background: '#fff',
                      }}
                    >
                      <div className="text-sm font-semibold text-slate-800">
                        {calendarMode === 'BS' ? day.bsDate : day.adDate.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </div>
                      <div className="text-xs text-slate-500" style={{ marginTop: 4 }}>
                        {calendarMode === 'BS'
                          ? day.adDate.toLocaleDateString('en-US', { dateStyle: 'medium' })
                          : day.bsDate}
                      </div>
                      <div className="text-sm text-blue-600" style={{ marginTop: 8 }}>
                        {day.eventCount} event{day.eventCount > 1 ? 's' : ''}
                      </div>
                    </button>
                  ))}
                {calendarDays.every((day) => day.eventCount === 0) && <div className="text-sm text-slate-500">No event dates in this month.</div>}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-lg border border-slate-200 dark:border-slate-700">
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Selected Date</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pick a Nepali date, review events, and add one directly on that day.</p>
              </div>
              <button type="button" className="btn-primary btn-small" onClick={() => openAddModal(selectedBsDate)}>
                <Plus size={16} />
                <span>Add on date</span>
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Nepali Datepicker</label>
              <div
                style={{
                  minHeight: 420,
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                  padding: 8,
                }}
              >
                <NepaliDatepicker
                  value={selectedBsDate}
                  onChange={(nextValue) => {
                    setSelectedBsDate(nextValue);
                    const parts = parseBsDate(nextValue);
                    if (parts) setCurrentBsMonth({ year: parts.year, month: parts.month, day: 1 });
                  }}
                  options={{
                    inline: true,
                    language: 'nepali',
                    dateFormat: 'YYYY-MM-DD',
                    useEnglishNumbers: true,
                    showEnglishDateSubscript: true,
                    theme: 'light',
                  }}
                  className="w-full"
                />
              </div>
            </div>

            <div style={{ borderRadius: 12, background: '#f8fafc', padding: 14, marginBottom: 16 }}>
              <div className="text-sm text-slate-500">{calendarMode === 'BS' ? 'Current BS Month' : 'Current AD Month'}</div>
              <div className="text-lg font-bold text-slate-800">{selectedMonthLabel || 'Loading...'}</div>
              <div className="text-sm text-slate-500" style={{ marginTop: 8 }}>Selected date: {selectedDateTitle}</div>
              <div className="text-sm text-slate-500" style={{ marginTop: 6 }}>
                {calendarMode === 'BS' ? 'English date' : 'Nepali date'}: {secondarySelectedDateTitle}
              </div>
              <div className="text-sm text-slate-500" style={{ marginTop: 6 }}>
                {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'} scheduled
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">Loading events...</div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-sm text-slate-500">No events found for this date.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedDayEvents.map((event) => (
                  <div key={event.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div className="text-base font-semibold text-slate-800">{event.name}</div>
                        <div className="text-xs text-slate-500" style={{ marginTop: 4 }}>
                          {formatDisplayDateTime(event.startDate)} to {formatDisplayDateTime(event.endDate)}
                        </div>
                      </div>
                      <span className={`status-badge ${event.status}`}>{event.status === 'active' ? 'Active' : event.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                      <div className="text-sm text-slate-600" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock3 size={14} />
                        <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                      </div>
                      {event.categoryName && (
                        <div className="text-sm text-slate-600" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag size={14} />
                          <span>{event.categoryName}</span>
                        </div>
                      )}
                      {event.address && (
                        <div className="text-sm text-slate-600" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={14} />
                          <span>{event.address}</span>
                        </div>
                      )}
                      {event.description && <p className="text-sm text-slate-600" style={{ marginTop: 4 }}>{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h2>Add Event</h2>
                <button type="button" className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="organization-form">
                {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}

                <div className="form-group">
                  <label htmlFor="name" className="form-label">Event Name <span className="required">*</span></label>
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleFormChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Event name" />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Start Nepali Date <span className="required">*</span></label>
                    <NepaliDatepicker
                      value={formData.startBsDate}
                      onChange={(value) => setFormData((prev) => ({ ...prev, startBsDate: value }))}
                      options={{ dateFormat: 'YYYY-MM-DD', dateType: 'BS', useEnglishNumbers: true, modal: true }}
                      className={`form-input ${errors.startBsDate ? 'error' : ''}`}
                      placeholder="Start date"
                    />
                    {errors.startBsDate && <span className="form-error">{errors.startBsDate}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="startTime" className="form-label">Start Time <span className="required">*</span></label>
                    <input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleFormChange} className={`form-input ${errors.startTime ? 'error' : ''}`} />
                    {errors.startTime && <span className="form-error">{errors.startTime}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">End Nepali Date <span className="required">*</span></label>
                    <NepaliDatepicker
                      value={formData.endBsDate}
                      onChange={(value) => setFormData((prev) => ({ ...prev, endBsDate: value }))}
                      options={{ dateFormat: 'YYYY-MM-DD', dateType: 'BS', useEnglishNumbers: true, modal: true }}
                      className={`form-input ${errors.endBsDate ? 'error' : ''}`}
                      placeholder="End date"
                    />
                    {errors.endBsDate && <span className="form-error">{errors.endBsDate}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="endTime" className="form-label">End Time <span className="required">*</span></label>
                    <input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleFormChange} className={`form-input ${errors.endTime ? 'error' : ''}`} />
                    {errors.endTime && <span className="form-error">{errors.endTime}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="categoryId" className="form-label">Category</label>
                  <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleFormChange} className="form-input">
                    <option value="">— Select category —</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">Address</label>
                  <input id="address" name="address" type="text" value={formData.address} onChange={handleFormChange} className="form-input" placeholder="Optional address" />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} className="form-input" rows={3} placeholder="Optional description" />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                    {submitting ? (
                      <span>Creating...</span>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Create Event</span>
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
