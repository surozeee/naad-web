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

// ---- Horoscope Scope ----
export type HoroscopeScopeEnum =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUALLY'
  | 'YEARLY';

export interface HoroscopeScopeRequest {
  scope: HoroscopeScopeEnum;
  description?: string;
}

export interface HoroscopeScopeListRequest extends CrmListRequest {}

// ---- Zodiac Sign ----
export interface ZodiacSignRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  startingName?: string;
  horoscopeScopeId?: string;
}

export interface ZodiacSignListRequest extends CrmListRequest {
  horoscopeScopeId?: string;
}

// ---- Music Type ----
/** type: one of Devotional Music, Mantras, Bhajans, Chants (backend MusicTypeEnum) */
export interface MusicTypeRequest {
  name: string;
  type: string;
  description?: string;
}

export interface MusicTypeListRequest extends CrmListRequest {}

// ---- Music ----
export interface MusicRequest {
  name: string;
  description?: string;
  mp3Url?: string;
  /** Duration in seconds */
  durationSeconds?: number;
  musicTypeId?: string;
}

export interface MusicListRequest extends CrmListRequest {
  musicTypeId?: string;
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
