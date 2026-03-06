/**
 * Communication API types: Message, Support Email, Bulk Send.
 * API base: /api/v2/communication
 */

export type MessageStatusEnum = 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'SCHEDULED' | 'DELIVER' | 'PAUSE' | 'FAILED';
export type MessageTopicEnum = string;
export type MessageChannelEnum = 'EMAIL' | 'SMS' | 'NOTIFICATION' | 'PUSH_NOTIFICATION';
export type MessageLanguageEnum = string;

export interface MessageDetailResponse {
  id: string;
  language?: MessageLanguageEnum;
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  notificationSubject?: string;
  notificationBody?: string;
}

export interface MessageResponse {
  id: string;
  topic?: MessageTopicEnum;
  status: MessageStatusEnum;
  language?: MessageLanguageEnum;
  enableSms?: boolean;
  enableEmail?: boolean;
  enableNotification?: boolean;
  channel?: MessageChannelEnum;
  details?: MessageDetailResponse[];
  createdAt?: string;
  lastModifiedAt?: string;
}

export interface MessageDetailRequest {
  language?: MessageLanguageEnum;
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  notificationSubject?: string;
  notificationBody?: string;
}

export interface MessageRequest {
  id?: string;
  topic?: MessageTopicEnum;
  status: MessageStatusEnum;
  language?: MessageLanguageEnum;
  enableSms?: boolean;
  enableEmail?: boolean;
  enableNotification?: boolean;
  channel?: MessageChannelEnum;
  details?: MessageDetailRequest[];
}

export interface MessageDataRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: string;
  topic?: MessageTopicEnum;
  language?: MessageLanguageEnum;
  status?: MessageStatusEnum;
  channel?: MessageChannelEnum;
}

export interface DatapaginationResponse<T = unknown> {
  totalElementCount?: number;
  totalElements?: number;
  result: T[];
}

export type BulkSendTargetType = 'ALL' | 'ROLE' | 'SELECTED';

export interface BulkSendRequest {
  targetType: BulkSendTargetType;
  roleIds?: string[];
  userIds?: string[];
  sendEmail: boolean;
  sendSms: boolean;
  sendNotification: boolean;
  emailSubject?: string;
  emailBody?: string;
  smsBody?: string;
  notificationTitle?: string;
  notificationBody?: string;
}

export interface BulkSendResultResponse {
  totalUsers: number;
  emailSent: number;
  emailFailed: number;
  smsSent: number;
  smsFailed: number;
  notificationSent: number;
  notificationFailed: number;
}

/** Support Email */
export interface SupportEmailRequest {
  email: string;
  name: string;
  mobileNumber?: string;
  isCompany: boolean;
  companyName?: string;
  address?: string;
  subject?: string;
  message?: string;
  recaptchaToken?: string;
}

export interface SupportEmailDataRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: string;
  email?: string;
  name?: string;
  isCompany?: boolean;
}

export interface SupportEmailReplyRequest {
  message: string;
}

export interface SupportEmailReplyResponse {
  id: string;
  message: string;
  createdAt: string;
}

export interface SupportEmailResponse {
  id: string;
  email: string;
  name: string;
  mobileNumber?: string;
  isCompany?: boolean;
  companyName?: string;
  address?: string;
  subject?: string;
  message?: string;
  createdAt: string;
  replies?: SupportEmailReplyResponse[];
}
