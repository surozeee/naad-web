/**
 * Ticket / FAQ / FAQ Category types for Support API. Base: /api/v2/support
 */

export type TicketStatusEnum =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type TicketPriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

export type TicketTypeEnum =
  | 'TECHNICAL_SUPPORT'
  | 'BUG_REPORT'
  | 'FEATURE_REQUEST'
  | 'ACCOUNT_ISSUE'
  | 'BILLING'
  | 'GENERAL_INQUIRY'
  | 'OTHER';

export type TicketChannelEnum =
  | 'EMAIL'
  | 'PHONE'
  | 'CHAT'
  | 'WEB_FORM'
  | 'MOBILE_APP'
  | 'SOCIAL_MEDIA'
  | 'IN_PERSON'
  | 'OTHER';

export type FaqTypeEnum =
  | 'GENERAL'
  | 'TECHNICAL'
  | 'BILLING'
  | 'ACCOUNT'
  | 'FEATURES'
  | 'TROUBLESHOOTING'
  | 'GETTING_STARTED'
  | 'OTHER';

export interface TicketRequest {
  subject: string;
  description: string;
  status: TicketStatusEnum;
  priority: TicketPriorityEnum;
  ticketType: TicketTypeEnum;
  channel: TicketChannelEnum;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  resolvedAt?: string;
  closedAt?: string;
  lastActivityAt?: string;
  assignedTo?: string;
  assignedAt?: string;
  reportedBy?: string;
  reporterEmail?: string;
  sourceIp?: string;
  userAgent?: string;
  browserInfo?: string;
  parentTicketId?: string;
  relatedTicketId?: string;
}

export interface TicketResponse {
  id: string;
  caseId?: string;
  subject: string;
  description: string;
  status: TicketStatusEnum;
  priority: TicketPriorityEnum;
  ticketType: TicketTypeEnum;
  channel: TicketChannelEnum;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  resolvedAt?: string;
  closedAt?: string;
  lastActivityAt?: string;
  assignedTo?: string;
  assignedAt?: string;
  reportedBy?: string;
  reporterEmail?: string;
  sourceIp?: string;
  userAgent?: string;
  browserInfo?: string;
  parentTicketId?: string;
  relatedTicketId?: string;
  createdAt?: string;
  lastModifiedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface FaqCategoryRequest {
  categoryName: string;
  description?: string;
  summary?: string;
  slug?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

export interface FaqCategoryResponse {
  id: string;
  categoryName: string;
  description?: string;
  summary?: string;
  slug?: string;
  iconUrl?: string;
  imageUrl?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  parentId?: string;
  parentCategoryName?: string;
  childrenIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  createdAt?: string;
  lastModifiedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface FaqRequest {
  question: string;
  answer: string;
  faqType: FaqTypeEnum;
  categoryId?: string;
  description?: string;
  summary?: string;
  keywords?: string;
  searchTags?: string;
  displayOrder?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  authorId?: string;
  lastReviewedAt?: string;
  lastReviewedBy?: string;
  reviewFrequencyDays?: number;
  nextReviewDate?: string;
  language?: string;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  relatedFaqIds?: string[];
}

export interface FaqResponse {
  id: string;
  question: string;
  answer: string;
  faqType: FaqTypeEnum;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  summary?: string;
  keywords?: string;
  searchTags?: string;
  viewCount?: number;
  helpfulCount?: number;
  notHelpfulCount?: number;
  lastViewedAt?: string;
  displayOrder?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  authorId?: string;
  lastReviewedAt?: string;
  lastReviewedBy?: string;
  reviewFrequencyDays?: number;
  nextReviewDate?: string;
  language?: string;
  averageRating?: number;
  ratingCount?: number;
  feedbackCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
  helpfulnessPercentage?: number;
  relatedFaqIds?: string[];
  createdAt?: string;
  lastModifiedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface PaginationRequest {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface SupportPaginationResponse<T> {
  totalElements?: number;
  totalElementCount?: number;
  result: T[];
}

export interface GlobalResponse<T = unknown> {
  status: string;
  code: string;
  data?: T;
  message?: string;
}
