'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/app/components/LocaleProvider';
import { masterService } from '@/app/lib/master.service';
import { getStoredUiLanguage } from '@/app/lib/ui-language';
import { formatTimezoneDisplay } from '@/app/lib/timezone-options';
import type { TimezoneResponse } from '@/app/lib/master.types';

export type ActiveTimezoneOption = {
  value: string; // IANA zoneId
  label: string;
  name: string; // enum constant
  code: string;
  utcOffset: string;
};

function resolveZoneId(row: TimezoneResponse): string {
  if (row.zoneId?.trim()) return row.zoneId.trim();
  if (row.name?.includes('/')) return row.name.trim();
  return formatTimezoneDisplay(row.name);
}

function mapRow(row: TimezoneResponse): ActiveTimezoneOption | null {
  const zoneId = resolveZoneId(row);
  if (!zoneId) return null;
  const code = String(row.code ?? '').trim();
  const offset = String(row.utcOffset ?? '').trim();
  const labelParts = [code || formatTimezoneDisplay(row.name), offset ? `(${offset})` : '']
    .filter(Boolean)
    .join(' ');
  return {
    value: zoneId,
    label: labelParts || zoneId,
    name: String(row.name ?? ''),
    code,
    utcOffset: offset,
  };
}

function normalizeList(raw: unknown): TimezoneResponse[] {
  if (Array.isArray(raw)) return raw as TimezoneResponse[];
  return [];
}

/**
 * Active master timezones for the current UI locale (Accept-Language).
 * Prefers authenticated master API (logged-in kundali pages), falls back to public.
 */
export function useActiveTimezones() {
  const { language } = useLocale();
  const [options, setOptions] = useState<ActiveTimezoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (lang: string) => {
    setLoading(true);
    setError(null);
    try {
      let list: TimezoneResponse[] = [];

      try {
        const masterRes = await masterService.timezone.listActive();
        list = normalizeList(masterRes.data);
      } catch {
        /* fall through to public */
      }

      if (list.length === 0) {
        const res = await fetch('/api/public/timezone/list-active', {
          headers: {
            Accept: '*/*',
            'Accept-Language': lang || getStoredUiLanguage(),
          },
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: TimezoneResponse[];
          result?: TimezoneResponse[];
        };
        list = normalizeList(json.data ?? json.result);
      }

      const mapped = list
        .map(mapRow)
        .filter((o): o is ActiveTimezoneOption => o != null)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
      setOptions(mapped);
    } catch (err) {
      setOptions([]);
      setError(err instanceof Error ? err.message : 'Failed to load timezones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(language);
  }, [language, load]);

  const byZoneId = useMemo(() => {
    const map = new Map<string, ActiveTimezoneOption>();
    for (const opt of options) map.set(opt.value, opt);
    return map;
  }, [options]);

  return { options, byZoneId, loading, error, language, reload: () => load(language) };
}
