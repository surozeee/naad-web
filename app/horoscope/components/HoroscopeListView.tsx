'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  GraduationCap,
  Heart,
  Lightbulb,
  Loader2,
  Plane,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { HoroscopePeriodDateField } from '@/app/horoscope/components/HoroscopePeriodDateField';
import { BsDateText } from '@/app/horoscope/components/BsDateText';
import { horoscopeApi, zodiacSignApi } from '@/app/lib/crm.service';
import type {
  HoroscopeResponse,
  HoroscopeTypeEnum,
  LanguageEnumCode,
  ZodiacSignEnum,
  ZodiacSignResponse,
} from '@/app/lib/crm.types';
import { formatIsoDate, resolveHoroscopePeriodDates } from '@/app/lib/horoscope-date-period';
import { HOROSCOPE_LUCKY_COLORS, parseLuckyColors } from '@/app/horoscope/components/HoroscopeColorPicker';
import { useLocale } from '@/app/components/LocaleProvider';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';
import { translateHoroscope, useHoroscopeI18n } from '@/app/lib/horoscope-i18n';
import { localizeDigits } from '@/app/lib/nepali-digits';
import { resolveColorDisplayName } from '@/app/lib/color-i18n';
import { colorApi } from '@/app/lib/master.service';
import type { ColorResponse } from '@/app/lib/master.types';

export type HoroscopeListViewProps = {
  /** Public page: skip logout-on-401 so guests can browse published readings. */
  publicMode?: boolean;
};

type ElementTone = 'fire' | 'earth' | 'air' | 'water';

const ZODIAC_ORDER: ZodiacSignEnum[] = [
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

const ZODIAC_META: Record<
  ZodiacSignEnum,
  { symbol: string; tone: ElementTone }
> = {
  ARIES: { symbol: '♈', tone: 'fire' },
  TAURUS: { symbol: '♉', tone: 'earth' },
  GEMINI: { symbol: '♊', tone: 'air' },
  CANCER: { symbol: '♋', tone: 'water' },
  LEO: { symbol: '♌', tone: 'fire' },
  VIRGO: { symbol: '♍', tone: 'earth' },
  LIBRA: { symbol: '♎', tone: 'air' },
  SCORPIO: { symbol: '♏', tone: 'water' },
  SAGITTARIUS: { symbol: '♐', tone: 'fire' },
  CAPRICORN: { symbol: '♑', tone: 'earth' },
  AQUARIUS: { symbol: '♒', tone: 'air' },
  PISCES: { symbol: '♓', tone: 'water' },
};

const SECTION_FIELDS: Array<{
  key: keyof HoroscopeResponse;
  labelKey: string;
  icon: typeof Heart;
}> = [
  { key: 'love', labelKey: 'sections.love', icon: Heart },
  { key: 'career', labelKey: 'sections.career', icon: Briefcase },
  { key: 'health', labelKey: 'sections.health', icon: Sparkles },
  { key: 'money', labelKey: 'sections.money', icon: Wallet },
  { key: 'family', labelKey: 'sections.family', icon: Users },
  { key: 'education', labelKey: 'sections.education', icon: GraduationCap },
  { key: 'travel', labelKey: 'sections.travel', icon: Plane },
  { key: 'advice', labelKey: 'sections.advice', icon: Lightbulb },
];

const RATING_FIELDS: Array<{
  key: keyof HoroscopeResponse;
  labelKey: string;
}> = [
  { key: 'loveRating', labelKey: 'ratings.love' },
  { key: 'careerRating', labelKey: 'ratings.career' },
  { key: 'moneyRating', labelKey: 'ratings.money' },
  { key: 'healthRating', labelKey: 'ratings.health' },
  { key: 'familyRating', labelKey: 'ratings.family' },
  { key: 'educationRating', labelKey: 'ratings.education' },
  { key: 'travelRating', labelKey: 'ratings.travel' },
  { key: 'luckRating', labelKey: 'ratings.luck' },
];

const TYPE_TABS: Array<{
  type: HoroscopeTypeEnum;
  icon: typeof Calendar;
}> = [
  { type: 'DAILY', icon: Calendar },
  { type: 'WEEKLY', icon: CalendarDays },
  { type: 'MONTHLY', icon: CalendarRange },
  { type: 'YEARLY', icon: Sparkles },
];

function shortText(value?: string | null, max = 72): string {
  const text = (value || '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function formatRating(value?: number | null, uiCode?: string): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return localizeDigits(Number(value).toFixed(1), uiCode);
}

function luckyColorHex(name: string): string | null {
  const match = HOROSCOPE_LUCKY_COLORS.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  return match?.hex ?? null;
}

function LuckyColorDisplay({
  value,
  uiCode,
  colorRows,
}: {
  value?: string | null;
  uiCode?: string;
  colorRows?: ColorResponse[];
}) {
  const colors = parseLuckyColors(value);
  if (!colors.length) return <span>—</span>;
  return (
    <span className="hl-lucky-colors">
      {colors.map((name) => {
        const hex = luckyColorHex(name);
        const label = resolveColorDisplayName(name, uiCode, colorRows);
        return (
          <span key={name} className="hl-lucky-color-chip" title={label}>
            <span
              className="hl-lucky-color-swatch"
              style={{ backgroundColor: hex || '#94a3b8' }}
              aria-hidden
            />
            <span>{label}</span>
          </span>
        );
      })}
    </span>
  );
}

function RatingStars({ value, uiCode }: { value?: number | null; uiCode?: string }) {
  const n = value == null || Number.isNaN(Number(value)) ? 0 : Number(value);
  const full = Math.floor(n);
  const half = n - full >= 0.5;
  return (
    <span className="hl-stars" aria-label={`${formatRating(value, uiCode)} of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const on = i < full || (i === full && half);
        return <Star key={i} size={12} className={on ? 'is-on' : ''} fill={on ? 'currentColor' : 'none'} />;
      })}
    </span>
  );
}

function uiCodeToBackendLanguage(uiCode: string): LanguageEnumCode {
  return normalizeUiLanguageCode(uiCode).toUpperCase() as LanguageEnumCode;
}

function localeLanguageCode(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim().toUpperCase();
  if (typeof raw === 'object' && 'name' in (raw as object)) {
    return String((raw as { name?: string }).name ?? '').trim().toUpperCase();
  }
  return String(raw).trim().toUpperCase();
}

function findLocaleName(
  locales: ZodiacSignResponse['locales'] | undefined,
  language: LanguageEnumCode
): string | null {
  if (!locales?.length) return null;
  const want = String(language).toUpperCase();
  const match = locales.find((l) => localeLanguageCode(l.language) === want);
  const name = match?.name?.trim();
  return name || null;
}

function resolveZodiacDisplayName(
  sign: ZodiacSignEnum,
  zodiacRows: ZodiacSignResponse[],
  backendLanguage: LanguageEnumCode,
  uiCode: string
): string {
  const row = zodiacRows.find((z) => String(z.zodiacSign).toUpperCase() === sign);

  // 1) API locale for selected language
  const localized = findLocaleName(row?.locales, backendLanguage);
  if (localized) return localized;

  // 2) JSON file name for UI language
  const fromJson = translateHoroscope(uiCode, `zodiac.${sign}`).trim();
  if (fromJson && fromJson !== `zodiac.${sign}`) return fromJson;

  // 3) Default: EN locale → entity name → English JSON
  const enName = findLocaleName(row?.locales, 'EN');
  if (enName) return enName;
  if (row?.name?.trim()) return row.name.trim();
  return translateHoroscope('en', `zodiac.${sign}`);
}

export function HoroscopeListView({ publicMode = false }: HoroscopeListViewProps) {
  const { language } = useLocale();
  const { t, typeLabel, elementLabel, uiCode } = useHoroscopeI18n();
  const backendLanguage = useMemo(() => uiCodeToBackendLanguage(language), [language]);
  const ignoreAuthFailure = publicMode;

  const [horoscopeType, setHoroscopeType] = useState<HoroscopeTypeEnum>('DAILY');
  const [period, setPeriod] = useState(() => resolveHoroscopePeriodDates('DAILY', formatIsoDate(new Date())));
  const [items, setItems] = useState<HoroscopeResponse[]>([]);
  const [zodiacRows, setZodiacRows] = useState<ZodiacSignResponse[]>([]);
  const [colorRows, setColorRows] = useState<ColorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSign, setSelectedSign] = useState<ZodiacSignEnum | null>(null);
  const initialLoadDone = useRef(false);

  const byZodiac = useMemo(() => {
    const map = new Map<ZodiacSignEnum, HoroscopeResponse>();
    for (const row of items) {
      if (row.zodiacSign) map.set(row.zodiacSign, row);
    }
    return map;
  }, [items]);

  const zodiacLabel = useCallback(
    (sign: ZodiacSignEnum) => resolveZodiacDisplayName(sign, zodiacRows, backendLanguage, uiCode),
    [zodiacRows, backendLanguage, uiCode]
  );

  const loadZodiacNames = useCallback(async () => {
    try {
      const res = await zodiacSignApi.listActive(
        ignoreAuthFailure ? { ignoreAuthFailure: true } : undefined
      );
      setZodiacRows(Array.isArray(res?.data) ? (res.data as ZodiacSignResponse[]) : []);
    } catch {
      setZodiacRows([]);
    }
  }, [ignoreAuthFailure]);

  const loadColorNames = useCallback(async () => {
    try {
      const res = await colorApi.listActive(
        ignoreAuthFailure ? { ignoreAuthFailure: true } : undefined
      );
      setColorRows(Array.isArray(res?.data) ? (res.data as ColorResponse[]) : []);
    } catch {
      setColorRows([]);
    }
  }, [ignoreAuthFailure]);

  const loadList = useCallback(async () => {
    const isInitial = !initialLoadDone.current;
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await horoscopeApi.list(
        {
          pageNo: 0,
          pageSize: 50,
          sortBy: 'zodiacSign',
          sortDirection: 'asc',
          horoscopeType,
          language: backendLanguage,
          referenceDate: period.startDate,
          publishStatus: 'PUBLISHED',
          status: 'ACTIVE',
        },
        ignoreAuthFailure ? { ignoreAuthFailure: true } : undefined
      );
      setItems((res.result ?? res.content ?? []) as HoroscopeResponse[]);
      initialLoadDone.current = true;
    } catch (e: unknown) {
      if (isInitial) {
        await Swal.fire({
          icon: 'error',
          text: e instanceof Error ? e.message : translateHoroscope(uiCode, 'list.loadError'),
        });
        setItems([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [horoscopeType, backendLanguage, period.startDate, uiCode, ignoreAuthFailure]);

  useEffect(() => {
    void loadZodiacNames();
  }, [loadZodiacNames]);

  useEffect(() => {
    void loadColorNames();
  }, [loadColorNames]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const onTypeChange = (next: HoroscopeTypeEnum) => {
    setHoroscopeType(next);
    setPeriod(resolveHoroscopePeriodDates(next, formatIsoDate(new Date())));
  };

  const selected = selectedSign ? byZodiac.get(selectedSign) : undefined;
  const selectedMeta = selectedSign ? ZODIAC_META[selectedSign] : null;
  const typeName = typeLabel(horoscopeType);
  const typeNameLower = typeName.toLowerCase();

  return (
      <div className="horoscope-list-page hl-page space-y-5">
        <header className="hl-page-header">
          <div className="hl-page-header-main">
            <h1 className="hl-page-title">{t('pageTitle')}</h1>
            <p className="hl-page-desc">
              {t('pageDesc', { type: typeNameLower })}{' '}
              <BsDateText startDate={period.startDate} endDate={period.endDate} />
            </p>
          </div>
        </header>

        <section className={`hl-toolbar${refreshing ? ' is-refreshing' : ''}`}>
          <div className="hl-type-tabs" role="tablist" aria-label={t('periodTabsAria')}>
            {TYPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = horoscopeType === tab.type;
              return (
                <button
                  key={tab.type}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`hl-type-tab ${active ? 'is-active' : ''}`}
                  onClick={() => onTypeChange(tab.type)}
                >
                  <Icon size={14} strokeWidth={2.25} />
                  {typeLabel(tab.type)}
                </button>
              );
            })}
          </div>

          <div className="hl-toolbar-filters">
            <div className="hl-filter-block hl-filter-period">
              <HoroscopePeriodDateField
                compact
                horoscopeType={horoscopeType}
                startDate={period.startDate}
                endDate={period.endDate}
                onChange={setPeriod}
              />
            </div>
            {refreshing ? (
              <span
                className="hl-refresh-indicator"
                aria-live="polite"
                aria-label={t('updating')}
                title={t('updating')}
              >
                <Loader2 className="animate-spin" size={14} />
              </span>
            ) : null}
          </div>
        </section>

        {loading && (
          <div className="hl-loading">
            <Loader2 className="animate-spin text-primary" size={22} />
            <span>{t('loading')}</span>
          </div>
        )}

        {!loading && (
          <div
            className={refreshing ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}
            aria-busy={refreshing}
          >
            {!selectedSign && (
              <div className="hl-grid">
                {ZODIAC_ORDER.map((sign) => {
                  const meta = ZODIAC_META[sign];
                  const row = byZodiac.get(sign);
                  const hasContent = Boolean(row);
                  return (
                    <button
                      key={sign}
                      type="button"
                      className={`hl-sign-card tone-${meta.tone} ${hasContent ? 'has-content' : 'is-empty'}`}
                      onClick={() => setSelectedSign(sign)}
                    >
                      <div className="hl-sign-top">
                        <span className="hl-sign-symbol" aria-hidden>
                          {meta.symbol}
                        </span>
                      </div>
                      <div className="hl-sign-name">{zodiacLabel(sign)}</div>
                      <div className="hl-sign-element">{elementLabel(meta.tone)}</div>
                      {hasContent ? (
                        <p className="hl-sign-summary">{shortText(row?.summary) || t('openReading')}</p>
                      ) : (
                        <p className="hl-sign-empty">{t('noReadingForPeriod')}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSign && selectedMeta && (
              <div className="hl-detail space-y-4">
                <div className="hl-detail-nav">
                  <button
                    type="button"
                    className="btn-secondary btn-small inline-flex items-center gap-1.5"
                    onClick={() => setSelectedSign(null)}
                  >
                    <ArrowLeft size={14} />
                    {t('allSigns')}
                  </button>
                  <div className="hl-sign-strip" role="list">
                    {ZODIAC_ORDER.map((sign) => {
                      const meta = ZODIAC_META[sign];
                      const has = byZodiac.has(sign);
                      return (
                        <button
                          key={sign}
                          type="button"
                          role="listitem"
                          title={zodiacLabel(sign)}
                          className={`hl-strip-btn tone-${meta.tone} ${selectedSign === sign ? 'is-active' : ''} ${has ? '' : 'is-empty'}`}
                          onClick={() => setSelectedSign(sign)}
                        >
                          <span>{meta.symbol}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <article className={`hl-detail-panel tone-${selectedMeta.tone}`}>
                  <header className="hl-detail-header">
                    <div className="hl-detail-symbol">{selectedMeta.symbol}</div>
                    <div className="hl-detail-heading">
                      <h2 className="hl-detail-title">
                        {zodiacLabel(selectedSign)}
                        <span className="hl-detail-type">{typeName}</span>
                      </h2>
                      <p className="hl-detail-sub">
                        <span className={`hl-element-pill tone-${selectedMeta.tone}`}>
                          {elementLabel(selectedMeta.tone)}
                        </span>
                        <span className="hl-detail-dot">·</span>
                        {selected ? (
                          <BsDateText startDate={selected.startDate} endDate={selected.endDate} />
                        ) : (
                          <BsDateText startDate={period.startDate} endDate={period.endDate} />
                        )}
                      </p>
                    </div>
                  </header>

                  {!selected ? (
                    <div className="hl-detail-empty">
                      <p>
                        {t('noReadingDetail', {
                          type: typeNameLower,
                          sign: zodiacLabel(selectedSign),
                        })}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hl-overview">
                        <h3 className="hl-section-label">{t('overview')}</h3>
                        <p className="hl-overview-text">{selected.summary?.trim() || '—'}</p>
                      </div>

                      <div className="hl-stats">
                        <div className="hl-stat">
                          <span className="hl-stat-label">{t('luckyNumber')}</span>
                          <span className="hl-stat-value">
                            {selected.luckyNumber?.trim()
                              ? localizeDigits(selected.luckyNumber.trim(), uiCode)
                              : '—'}
                          </span>
                        </div>
                        <div className="hl-stat">
                          <span className="hl-stat-label">{t('luckyColor')}</span>
                          <span className="hl-stat-value">
                            <LuckyColorDisplay
                              value={selected.luckyColor}
                              uiCode={uiCode}
                              colorRows={colorRows}
                            />
                          </span>
                        </div>
                        <div className="hl-stat">
                          <span className="hl-stat-label">{t('luckyTime')}</span>
                          <span className="hl-stat-value inline-flex items-center justify-center gap-1.5">
                            <Clock size={14} className="opacity-60" />
                            {selected.luckyTime?.trim()
                              ? localizeDigits(selected.luckyTime.trim(), uiCode)
                              : '—'}
                          </span>
                        </div>
                        <div className="hl-stat">
                          <span className="hl-stat-label">{t('mood')}</span>
                          <span className="hl-stat-value">{selected.mood?.trim() || '—'}</span>
                        </div>
                      </div>

                      <div className="hl-ratings-block">
                        <div className="hl-ratings-heading">
                          <h3 className="hl-section-label">{t('allRatings')}</h3>
                          <div className="hl-overall-badge">
                            <span className="hl-overall-badge-label">{t('overall')}</span>
                            <RatingStars value={selected.overallRating} uiCode={uiCode} />
                            <span className="hl-overall-badge-num">{formatRating(selected.overallRating, uiCode)}</span>
                          </div>
                        </div>
                        <div className="hl-ratings-table">
                          <div className="hl-ratings-table-head" aria-hidden>
                            <div className="hl-ratings-table-head-col">
                              <span>{t('category')}</span>
                              <span>{t('rating')}</span>
                            </div>
                            <div className="hl-ratings-table-head-col">
                              <span>{t('category')}</span>
                              <span>{t('rating')}</span>
                            </div>
                          </div>
                          <div className="hl-ratings-grid">
                            {RATING_FIELDS.map((r) => {
                              const value = selected[r.key];
                              const num = typeof value === 'number' ? value : null;
                              return (
                                <div key={r.key} className="hl-rating-row">
                                  <span className="hl-rating-label">{t(r.labelKey)}</span>
                                  <span className="hl-rating-stars">
                                    <RatingStars value={num} uiCode={uiCode} />
                                    <span className="hl-rating-num">{formatRating(num, uiCode)}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="hl-sections-block">
                        <h3 className="hl-section-label">{t('readingDetails')}</h3>
                        <div className="hl-sections">
                          {SECTION_FIELDS.map((s) => {
                            const Icon = s.icon;
                            const text = selected[s.key];
                            const body = typeof text === 'string' && text.trim() ? text.trim() : '—';
                            return (
                              <section key={s.key} className="hl-section">
                                <h4 className="hl-section-label">
                                  <Icon size={13} />
                                  {t(s.labelKey)}
                                </h4>
                                <p className="hl-section-body">{body}</p>
                              </section>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </article>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
