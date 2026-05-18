export type MeetingStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export type MeetingCallType = 'AUDIO' | 'VIDEO';

export interface MeetingResponse {
  id: string;
  title: string;
  description?: string;
  scheduledTime: string;
  durationMinutes: number;
  meetingCallType?: MeetingCallType;
  jitsiRoomId: string;
  /** Moderator join URL (legacy field; prefer jitsiModeratorJoinUrl). */
  jitsiRoomUrl: string;
  jitsiModeratorJoinUrl?: string;
  jitsiGuestJoinUrl?: string;
  /** True when join URLs include ?jwt= */
  jitsiJwtEnabled?: boolean;
  organizer: string;
  organizerUserId?: string;
  participants: string[];
  status: MeetingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AstrologerMeetingCreateRequest {
  title: string;
  description?: string;
  scheduledTime: string;
  durationMinutes: number;
  meetingCallType?: MeetingCallType;
  participants?: string[];
}

export interface GlobalMeetingResponse<T = unknown> {
  data?: T;
  message?: string;
  status?: string;
  code?: string;
}
