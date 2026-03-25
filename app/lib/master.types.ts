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

// ---- Language ----
export interface LanguageRequest {
  name: string;
  code?: string;
  status?: StatusEnum;
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
