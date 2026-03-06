/**
 * Types for User-Service API (/api/v2/user)
 * Matches backend DTOs: Menu, Permission, PermissionGroup, Role, User
 */

export type StatusEnum = 'ACTIVE' | 'INACTIVE' | string;

/** Backend TrueFalseEnum: TRUE / FALSE */
export type TrueFalseEnum = 'TRUE' | 'FALSE';

export type UserTypeEnum =
  | 'SUPER_ADMIN'
  | 'ORGANIZATION'
  | 'COMPANY_ADMIN'
  | 'EMPLOYEE'
  | 'CUSTOMER'
  | 'PARTNER'
  | string;

export type UserStatusEnum = 'ACTIVE' | 'BLOCKED' | 'INACTIVE' | 'DELETED' | 'LOCKED';

export interface MenuRequest {
  name: string;
  url?: string;
  code?: string;
  icon?: string;
  priority?: number;
  userType?: UserTypeEnum;
  hasChildMenu?: TrueFalseEnum;
  parentMenuId?: string;
  permissionIds?: string[];
}

export type LanguageEnum = string;

export interface MenuLocaleRequest {
  menuId: string;
  language: LanguageEnum;
  name: string;
}

export interface MenuLocaleResponse {
  id: string;
  menuId: string;
  language: LanguageEnum;
  name: string;
}

export interface MenuResponse {
  id: string;
  name: string;
  url?: string;
  code?: string;
  icon?: string;
  priority?: number;
  userType?: UserTypeEnum;
  hasChildMenu?: TrueFalseEnum;
  parentMenuId?: string;
  parentMenuName?: string;
  subMenu?: MenuResponse[];
  permissions?: PermissionResponse[];
  menuLocales?: MenuLocaleResponse[];
  status?: StatusEnum;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface PermissionRequest {
  name: string;
  code?: string;
  description?: string;
  status?: StatusEnum;
  permissionGroupId?: string;
}

export interface PermissionResponse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status?: StatusEnum;
  permissionGroupId?: string;
  permissionGroupName?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface PermissionGroupRequest {
  name: string;
  code?: string;
  description?: string;
  status?: StatusEnum;
  hasSubChild?: TrueFalseEnum;
  parentId?: string;
  permissionIds?: string[];
}

export interface PermissionGroupResponse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status?: StatusEnum;
  hasSubChild?: TrueFalseEnum;
  parentId?: string;
  parentName?: string;
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface PermissionGroupTreeResponse {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status?: StatusEnum;
  hasSubChild?: TrueFalseEnum;
  parentId?: string;
  parentName?: string;
  children?: PermissionGroupTreeResponse[];
  permissions?: PermissionResponse[];
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface RoleRequest {
  name: string;
  description?: string;
  status?: StatusEnum;
  permissionIds?: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  status?: StatusEnum;
  permissions?: PermissionResponse[];
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface UserDetailRequest {
  salutation?: string;
  gender?: string;
  name?: string;
  phoneNumber?: string;
  expiryDate?: string;
  roleType?: UserTypeEnum;
  language?: string;
  enable2FA?: boolean;
  country?: string;
  employeeCode?: string;
  userType?: UserTypeEnum;
  notifyTo?: string;
}

export interface UserRequest {
  emailAddress: string;
  mobileNumber?: string;
  password: string;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  enabled?: boolean;
  status?: UserStatusEnum;
  roleId: string;
  userDetail?: UserDetailRequest;
}

export interface UserDetailResponse {
  id?: string;
  name?: string;
  phoneNumber?: string;
  roleType?: string;
  userType?: string;
  status?: string;
}

export interface UserResponse {
  id: string;
  emailAddress?: string;
  mobileNumber?: string;
  accountNonExpired?: boolean;
  accountNonLocked?: boolean;
  credentialsNonExpired?: boolean;
  enabled?: boolean;
  status?: UserStatusEnum;
  roleId?: string;
  roleName?: string;
  createdAt?: string;
  lastModifiedAt?: string;
  userDetail?: UserDetailResponse;
}

export interface PaginationRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
}

export interface GlobalResponse<T = unknown> {
  data?: T;
  message?: string;
  status?: string;
  code?: string;
}

export interface PaginationResponse<T> {
  result?: T[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
}
