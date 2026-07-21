'use client';

import { useCallback, useMemo } from 'react';
import { useLocale } from '@/app/components/LocaleProvider';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';
import type { HoroscopeTypeEnum, ZodiacSignEnum, ZodiacSignResponse } from '@/app/lib/crm.types';
import { resolveZodiacDisplayName, uiCodeToBackendLanguage } from '@/app/lib/zodiac-i18n';
import en from '@/app/locales/horoscope/en.json';
import ne from '@/app/locales/horoscope/ne.json';
import hi from '@/app/locales/horoscope/hi.json';

export type HoroscopeMessages = typeof en;
type MessageTree = Record<string, unknown>;

const PACKS: Record<string, HoroscopeMessages> = {
  en,
  ne,
  hi,
};

function getByPath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = tree;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as MessageTree)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}

/** Legacy list keys → new namespaced paths (keeps older call sites working). */
const LEGACY_LIST_ALIASES: Record<string, string> = {
  breadcrumbHoroscope: 'common.horoscope',
  breadcrumbList: 'list.breadcrumbList',
  pageTitle: 'list.pageTitle',
  pageDesc: 'list.pageDesc',
  readyCount: 'list.readyCount',
  periodTabsAria: 'list.periodTabsAria',
  loading: 'list.loading',
  updating: 'list.updating',
  ready: 'list.ready',
  empty: 'list.empty',
  openReading: 'list.openReading',
  noReadingForPeriod: 'list.noReadingForPeriod',
  allSigns: 'list.allSigns',
  noReadingDetail: 'list.noReadingDetail',
  overview: 'common.overview',
  luckyNumber: 'common.luckyNumber',
  luckyColor: 'common.luckyColor',
  luckyTime: 'common.luckyTime',
  mood: 'common.mood',
  allRatings: 'list.allRatings',
  overall: 'common.overall',
  category: 'list.category',
  rating: 'list.rating',
  readingDetails: 'list.readingDetails',
  recordInfo: 'list.recordInfo',
  publishStatus: 'list.publishStatus',
  created: 'list.created',
  updated: 'list.updated',
  loadError: 'list.loadError',
};

function resolveKey(key: string): string {
  if (key.startsWith('common.') || key.startsWith('list.') || key.startsWith('add.')) return key;
  if (key.startsWith('types.')) return `common.${key}`;
  if (key.startsWith('elements.')) return `common.${key}`;
  if (key.startsWith('sections.')) return `common.${key}`;
  if (key.startsWith('zodiac.')) return `common.${key}`;
  if (key.startsWith('ratings.')) return `common.ratingLabels.${key.slice('ratings.'.length)}`;
  if (key.startsWith('fields.')) return `common.${key}`;
  return LEGACY_LIST_ALIASES[key] ?? key;
}

export function getHoroscopeMessages(uiCode?: string | null): HoroscopeMessages {
  const code = normalizeUiLanguageCode(uiCode);
  return PACKS[code] ?? PACKS.en;
}

export function translateHoroscope(
  uiCode: string | null | undefined,
  key: string,
  vars?: Record<string, string | number>
): string {
  const path = resolveKey(key);
  const primary = getHoroscopeMessages(uiCode) as unknown as MessageTree;
  const fallback = PACKS.en as unknown as MessageTree;
  const raw = getByPath(primary, path) ?? getByPath(fallback, path) ?? key;
  return interpolate(raw, vars);
}

/** @deprecated Use translateHoroscope */
export const translateHoroscopeList = translateHoroscope;

export function useHoroscopeI18n(zodiacRows?: ZodiacSignResponse[] | null) {
  const { language } = useLocale();
  const uiCode = normalizeUiLanguageCode(language);
  const backendLanguage = useMemo(() => uiCodeToBackendLanguage(uiCode), [uiCode]);
  const dict = useMemo(() => getHoroscopeMessages(uiCode), [uiCode]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translateHoroscope(uiCode, key, vars),
    [uiCode]
  );

  const typeLabel = useCallback((type: HoroscopeTypeEnum) => t(`common.types.${type}`), [t]);
  const zodiacName = useCallback(
    (sign: ZodiacSignEnum) => {
      if (zodiacRows?.length) {
        return resolveZodiacDisplayName(sign, zodiacRows, backendLanguage, uiCode);
      }
      return t(`common.zodiac.${sign}`);
    },
    [zodiacRows, backendLanguage, uiCode, t]
  );
  const elementLabel = useCallback(
    (tone: 'fire' | 'earth' | 'air' | 'water') => t(`common.elements.${tone}`),
    [t]
  );

  return { t, dict, uiCode, typeLabel, zodiacName, elementLabel };
}

/** @deprecated Use useHoroscopeI18n */
export const useHoroscopeListI18n = useHoroscopeI18n;
