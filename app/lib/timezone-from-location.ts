/**
 * Resolve IANA timezone from coordinates / country.
 * Prefers Google Time Zone API (via BFF); falls back to country primary zones.
 */

/** Primary IANA zone per ISO-3166 alpha-2 (common birth places). */
const COUNTRY_TIMEZONES: Record<string, string> = {
  NP: 'Asia/Kathmandu',
  IN: 'Asia/Kolkata',
  BT: 'Asia/Thimphu',
  BD: 'Asia/Dhaka',
  LK: 'Asia/Colombo',
  PK: 'Asia/Karachi',
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  TH: 'Asia/Bangkok',
  MY: 'Asia/Kuala_Lumpur',
  SG: 'Asia/Singapore',
  ID: 'Asia/Jakarta',
  AE: 'Asia/Dubai',
  SA: 'Asia/Riyadh',
  QA: 'Asia/Qatar',
  KW: 'Asia/Kuwait',
  GB: 'Europe/London',
  IE: 'Europe/Dublin',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  NL: 'Europe/Amsterdam',
  CH: 'Europe/Zurich',
  AT: 'Europe/Vienna',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  US: 'America/New_York',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',
  BR: 'America/Sao_Paulo',
  ZA: 'Africa/Johannesburg',
  NG: 'Africa/Lagos',
  EG: 'Africa/Cairo',
  KE: 'Africa/Nairobi',
  RU: 'Europe/Moscow',
  TR: 'Europe/Istanbul',
  HK: 'Asia/Hong_Kong',
  TW: 'Asia/Taipei',
  PH: 'Asia/Manila',
  VN: 'Asia/Ho_Chi_Minh',
  MM: 'Asia/Yangon',
  AF: 'Asia/Kabul',
  IR: 'Asia/Tehran',
  IQ: 'Asia/Baghdad',
  IL: 'Asia/Jerusalem',
};

export function timezoneFromCountryCode(countryCode?: string | null): string | null {
  if (!countryCode) return null;
  return COUNTRY_TIMEZONES[countryCode.trim().toUpperCase()] ?? null;
}

export type ResolvedTimezone = {
  timezone: string;
  source: 'google' | 'country' | 'browser';
  countryCode?: string;
};

export async function resolveTimezone(params: {
  latitude: number;
  longitude: number;
  countryCode?: string | null;
  /** Birth date (YYYY-MM-DD) — used for DST-aware Google Time Zone lookup */
  date?: string;
}): Promise<ResolvedTimezone> {
  const { latitude, longitude, countryCode, date } = params;

  try {
    const qs = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
    });
    if (date) qs.set('date', date);
    const res = await fetch(`/api/public/timezone?${qs.toString()}`, {
      credentials: 'same-origin',
    });
    if (res.ok) {
      const json = (await res.json()) as { timezone?: string; status?: string };
      if (json.timezone?.trim()) {
        return {
          timezone: json.timezone.trim(),
          source: 'google',
          countryCode: countryCode ?? undefined,
        };
      }
    }
  } catch {
    /* fall through */
  }

  const fromCountry = timezoneFromCountryCode(countryCode);
  if (fromCountry) {
    return { timezone: fromCountry, source: 'country', countryCode: countryCode ?? undefined };
  }

  const browser =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Asia/Kathmandu';
  return { timezone: browser || 'Asia/Kathmandu', source: 'browser', countryCode: countryCode ?? undefined };
}
