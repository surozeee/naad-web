'use client';

import { useCallback, useMemo } from 'react';
import { useLocale } from '@/app/components/LocaleProvider';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';
import type { HoroscopeTypeEnum, ZodiacSignEnum } from '@/app/lib/crm.types';
import messages from './horoscope-list.json';

export type HoroscopeListMessages = (typeof messages)['en'];
type MessageTree = Record<string, unknown>;

const DEFAULT_LANG = 'en';

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

export function getHoroscopeListMessages(uiCode?: string | null): HoroscopeListMessages {
  const code = normalizeUiLanguageCode(uiCode);
  const pack = (messages as Record<string, HoroscopeListMessages>)[code];
  return pack ?? messages.en;
}

export function translateHoroscopeList(
  uiCode: string | null | undefined,
  key: string,
  vars?: Record<string, string | number>
): string {
  const primary = getHoroscopeListMessages(uiCode) as unknown as MessageTree;
  const fallback = messages.en as unknown as MessageTree;
  const raw = getByPath(primary, key) ?? getByPath(fallback, key) ?? key;
  return interpolate(raw, vars);
}

export function useHoroscopeListI18n() {
  const { language } = useLocale();
  const uiCode = normalizeUiLanguageCode(language);
  const dict = useMemo(() => getHoroscopeListMessages(uiCode), [uiCode]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translateHoroscopeList(uiCode, key, vars),
    [uiCode]
  );

  const typeLabel = useCallback(
    (type: HoroscopeTypeEnum) => t(`types.${type}`),
    [t]
  );

  const zodiacName = useCallback(
    (sign: ZodiacSignEnum) => t(`zodiac.${sign}`),
    [t]
  );

  const elementLabel = useCallback(
    (tone: 'fire' | 'earth' | 'air' | 'water') => t(`elements.${tone}`),
    [t]
  );

  return { t, dict, uiCode, typeLabel, zodiacName, elementLabel };
}
