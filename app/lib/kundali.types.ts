export type ChartStyleType = 'NORTH_INDIAN' | 'SOUTH_INDIAN' | 'EAST_INDIAN';
export type AyanamsaType = 'LAHIRI' | 'RAMAN' | 'KRISHNAMURTI' | 'FAGAN_BRADLEY';
export type HouseSystemType =
  | 'WHOLE_SIGN'
  | 'PLACIDUS'
  | 'EQUAL'
  | 'KOCH'
  | 'PORPHYRIUS'
  | 'REGIOMONTANUS'
  | 'CAMPANUS'
  | 'SRIPATI';

export interface KundaliGenerateRequest {
  name?: string;
  birthDate: string;
  birthTime?: string;
  timezone?: string;
  latitude: number;
  longitude: number;
  placeName?: string;
  ayanamsa?: AyanamsaType;
  houseSystem?: HouseSystemType;
  chartStyle?: ChartStyleType;
  language?: string;
}

export interface KundaliMatchRequest {
  male: KundaliGenerateRequest;
  female: KundaliGenerateRequest;
  language?: string;
  ayanamsa?: AyanamsaType;
  houseSystem?: HouseSystemType;
  includeCharts?: boolean;
}

export interface GunaScore {
  code: string;
  label: string;
  obtained: number;
  maximum: number;
  summary: string;
}

export interface KundaliMatchResult {
  totalScore: number;
  maximumScore: number;
  percentage: number;
  verdict: string;
  recommendation: string;
  gunas: GunaScore[];
  male: {
    name?: string;
    moonSign: string;
    moonNakshatra: string;
    lagna: string;
    mangalik: boolean;
    mangalikSeverity?: string;
  };
  female: {
    name?: string;
    moonSign: string;
    moonNakshatra: string;
    lagna: string;
    mangalik: boolean;
    mangalikSeverity?: string;
  };
  mangalikCompatibility: {
    maleMangalik: boolean;
    femaleMangalik: boolean;
    compatible: boolean;
    note: string;
  };
  charts?: {
    male: KundaliChart;
    female: KundaliChart;
  };
}

export interface SignPosition {
  sign: string;
  signLabel: string;
  rashiNepali?: string;
  rashiHindi?: string;
  signIndex: number;
  longitude: number;
  degreeInSign: number;
  formattedDegree: string;
}

export interface PlanetPosition {
  code: string;
  name: string;
  glyph: string;
  longitude: number;
  latitude: number;
  speed: number;
  retrograde: boolean;
  sign: string;
  signLabel: string;
  signIndex: number;
  degreeInSign: number;
  formattedDegree: string;
  house: number;
  nakshatra: string;
  nakshatraLabel: string;
  pada: number;
}

export interface HouseCusp {
  number: number;
  cuspLongitude: number;
  sign: string;
  signLabel: string;
  signIndex: number;
  degreeInSign: number;
  formattedDegree: string;
}

export interface KundaliSummary {
  lagna: string;
  moonSign: string;
  sunSign: string;
  moonNakshatra: string;
  title: string;
}

export interface DashaPeriod {
  planetCode: string;
  planetLabel: string;
  startDate: string;
  endDate: string;
  years: number;
  current: boolean;
}

export interface DashaSystem {
  system: string;
  moonNakshatra: string;
  moonNakshatraLabel: string;
  moonPada: number;
  balanceYears: number;
  balanceLord: string;
  balanceLordLabel: string;
  currentMahadasha?: DashaPeriod | null;
  currentAntardasha?: DashaPeriod | null;
  mahadashas: DashaPeriod[];
  antardashas: DashaPeriod[];
}

export interface MangalikInfo {
  present: boolean;
  severity: string;
  marsHouseFromLagna?: number | null;
  marsHouseFromMoon?: number | null;
  marsHouseFromVenus?: number | null;
  marsSign?: string;
  marsSignLabel?: string;
  summary: string;
  notes: string[];
}

export interface PanchangaInfo {
  weekday: string;
  weekdayIndex: number;
  tithiNumber: number;
  tithiName: string;
  paksha: string;
  yogaNumber: number;
  yogaName: string;
  karanaName: string;
  moonNakshatra: string;
  moonNakshatraLabel: string;
  moonPada: number;
  timingQuality: string;
  timingSummary: string;
  guidance: string[];
}

export interface PlanetDignity {
  planetCode: string;
  status: string;
  signLord?: string | null;
  signLordLabel?: string | null;
  note?: string;
}

export interface TransitGenerateRequest {
  date?: string;
  time?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  ayanamsa?: AyanamsaType;
  language?: string;
  daysAhead?: number;
  natalBirthDate?: string;
  natalBirthTime?: string;
  natalTimezone?: string;
  natalLatitude?: number;
  natalLongitude?: number;
  natalPlaceName?: string;
}

export interface TransitPlanet {
  code: string;
  name: string;
  glyph: string;
  retrograde: boolean;
  sign: string;
  signLabel: string;
  signIndex: number;
  degreeInSign: number;
  formattedDegree: string;
  longitude: number;
  speed: number;
  nakshatra: string;
  nakshatraLabel: string;
  pada: number;
  house?: number | null;
  status: string;
  nextSign?: string | null;
  nextSignLabel?: string | null;
  nextSignChangeAt?: string | null;
  daysUntilSignChange?: number | null;
  effect: string;
}

export interface TransitSnapshot {
  dateTime: string;
  timezone: string;
  latitude: number;
  longitude: number;
  placeName?: string;
  ayanamsaName: string;
  ayanamsaDegrees: number;
  ephemerisMode: string;
  language: string;
  daysAhead: number;
  personal: boolean;
  natalLagna?: string | null;
  natalLagnaSignIndex?: number | null;
  ascendant: SignPosition;
  planets: PlanetPosition[];
  transits: TransitPlanet[];
}

export interface KundaliChart {
  name?: string;
  placeName?: string;
  birthDateTime: string;
  timezone: string;
  latitude: number;
  longitude: number;
  julianDayUt: number;
  ayanamsaName: string;
  ayanamsaDegrees: number;
  houseSystem: string;
  ephemerisMode: string;
  chartStyle: ChartStyleType;
  language: string;
  ascendant: SignPosition;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  lagnaSignIndex: number;
  summary: KundaliSummary;
  dasha?: DashaSystem | null;
  mangalik?: MangalikInfo | null;
  panchanga?: PanchangaInfo | null;
  dignities?: PlanetDignity[] | null;
}
