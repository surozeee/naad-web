/**
 * Master API types for country, state, district, local-unit, local-unit-type (aligned with backend /api/v2/master/).
 */

export type StatusEnum = 'ACTIVE' | 'INACTIVE' | string;

export interface GlobalResponse<T = unknown> {
  status?: string;
  code?: string;
  data?: T;
  message?: string;
}

export interface PaginationResponse<T> {
  totalElements?: number;
  result?: T[];
  content?: T[];
}

export interface MasterListRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchKey?: string;
}

// ---- Country ----
export interface CountryRequest {
  name: string;
  iso2?: string;
  iso3?: string;
  teleCode?: string;
  baseCurrency?: string;
  flagUrl?: string;
  regionId?: string;
  currencyIds?: string[];
}

export interface CountryLocaleResponse {
  id?: string;
  language: string;
  name: string;
}

export interface CountryLocaleUpsertRequest {
  countryId: string;
  language: string;
  name: string;
}

export interface CountryResponse {
  id: string;
  name: string;
  nationality?: string;
  iso2?: string;
  iso3?: string;
  teleCode?: string;
  flagUrl?: string;
  flag?: string;
  status?: StatusEnum;
  locales?: CountryLocaleResponse[];
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface CountryListRequest extends MasterListRequest {
  regionId?: string;
}

// ---- Region ----
export interface RegionRequest {
  name: string;
  code?: string;
  status?: StatusEnum;
}
export type RegionListRequest = MasterListRequest;

// ---- State ----
export interface StateRequest {
  name: string;
  code?: string;
  countryId?: string;
  status?: StatusEnum;
}
export interface StateListRequest extends MasterListRequest {
  countryId?: string;
}

// ---- District ----
export interface DistrictRequest {
  name: string;
  code?: string;
  status?: StatusEnum;
  stateId: string;
}
export interface DistrictListRequest extends MasterListRequest {
  stateId?: string;
}

// ---- Currency ----
export interface CurrencyRequest {
  name: string;
  code: string;
  symbol?: string;
  status?: StatusEnum;
}
export type CurrencyListRequest = MasterListRequest;

// ---- Local Unit ----
export interface LocalUnitRequest {
  name: string;
  code?: string;
  districtId?: string;
  localUnitTypeId?: string;
  status?: StatusEnum;
}
export interface LocalUnitListRequest extends MasterListRequest {
  districtId?: string;
}

// ---- Local Unit Type ----
export interface LocalUnitTypeRequest {
  name: string;
  description?: string;
  status?: StatusEnum;
}
export type LocalUnitTypeListRequest = MasterListRequest;

// ---- Color (lucky / palette) ----
export interface ColorRequest {
  name: string;
  /** Hex like #DC2626 or DC2626 */
  hexCode: string;
  sortOrder?: number;
}

export interface ColorLocaleResponse {
  id?: string;
  language: string;
  name: string;
}

export interface ColorLocaleUpsertRequest {
  colorId: string;
  language: string;
  name: string;
}

export interface ColorResponse {
  id: string;
  name: string;
  hexCode: string;
  isSystem?: boolean;
  sortOrder?: number;
  status?: StatusEnum;
  createdAt?: string;
  lastModifiedAt?: string;
  /** Per-language display names from color_language. */
  locales?: ColorLocaleResponse[];
}

export type ColorListRequest = MasterListRequest;

// ---- Language ----
export interface LanguageRequest {
  name: string;
  /** Backend LanguageEnum / ISO 639-1 style code (e.g. EN, NE, HI). */
  code: string;
  nativeName: string;
  direction: 'LTR' | 'RTL';
  isDefault?: boolean;
  status?: StatusEnum;
}

export interface LanguageLocaleResponse {
  id?: string;
  language: string;
  name: string;
}

export interface LanguageLocaleUpsertRequest {
  languageId: string;
  language: string;
  name: string;
}

export interface LanguageResponse {
  id: string;
  name: string;
  code: string;
  nativeName?: string;
  direction?: 'LTR' | 'RTL';
  isDefault?: boolean;
  status?: StatusEnum;
  locales?: LanguageLocaleResponse[];
  createdAt?: string;
  lastModifiedAt?: string;
}

export type LanguageListRequest = MasterListRequest;

// ---- Nepali Calendar ----
export interface NepaliCalendarRequest {
  year: number;
  baishakhDay: number;
  jesthaDay: number;
  asarDay: number;
  shrawanDay: number;
  bhadraDay: number;
  ashojDay: number;
  kartikDay: number;
  mangsirDay: number;
  poushDay: number;
  maghDay: number;
  falgunDay: number;
  chaitraDay: number;
}

export type NepaliCalendarListRequest = MasterListRequest;

export interface NepaliCalendarResponse extends NepaliCalendarRequest {
  id: string;
  status?: StatusEnum;
  createdAt?: string;
  lastModifiedAt?: string;
}
