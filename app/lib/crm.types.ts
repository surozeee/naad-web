/**
 * CRM API types for Music, Horoscope, Event entities (backend /api/v2/crm/).
 */

export type StatusEnum = 'ACTIVE' | 'INACTIVE' | string;

export interface CrmListRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  searchKey?: string;
}

// ---- Zodiac Sign (enum used by both Zodiac Sign and Horoscope Scope) ----
export type ZodiacSignEnum =
  | 'ARIES'
  | 'TAURUS'
  | 'GEMINI'
  | 'CANCER'
  | 'LEO'
  | 'VIRGO'
  | 'LIBRA'
  | 'SCORPIO'
  | 'SAGITTARIUS'
  | 'CAPRICORN'
  | 'AQUARIUS'
  | 'PISCES';

// ---- Horoscope Scope ----
export type HoroscopeScopeEnum =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUALLY'
  | 'YEARLY';

export interface HoroscopeScopeRequest {
  zodiacSign: ZodiacSignEnum;
  scope: HoroscopeScopeEnum;
  name: string;
  description?: string;
  locales?: HoroscopeScopeLocaleRequest[];
}

export interface HoroscopeScopeLocaleRequest {
  language: LanguageEnumCode;
  name: string;
  description: string;
}

export interface HoroscopeScopeListRequest extends CrmListRequest {
  zodiacSign?: ZodiacSignEnum;
  scope?: HoroscopeScopeEnum;
  status?: StatusEnum;
}

/** Backend LanguageEnum code (subset commonly used in admin UI). */
export type LanguageEnumCode = 'EN' | 'NE' | string;

export interface ZodiacSignLocaleRequest {
  language: LanguageEnumCode;
  name: string;
  startingName?: string;
}

export interface ZodiacSignLocaleResponse {
  id?: string;
  language: LanguageEnumCode;
  name: string;
  startingName?: string;
}

// ---- Zodiac Sign ----
export interface ZodiacSignRequest {
  name: string;
  zodiacSign: ZodiacSignEnum;
  description?: string;
  /** Logo image URL (when not uploading a new image). */
  logoUrl?: string;
  /** Optional base64 image from file select. When set, backend uploads and sets logoUrl. */
  logoImageBase64?: string;
  startingName?: string;
  daysRange?: string;
  /** Per-language display fields (stored in zodiac_sign_language). */
  locales?: ZodiacSignLocaleRequest[];
}

export interface ZodiacSignResponse {
  id: string;
  name: string;
  zodiacSign: ZodiacSignEnum;
  description?: string;
  logoUrl?: string;
  startingName?: string;
  daysRange?: string;
  status?: StatusEnum;
  createdAt?: string;
  lastModifiedAt?: string;
  locales?: ZodiacSignLocaleResponse[];
}

export interface ZodiacSignListRequest extends CrmListRequest {
  zodiacSign?: ZodiacSignEnum;
}

// ---- Horoscope (Event-Service) ----
export type HoroscopePeriodEnum = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUALLY' | 'YEARLY';

export interface HoroscopeLocaleRequest {
  language: LanguageEnumCode;
  prediction: string;
  luckyNumber: string;
  color: string;
  education: string;
  expense: string;
}

export interface HoroscopeRequest {
  zodiacSign: ZodiacSignEnum;
  periodId: string;
  prediction: string;
  luckyNumber: string;
  color: string;
  education: string;
  expense: string;
  locales?: HoroscopeLocaleRequest[];
}

export interface HoroscopeResponse extends HoroscopeRequest {
  id: string;
  period?: HoroscopePeriodEnum;
  periodName?: string;
  status?: StatusEnum;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface HoroscopeListRequest extends CrmListRequest {
  zodiacSign?: ZodiacSignEnum;
  periodId?: string;
  status?: StatusEnum;
}

export interface HoroscopePeriodRequest {
  name: string;
  horoscope: HoroscopePeriodEnum;
  description?: string;
}

export interface HoroscopePeriodResponse extends HoroscopePeriodRequest {
  id: string;
  status?: StatusEnum;
}

export interface HoroscopePeriodListRequest extends CrmListRequest {
  horoscope?: HoroscopePeriodEnum;
  status?: StatusEnum;
}

// ---- Music Type ----
/** type: one of Devotional Music, Mantras, Bhajans, Chants (backend MusicTypeEnum) */
export interface MusicTypeRequest {
  name: string;
  type: string;
  description?: string;
}

export interface MusicTypeListRequest extends CrmListRequest {
  /** ACTIVE | INACTIVE | DELETED; when not set, list returns all statuses */
  status?: StatusEnum;
}

// ---- Music ----
export interface MusicRequest {
  name: string;
  description?: string;
  mp3Url?: string;
  musicTypeId?: string;
}

/** Backend MusicTypeEnum: DEVOTIONAL, BHAJAN, MANTRA, KIRTAN, CLASSICAL, FOLK, INSTRUMENTAL, OTHER */
export type MusicTypeEnum = string;

export interface MusicListRequest extends CrmListRequest {
  musicTypeId?: string;
  /** Filter by type: e.g. DEVOTIONAL, BHAJAN, MANTRA */
  musicType?: MusicTypeEnum;
  /** ACTIVE | INACTIVE | DELETED; when not set, list returns all statuses */
  status?: StatusEnum;
}

// ---- Puja ----
export interface PujaRequest {
  name: string;
  description?: string;
}

export interface PujaListRequest extends CrmListRequest {}

// ---- Event Category ----
export interface EventCategoryRequest {
  name: string;
  description?: string;
}

export interface EventCategoryListRequest extends CrmListRequest {}

// ---- Category (parent-child) ----
export interface CategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface CategoryListRequest extends CrmListRequest {
  parentId?: string;
}

// ---- Item ----
export interface ItemRequest {
  name: string;
  description?: string;
  categoryId?: string;
  pujaId?: string;
}

export interface ItemListRequest extends CrmListRequest {
  categoryId?: string;
  pujaId?: string;
}

// ---- Event ----
export interface EventImageItemRequest {
  imageUrl: string;
  displayOrder: number;
}

export interface EventRequest {
  name: string;
  description?: string;
  startDate: string; // ISO datetime
  endDate: string;
  address?: string;
  categoryId?: string;
  images?: EventImageItemRequest[];
}

export interface EventListRequest extends CrmListRequest {
  categoryId?: string;
  status?: StatusEnum;
}

// ---- Event Image ----
export interface EventImageRequest {
  eventId: string;
  imageUrl: string;
  displayOrder: number;
}

export interface EventImageListRequest extends CrmListRequest {
  eventId?: string;
}
