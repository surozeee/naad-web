/**
 * Ashtakoot (Guna Milan) — computed from two Swiss Ephemeris kundali charts.
 */

import type { GunaScore, KundaliChart, KundaliMatchResult, PlanetPosition } from '@/app/lib/kundali.types';

const NAKSHATRA_KEYS = [
  'ASHWINI',
  'BHARANI',
  'KRITTIKA',
  'ROHINI',
  'MRIGASHIRA',
  'ARDRA',
  'PUNARVASU',
  'PUSHYA',
  'ASHLESHA',
  'MAGHA',
  'PURVA_PHALGUNI',
  'UTTARA_PHALGUNI',
  'HASTA',
  'CHITRA',
  'SWATI',
  'VISHAKHA',
  'ANURADHA',
  'JYESHTHA',
  'MULA',
  'PURVA_ASHADHA',
  'UTTARA_ASHADHA',
  'SHRAVANA',
  'DHANISHTA',
  'SHATABHISHA',
  'PURVA_BHADRAPADA',
  'UTTARA_BHADRAPADA',
  'REVATI',
] as const;

const GANA = [
  'DEVA',
  'MANUSHYA',
  'RAKSHASA',
  'DEVA',
  'DEVA',
  'MANUSHYA',
  'DEVA',
  'DEVA',
  'RAKSHASA',
  'RAKSHASA',
  'MANUSHYA',
  'MANUSHYA',
  'DEVA',
  'RAKSHASA',
  'DEVA',
  'RAKSHASA',
  'DEVA',
  'RAKSHASA',
  'RAKSHASA',
  'MANUSHYA',
  'MANUSHYA',
  'DEVA',
  'RAKSHASA',
  'RAKSHASA',
  'MANUSHYA',
  'MANUSHYA',
  'DEVA',
] as const;

const YONI = [
  'HORSE',
  'ELEPHANT',
  'SHEEP',
  'SERPENT',
  'SERPENT',
  'DOG',
  'CAT',
  'SHEEP',
  'CAT',
  'RAT',
  'RAT',
  'COW',
  'BUFFALO',
  'TIGER',
  'BUFFALO',
  'TIGER',
  'DEER',
  'DEER',
  'DOG',
  'MONKEY',
  'MONGOOSE',
  'MONKEY',
  'LION',
  'HORSE',
  'LION',
  'COW',
  'ELEPHANT',
] as const;

const NADI = ['ADI', 'MADHYA', 'ANTYA'] as const;

const SIGN_LORD = ['MA', 'VE', 'ME', 'MO', 'SU', 'ME', 'VE', 'MA', 'JU', 'SA', 'SA', 'JU'] as const;

/** Vashya group per moon sign index (0–11). */
const VASHYA_GROUP = ['CHATUSHPAD', 'CHATUSHPAD', 'MANAV', 'JALCHAR', 'VANCHAR', 'MANAV', 'MANAV', 'KEET', 'MANAV', 'CHATUSHPAD', 'MANAV', 'JALCHAR'] as const;

/** Varna rank per moon sign (higher = better for groom). */
const VARNA_RANK = [2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1] as const;

const PLANET_FRIENDSHIP: Record<string, Record<string, 'FRIEND' | 'NEUTRAL' | 'ENEMY'>> = {
  SU: { SU: 'FRIEND', MO: 'NEUTRAL', MA: 'FRIEND', ME: 'NEUTRAL', JU: 'FRIEND', VE: 'ENEMY', SA: 'ENEMY' },
  MO: { SU: 'FRIEND', MO: 'FRIEND', MA: 'NEUTRAL', ME: 'ENEMY', JU: 'NEUTRAL', VE: 'NEUTRAL', SA: 'NEUTRAL' },
  MA: { SU: 'FRIEND', MO: 'FRIEND', MA: 'FRIEND', ME: 'ENEMY', JU: 'FRIEND', VE: 'NEUTRAL', SA: 'NEUTRAL' },
  ME: { SU: 'FRIEND', MO: 'ENEMY', MA: 'NEUTRAL', ME: 'FRIEND', JU: 'NEUTRAL', VE: 'FRIEND', SA: 'NEUTRAL' },
  JU: { SU: 'FRIEND', MO: 'FRIEND', MA: 'FRIEND', ME: 'ENEMY', JU: 'FRIEND', VE: 'ENEMY', SA: 'NEUTRAL' },
  VE: { SU: 'ENEMY', MO: 'ENEMY', MA: 'NEUTRAL', ME: 'FRIEND', JU: 'NEUTRAL', VE: 'FRIEND', SA: 'FRIEND' },
  SA: { SU: 'ENEMY', MO: 'ENEMY', MA: 'NEUTRAL', ME: 'FRIEND', JU: 'NEUTRAL', VE: 'FRIEND', SA: 'FRIEND' },
};

const YONI_ENEMIES: Record<string, string> = {
  HORSE: 'BUFFALO',
  BUFFALO: 'HORSE',
  ELEPHANT: 'LION',
  LION: 'ELEPHANT',
  SHEEP: 'MONKEY',
  MONKEY: 'SHEEP',
  SERPENT: 'MONGOOSE',
  MONGOOSE: 'SERPENT',
  DOG: 'DEER',
  DEER: 'DOG',
  CAT: 'RAT',
  RAT: 'CAT',
  COW: 'TIGER',
  TIGER: 'COW',
};

function normalizeNakshatra(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function nakshatraIndex(raw: string): number {
  const key = normalizeNakshatra(raw);
  const idx = NAKSHATRA_KEYS.indexOf(key as (typeof NAKSHATRA_KEYS)[number]);
  if (idx >= 0) return idx;
  const fuzzy = NAKSHATRA_KEYS.findIndex((k) => key.includes(k) || k.includes(key));
  if (fuzzy >= 0) return fuzzy;
  throw new Error(`Unknown nakshatra: ${raw}`);
}

function moonPlanet(chart: KundaliChart): PlanetPosition {
  const moon = chart.planets.find((p) => p.code === 'MO' || p.code === 'MOON');
  if (!moon) throw new Error('Moon position missing from kundali chart');
  return moon;
}

function scoreVarna(maleSign: number, femaleSign: number): GunaScore {
  const maleRank = VARNA_RANK[maleSign] ?? 0;
  const femaleRank = VARNA_RANK[femaleSign] ?? 0;
  const obtained = maleRank >= femaleRank ? 1 : 0;
  return {
    code: 'VARNA',
    label: 'Varna',
    obtained,
    maximum: 1,
    summary: obtained ? 'Varna is compatible' : 'Varna mismatch — groom varna should not be lower',
  };
}

function scoreVashya(maleSign: number, femaleSign: number): GunaScore {
  const maleGroup = VASHYA_GROUP[maleSign];
  const femaleGroup = VASHYA_GROUP[femaleSign];
  let obtained = 0;
  if (maleGroup === femaleGroup) obtained = 2;
  else if (
    (maleGroup === 'CHATUSHPAD' && femaleGroup === 'MANAV') ||
    (maleGroup === 'MANAV' && femaleGroup === 'CHATUSHPAD') ||
    (maleGroup === 'JALCHAR' && femaleGroup === 'MANAV') ||
    (maleGroup === 'MANAV' && femaleGroup === 'JALCHAR')
  ) {
    obtained = 1;
  } else if (maleGroup === 'VANCHAR' || femaleGroup === 'VANCHAR') {
    obtained = 1;
  }
  return {
    code: 'VASHYA',
    label: 'Vashya',
    obtained,
    maximum: 2,
    summary:
      obtained === 2
        ? 'Same vashya group — strong mutual influence'
        : obtained === 1
          ? 'Partial vashya compatibility'
          : 'Low vashya compatibility',
  };
}

function scoreTara(maleNak: number, femaleNak: number): GunaScore {
  const count = ((femaleNak - maleNak + 27) % 27) + 1;
  const rem = count % 9;
  const bad = rem === 3 || rem === 5 || rem === 7;
  const obtained = bad ? 0 : rem === 0 ? 3 : 1.5;
  return {
    code: 'TARA',
    label: 'Tara (Dina)',
    obtained,
    maximum: 3,
    summary: bad ? 'Inauspicious tara — health / longevity concern in tradition' : 'Tara is favourable',
  };
}

function scoreYoni(maleNak: number, femaleNak: number): GunaScore {
  const maleYoni = YONI[maleNak];
  const femaleYoni = YONI[femaleNak];
  let obtained = 0;
  if (maleYoni === femaleYoni) obtained = 4;
  else if (YONI_ENEMIES[maleYoni] === femaleYoni) obtained = 0;
  else obtained = 2;
  return {
    code: 'YONI',
    label: 'Yoni',
    obtained,
    maximum: 4,
    summary:
      obtained === 4
        ? 'Same yoni — excellent physical compatibility'
        : obtained === 0
          ? 'Enemy yoni — traditionally discouraged'
          : 'Neutral yoni compatibility',
  };
}

function scoreGrahaMaitri(maleSign: number, femaleSign: number): GunaScore {
  const maleLord = SIGN_LORD[maleSign];
  const femaleLord = SIGN_LORD[femaleSign];
  if (maleLord === femaleLord) {
    return { code: 'MAITRI', label: 'Graha Maitri', obtained: 5, maximum: 5, summary: 'Same moon sign lord' };
  }
  const rel = PLANET_FRIENDSHIP[maleLord]?.[femaleLord] ?? 'NEUTRAL';
  const obtained = rel === 'FRIEND' ? 5 : rel === 'NEUTRAL' ? 3 : 0;
  return {
    code: 'MAITRI',
    label: 'Graha Maitri',
    obtained,
    maximum: 5,
    summary:
      rel === 'FRIEND'
        ? 'Moon lords are friends'
        : rel === 'NEUTRAL'
          ? 'Moon lords are neutral'
          : 'Moon lords are enemies',
  };
}

function scoreGana(maleNak: number, femaleNak: number): GunaScore {
  const maleGana = GANA[maleNak];
  const femaleGana = GANA[femaleNak];
  let obtained = 0;
  if (maleGana === femaleGana) obtained = 6;
  else if (maleGana === 'DEVA' && femaleGana === 'MANUSHYA') obtained = 5;
  else if (maleGana === 'MANUSHYA' && femaleGana === 'DEVA') obtained = 6;
  else if (maleGana === 'MANUSHYA' && femaleGana === 'MANUSHYA') obtained = 6;
  else if (maleGana === 'RAKSHASA' && femaleGana === 'MANUSHYA') obtained = 1;
  else if (maleGana === 'MANUSHYA' && femaleGana === 'RAKSHASA') obtained = 0;
  else if (maleGana === 'DEVA' && femaleGana === 'RAKSHASA') obtained = 0;
  else if (maleGana === 'RAKSHASA' && femaleGana === 'DEVA') obtained = 0;
  else obtained = 3;
  return {
    code: 'GANA',
    label: 'Gana',
    obtained,
    maximum: 6,
    summary:
      obtained >= 5
        ? 'Gana temperament is compatible'
        : obtained === 0
          ? 'Gana mismatch — temperament clash in tradition'
          : 'Partial gana compatibility',
  };
}

function scoreBhakoot(maleSign: number, femaleSign: number): GunaScore {
  const diff = Math.abs(maleSign - femaleSign);
  const distance = Math.min(diff, 12 - diff);
  const badPairs = distance === 1 || distance === 5 || distance === 6;
  const obtained = badPairs ? 0 : 7;
  return {
    code: 'BHAKOOT',
    label: 'Bhakoot',
    obtained,
    maximum: 7,
    summary: badPairs
      ? 'Bhakoot dosha — moon signs in 2/12, 5/9 or 6/8 relation'
      : 'Bhakoot is compatible — prosperity & family harmony',
  };
}

function scoreNadi(maleNak: number, femaleNak: number): GunaScore {
  const maleNadi = NADI[maleNak % 3];
  const femaleNadi = NADI[femaleNak % 3];
  const obtained = maleNadi === femaleNadi ? 0 : 8;
  return {
    code: 'NADI',
    label: 'Nadi',
    obtained,
    maximum: 8,
    summary:
      obtained === 0
        ? 'Same nadi — nadi dosha; health of progeny reviewed traditionally'
        : 'Different nadi — excellent (8 points)',
  };
}

function verdictFromScore(total: number): { verdict: string; recommendation: string } {
  if (total >= 32) {
    return {
      verdict: 'Excellent match',
      recommendation: 'Traditionally considered highly auspicious for marriage (32+ gunas).',
    };
  }
  if (total >= 24) {
    return {
      verdict: 'Good match',
      recommendation: 'Above the common minimum threshold of 18 gunas — generally acceptable.',
    };
  }
  if (total >= 18) {
    return {
      verdict: 'Average match',
      recommendation: 'Meets minimum 18 guna threshold — review doshas with an astrologer.',
    };
  }
  return {
    verdict: 'Low compatibility',
    recommendation: 'Below 18 gunas — detailed astrological review recommended before proceeding.',
  };
}

function mangalikNote(male: KundaliChart, female: KundaliChart) {
  const maleM = Boolean(male.mangalik?.present);
  const femaleM = Boolean(female.mangalik?.present);
  let compatible = true;
  let note = 'Neither chart shows Mangal dosha.';
  if (maleM && femaleM) {
    compatible = true;
    note = 'Both have Mangal dosha — traditionally considered mutually cancelable; still verify severity.';
  } else if (maleM || femaleM) {
    compatible = false;
    note = 'One partner has Mangal dosha — marriage matching often requires remedies or astrologer review.';
  }
  return { maleMangalik: maleM, femaleMangalik: femaleM, compatible, note };
}

export function computeKundaliMatch(
  maleChart: KundaliChart,
  femaleChart: KundaliChart,
  options?: { includeCharts?: boolean }
): KundaliMatchResult {
  const maleMoon = moonPlanet(maleChart);
  const femaleMoon = moonPlanet(femaleChart);
  const maleNak = nakshatraIndex(maleMoon.nakshatra || maleMoon.nakshatraLabel);
  const femaleNak = nakshatraIndex(femaleMoon.nakshatra || femaleMoon.nakshatraLabel);
  const maleSign = maleMoon.signIndex;
  const femaleSign = femaleMoon.signIndex;

  const gunas = [
    scoreVarna(maleSign, femaleSign),
    scoreVashya(maleSign, femaleSign),
    scoreTara(maleNak, femaleNak),
    scoreYoni(maleNak, femaleNak),
    scoreGrahaMaitri(maleSign, femaleSign),
    scoreGana(maleNak, femaleNak),
    scoreBhakoot(maleSign, femaleSign),
    scoreNadi(maleNak, femaleNak),
  ];

  const totalScore = Math.round(gunas.reduce((sum, g) => sum + g.obtained, 0) * 10) / 10;
  const maximumScore = 36;
  const { verdict, recommendation } = verdictFromScore(totalScore);

  return {
    totalScore,
    maximumScore,
    percentage: Math.round((totalScore / maximumScore) * 1000) / 10,
    verdict,
    recommendation,
    gunas,
    male: {
      name: maleChart.name,
      moonSign: maleChart.summary.moonSign,
      moonNakshatra: maleChart.summary.moonNakshatra,
      lagna: maleChart.summary.lagna,
      mangalik: Boolean(maleChart.mangalik?.present),
      mangalikSeverity: maleChart.mangalik?.severity,
    },
    female: {
      name: femaleChart.name,
      moonSign: femaleChart.summary.moonSign,
      moonNakshatra: femaleChart.summary.moonNakshatra,
      lagna: femaleChart.summary.lagna,
      mangalik: Boolean(femaleChart.mangalik?.present),
      mangalikSeverity: femaleChart.mangalik?.severity,
    },
    mangalikCompatibility: mangalikNote(maleChart, femaleChart),
    ...(options?.includeCharts !== false ? { charts: { male: maleChart, female: femaleChart } } : {}),
  };
}
