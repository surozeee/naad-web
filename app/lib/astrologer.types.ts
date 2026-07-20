/** Public astrologer directory + customer reviews */

export interface AstrologerPublicProfile {
  id: string;
  name: string;
  photoUrl?: string | null;
  bio?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  /** Latest reviews included by public list-active API (max 5). */
  reviews?: AstrologerReview[];
  reviewsFromSeed?: boolean;
}

export interface AstrologerReview {
  id: string;
  astrologerId: string;
  customerId?: string | null;
  meetingId?: string | null;
  customerDisplayName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
}

export interface AstrologerReviewCreateRequest {
  astrologerId: string;
  rating: number;
  comment?: string;
  meetingId?: string;
}

export interface AstrologerListRequest {
  pageNo?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
