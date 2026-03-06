/**
 * Setting / SettingCategory / SettingDetail API types.
 * Base: /api/v2/communication – SettingController, SettingCategoryController, SettingDetailController
 */

export interface SettingResponse {
  id: string;
  settingCode: string;
  name: string;
  description?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface SettingListRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: string;
  searchKey?: string;
}

export interface SettingCategoryResponse {
  id: string;
  categoryCode: string;
  name: string;
  description?: string;
  settingId: string;
  settingCode?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface SettingCategoryListRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: string;
  settingId?: string;
  searchKey?: string;
}

export interface SettingDetailResponse {
  id: string;
  key: string;
  value?: string;
  displayName?: string;
  settingCategoryId: string;
  settingCategoryCode?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface SettingDetailListRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: string;
  settingCategoryId?: string;
  searchKey?: string;
}

export interface SettingDetailItemRequest {
  key: string;
  value?: string;
  displayName?: string;
}

export interface SettingDetailBulkUpdateRequest {
  settingCategoryId: string;
  details: SettingDetailItemRequest[];
}

export interface DatapaginationResponse<T> {
  result?: T[];
  content?: T[];
  totalElements?: number;
}
