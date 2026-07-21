'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/app/components/LocaleProvider';
import { zodiacSignApi } from '@/app/lib/crm.service';
import type { ZodiacSignEnum, ZodiacSignResponse } from '@/app/lib/crm.types';
import { publicZodiacSignApi } from '@/app/lib/public-horoscope';
import {
  findZodiacRow,
  resolveZodiacDisplayName,
  resolveZodiacElementLabel,
  resolveZodiacLogoUrl,
  resolveZodiacTone,
  uiCodeToBackendLanguage,
} from '@/app/lib/zodiac-i18n';
import { normalizeUiLanguageCode } from '@/app/lib/ui-language';
import { translateHoroscope } from '@/app/lib/horoscope-i18n';

export type UseZodiacSignsOptions = {
  /** Use public BFF route (no session). Default true. */
  publicMode?: boolean;
  ignoreAuthFailure?: boolean;
};

/**
 * Loads active zodiac signs with locales from the API and resolves multilingual labels.
 */
export function useZodiacSigns(options: UseZodiacSignsOptions = {}) {
  const { publicMode = true, ignoreAuthFailure = false } = options;
  const { language } = useLocale();
  const uiCode = normalizeUiLanguageCode(language);
  const backendLanguage = useMemo(() => uiCodeToBackendLanguage(uiCode), [uiCode]);

  const [rows, setRows] = useState<ZodiacSignResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = publicMode
      ? publicZodiacSignApi.listActive()
      : zodiacSignApi.listActive(ignoreAuthFailure ? { ignoreAuthFailure: true } : undefined);

    Promise.resolve(load)
      .then((res) => {
        if (!cancelled) {
          setRows(Array.isArray(res?.data) ? (res.data as ZodiacSignResponse[]) : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicMode, ignoreAuthFailure, uiCode]);

  const elementLabel = useCallback(
    (tone: 'fire' | 'earth' | 'air' | 'water') => translateHoroscope(uiCode, `common.elements.${tone}`),
    [uiCode]
  );

  const zodiacName = useCallback(
    (sign: ZodiacSignEnum) => resolveZodiacDisplayName(sign, rows, backendLanguage, uiCode),
    [rows, backendLanguage, uiCode]
  );

  const zodiacElement = useCallback(
    (sign: ZodiacSignEnum) => resolveZodiacElementLabel(sign, rows, backendLanguage, uiCode, elementLabel),
    [rows, backendLanguage, uiCode, elementLabel]
  );

  const zodiacTone = useCallback((sign: ZodiacSignEnum) => resolveZodiacTone(sign, rows), [rows]);

  const zodiacLogoUrl = useCallback((sign: ZodiacSignEnum) => resolveZodiacLogoUrl(sign, rows), [rows]);

  const getRow = useCallback((sign: ZodiacSignEnum) => findZodiacRow(sign, rows), [rows]);

  return {
    rows,
    loading,
    uiCode,
    backendLanguage,
    zodiacName,
    zodiacElement,
    zodiacTone,
    zodiacLogoUrl,
    getRow,
  };
}
