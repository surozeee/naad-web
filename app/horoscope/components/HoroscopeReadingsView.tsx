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
import {
  publicColorApi,
  publicHoroscopeApi,
  publicZodiacSignApi,
} from '@/app/lib/public-horoscope';
import type {
  HoroscopeResponse,
  HoroscopeTypeEnum,
  ZodiacSignEnum,
  ZodiacSignResponse,
} from '@/app/lib/crm.types';
import { formatIsoDate, resolveHoroscopePeriodDates } from '@/app/lib/horoscope-date-period';
import { HOROSCOPE_LUCKY_COLORS, parseLuckyColors } from '@/app/horoscope/components/HoroscopeColorPicker';
import { useLocale } from '@/app/components/LocaleProvider';
import { translateHoroscope, useHoroscopeI18n } from '@/app/lib/horoscope-i18n';
import { localizeDigits } from '@/app/lib/nepali-digits';
import { resolveColorDisplayName } from '@/app/lib/color-i18n';
import {
  ZODIAC_META,
  ZODIAC_SIGN_ORDER,
  resolveZodiacDisplayName,
  resolveZodiacElementLabel,
  resolveZodiacLogoUrl,
  resolveZodiacTone,
  uiCodeToBackendLanguage,
} from '@/app/lib/zodiac-i18n';
import { colorApi } from '@/app/lib/master.service';
import type { ColorResponse } from '@/app/lib/master.types';

export type HoroscopeReadingsVariant = 'public' | 'dashboard';

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

function ZodiacSignGlyph({
  sign,
  zodiacRows,
  className,
}: {
  sign: ZodiacSignEnum;
  zodiacRows: ZodiacSignResponse[];
  className?: string;
}) {
  const localUrl = `/zodiac/${sign.toLowerCase()}.svg`;
  const preferredUrl = resolveZodiacLogoUrl(sign, zodiacRows);
  const meta = ZODIAC_META[sign];
  const [src, setSrc] = useState(preferredUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(resolveZodiacLogoUrl(sign, zodiacRows));
    setFailed(false);
  }, [sign, zodiacRows]);

  if (!failed) {
    return (
      <img
        src={src}
        alt=""
        className={className}
        width={40}
        height={40}
        loading="lazy"
        onError={() => {
          if (src !== localUrl) setSrc(localUrl);
          else setFailed(true);
        }}
      />
    );
  }
  return (
    <span className={className} aria-hidden>
      {meta.symbol}
    </span>
  );
}

export default function HoroscopeReadingsView({
  variant = 'dashboard',
}: {
  variant?: HoroscopeReadingsVariant;
}) {
  const isPublic = variant === 'public';
  const { language } = useLocale();
  const backendLanguage = useMemo(() => uiCodeToBackendLanguage(language), [language]);

  const [horoscopeType, setHoroscopeType] = useState<HoroscopeTypeEnum>('DAILY');
  const [period, setPeriod] = useState(() => resolveHoroscopePeriodDates('DAILY', formatIsoDate(new Date())));
  const [items, setItems] = useState<HoroscopeResponse[]>([]);
  const [zodiacRows, setZodiacRows] = useState<ZodiacSignResponse[]>([]);
  const { t, typeLabel, elementLabel, uiCode } = useHoroscopeI18n(zodiacRows);
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

  const zodiacElementText = useCallback(
    (sign: ZodiacSignEnum) =>
      resolveZodiacElementLabel(sign, zodiacRows, backendLanguage, uiCode, elementLabel),
    [zodiacRows, backendLanguage, uiCode, elementLabel]
  );

  const zodiacTone = useCallback(
    (sign: ZodiacSignEnum) => resolveZodiacTone(sign, zodiacRows),
    [zodiacRows]
  );

  const loadZodiacNames = useCallback(async () => {
    try {
      const res = isPublic
        ? await publicZodiacSignApi.listActive()
        : await zodiacSignApi.listActive();
      setZodiacRows(Array.isArray(res?.data) ? (res.data as ZodiacSignResponse[]) : []);
    } catch {
      setZodiacRows([]);
    }
  }, [isPublic]);

  const loadColorNames = useCallback(async () => {
    try {
      const res = isPublic ? await publicColorApi.listActive() : await colorApi.listActive();
      setColorRows(Array.isArray(res?.data) ? (res.data as ColorResponse[]) : []);
    } catch {
      setColorRows([]);
    }
  }, [isPublic]);

  const loadList = useCallback(async () => {
    const isInitial = !initialLoadDone.current;
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const listArgs = {
        pageNo: 0,
        pageSize: 50,
        sortBy: 'zodiacSign' as const,
        sortDirection: 'asc' as const,
        horoscopeType,
        language: backendLanguage,
        referenceDate: period.startDate,
        publishStatus: 'PUBLISHED' as const,
        status: 'ACTIVE' as const,
      };
      const res = isPublic
        ? await publicHoroscopeApi.list(listArgs)
        : await horoscopeApi.list(listArgs);
      setItems((res.result ?? res.content ?? []) as HoroscopeResponse[]);
      initialLoadDone.current = true;
    } catch (e: unknown) {
      if (isInitial) {
        setItems([]);
        // Public page must never show login/session dialogs.
        if (!isPublic) {
          await Swal.fire({
            icon: 'error',
            text: e instanceof Error ? e.message : translateHoroscope(uiCode, 'list.loadError'),
          });
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [horoscopeType, backendLanguage, period.startDate, uiCode, isPublic]);

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
  const selectedTone = selectedSign ? zodiacTone(selectedSign) : null;
  const typeName = typeLabel(horoscopeType);
  const typeNameLower = typeName.toLowerCase();

  return (
    <div className={`horoscope-list-page hl-page space-y-5${isPublic ? ' hl-page--public px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto' : ''}`}>
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
            {!isPublic && (
              <div className="hl-filter-block hl-filter-period">
                <HoroscopePeriodDateField
                  compact
                  horoscopeType={horoscopeType}
                  startDate={period.startDate}
                  endDate={period.endDate}
                  onChange={setPeriod}
                />
              </div>
            )}
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
                {ZODIAC_SIGN_ORDER.map((sign) => {
                  const tone = zodiacTone(sign);
                  const row = byZodiac.get(sign);
                  const hasContent = Boolean(row);
                  return (
                    <button
                      key={sign}
                      type="button"
                      className={`hl-sign-card tone-${tone} ${hasContent ? 'has-content' : 'is-empty'}`}
                      onClick={() => setSelectedSign(sign)}
                    >
                      <div className="hl-sign-top">
                        <ZodiacSignGlyph sign={sign} zodiacRows={zodiacRows} className="hl-sign-symbol" />
                      </div>
                      <div className="hl-sign-name">{zodiacLabel(sign)}</div>
                      <div className="hl-sign-element">{zodiacElementText(sign)}</div>
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
                    className="hl-back-btn"
                    onClick={() => setSelectedSign(null)}
                  >
                    <ArrowLeft size={16} />
                    {t('allSigns')}
                  </button>

                  <div className="hl-sign-picker" role="list" aria-label={t('allSigns')}>
                    {ZODIAC_SIGN_ORDER.map((sign) => {
                      const tone = zodiacTone(sign);
                      const has = byZodiac.has(sign);
                      const active = selectedSign === sign;
                      return (
                        <button
                          key={sign}
                          type="button"
                          role="listitem"
                          aria-current={active ? 'true' : undefined}
                          title={zodiacLabel(sign)}
                          className={`hl-strip-btn tone-${tone} ${active ? 'is-active' : ''} ${has ? '' : 'is-empty'}`}
                          onClick={() => setSelectedSign(sign)}
                        >
                          <ZodiacSignGlyph sign={sign} zodiacRows={zodiacRows} className="hl-strip-symbol" />
                          <span className="hl-strip-label">{zodiacLabel(sign)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <article className={`hl-detail-panel tone-${selectedTone ?? selectedMeta?.tone ?? 'fire'}`}>
                  <header className="hl-detail-header">
                    <div className="hl-detail-symbol" aria-hidden>
                      {selectedSign ? (
                        <ZodiacSignGlyph sign={selectedSign} zodiacRows={zodiacRows} className="hl-detail-symbol-img" />
                      ) : null}
                    </div>
                    <div className="hl-detail-heading">
                      <h2 className="hl-detail-title">{zodiacLabel(selectedSign)}</h2>
                      <p className="hl-detail-sub">
                        <span className="hl-detail-type">{typeName}</span>
                        <span className={`hl-element-pill tone-${selectedTone ?? selectedMeta?.tone ?? 'fire'}`}>
                          {zodiacElementText(selectedSign)}
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
