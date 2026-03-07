/**
 * Types for Customer list API.
 * Backend may return similar fields; extend when integrating real endpoint.
 */

export interface CustomerResponse {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNumber?: string;
  phone?: string;
  phoneNumber?: string;
  status?: string;
  createdAt?: string;
}

/** Payload for creating a customer (backend CustomerRequest). */
export interface CustomerCreateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber: string;
  dateOfBirth?: string;
  notes?: string;
}

export interface PaginationRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
}
