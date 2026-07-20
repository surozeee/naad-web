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
}
