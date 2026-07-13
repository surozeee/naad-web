/**
 * Western digits → Devanagari (Nepali) numerals: 0–9 → ०–९.
 * Non-digit characters (., :, -, spaces, AM/PM, etc.) are preserved.
 */

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

export function toNepaliDigits(value: number | string | null | undefined): string {
  if (value == null) return '';
  return String(value).replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)] ?? digit);
}

/** Convert digits when UI language is Nepali; otherwise return the original string. */
export function localizeDigits(
  value: number | string | null | undefined,
  uiLanguageCode?: string | null
): string {
  if (value == null) return '';
  const text = String(value);
  const lang = String(uiLanguageCode ?? '')
    .trim()
    .toLowerCase();
  if (lang === 'ne' || lang === 'np' || lang === 'nep' || lang === 'nepali') {
    return toNepaliDigits(text);
  }
  return text;
}
