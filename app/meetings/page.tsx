'use client';

import { CSSProperties, FormEvent, Fragment, useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Mic,
  RefreshCw,
  Save,
  Search,
  Share2,
  Video,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { PageHeaderWithInfo } from '@/app/components/common/PageHeaderWithInfo';
import { meetingApi } from '@/app/lib/meeting-api.service';
import type { MeetingCallType, MeetingResponse } from '@/app/lib/meeting-api.types';

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusLabel(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return 'Scheduled';
    case 'ONGOING':
      return 'Ongoing';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

function moderatorJoinUrl(m: MeetingResponse) {
  return m.jitsiModeratorJoinUrl ?? m.jitsiRoomUrl;
}

function guestJoinUrl(m: MeetingResponse) {
  return m.jitsiGuestJoinUrl ?? m.jitsiRoomUrl;
}

function callTypeLabel(type?: MeetingCallType) {
  return type === 'AUDIO' ? 'Audio call' : 'Video call';
}

function joinUrlUsesJwt(url?: string | null) {
  return !!url && /[?&]jwt=/.test(url);
}

const JOIN_URL_DISPLAY_MAX = 88;

function formatJoinUrlDisplay(url: string, maxLength = JOIN_URL_DISPLAY_MAX) {
  const truncate = (text: string) =>
    text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

  try {
    const parsed = new URL(url);
    const token = parsed.searchParams.get('jwt');
    if (token && token.length > 12) {
      parsed.searchParams.set('jwt', `${token.slice(0, 6)}…${token.slice(-4)}`);
    }
    if (parsed.hash.length > 28) {
      parsed.hash = `${parsed.hash.slice(0, 24)}…`;
    }
    return truncate(parsed.toString());
  } catch {
    return truncate(url.replace(/([?&]jwt=)[^&#]+/, '$1…'));
  }
}

const joinUrlTextStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: '0.8rem',
  color: '#475569',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export default function MeetingsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState(() =>
    toLocalDateTimeInputValue(new Date(Date.now() + 15 * 60_000))
  );
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [meetingCallType, setMeetingCallType] = useState<MeetingCallType>('VIDEO');
  const [participants, setParticipants] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<MeetingResponse | null>(null);

  const [meetings, setMeetings] = useState<MeetingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MeetingResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const list = await meetingApi.listMine();
      setMeetings(list ?? []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  const handleShare = async (url: string, title?: string) => {
    try {
      await copyToClipboard(url);
      await Swal.fire({
        title: 'Link copied',
        text: title ? `Share link for "${title}" is on your clipboard.` : 'Meeting link is on your clipboard.',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        title: 'Copy failed',
        html: `<p style="word-break:break-all;margin:0">${url}</p>`,
        icon: 'info',
      });
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const participantList = participants
        .split(/[,;\n]/)
        .map((p) => p.trim())
        .filter(Boolean);

      const created = await meetingApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledTime: new Date(scheduledTime).toISOString(),
        durationMinutes,
        meetingCallType,
        participants: participantList,
      });

      setActiveMeeting(created);
      setTitle('');
      setDescription('');
      setParticipants('');
      setScheduledTime(toLocalDateTimeInputValue(new Date(Date.now() + 15 * 60_000)));
      await fetchMeetings();
      await Swal.fire({
        title: 'Meeting created',
        text: 'Room created from meeting name. Use moderator link for you and guest link for customers.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create meeting';
      setFormError(message);
      await Swal.fire({ title: 'Error', text: message, icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const data = await meetingApi.getById(id);
      setDetail(data);
    } catch (err) {
      setDetail(null);
      setListError(err instanceof Error ? err.message : 'Failed to load meeting detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = meetings.filter(
    (m) =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeModeratorUrl = activeMeeting ? moderatorJoinUrl(activeMeeting) : null;
  const activeGuestUrl = activeMeeting ? guestJoinUrl(activeMeeting) : null;

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'Meetings' }]} />
        <PageHeaderWithInfo
          title="Meetings"
          infoText="Choose audio or video. Join links include a JWT token (?jwt=…) for your Jitsi server—moderator and guest links use different tokens."
        >
          <button type="button" className="btn-secondary btn-small" onClick={() => void fetchMeetings()} disabled={loading}>
            <RefreshCw size={16} />
            <span>Refresh history</span>
          </button>
        </PageHeaderWithInfo>

        {(formError || listError) && (
          <div
            className="error-message"
            style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}
          >
            {formError || listError}
          </div>
        )}

        {activeMeeting && activeModeratorUrl && activeGuestUrl && (
          <section
            style={{
              marginBottom: 24,
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)',
              border: '1px solid #a7f3d0',
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#065f46' }}>Active meeting room</h2>
            <p style={{ margin: '0 0 4px', color: '#047857', fontWeight: 600 }}>
              {activeMeeting.title}
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: activeMeeting.meetingCallType === 'AUDIO' ? '#e0e7ff' : '#dbeafe',
                  color: activeMeeting.meetingCallType === 'AUDIO' ? '#3730a3' : '#1d4ed8',
                }}
              >
                {callTypeLabel(activeMeeting.meetingCallType)}
              </span>
              {(activeMeeting.jitsiJwtEnabled ?? joinUrlUsesJwt(activeModeratorUrl)) && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: '#fef3c7',
                    color: '#92400e',
                  }}
                >
                  JWT secured
                </span>
              )}
            </p>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748b' }}>
              Room name:{' '}
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>{activeMeeting.jitsiRoomId}</code>
            </p>

            <div style={{ marginBottom: 14, padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Moderator (you)</p>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#64748b' }}>
                {joinUrlUsesJwt(activeModeratorUrl) ? 'Signed join URL (moderator JWT)' : 'Join URL'}
              </p>
              <p style={joinUrlTextStyle} title={activeModeratorUrl}>
                {formatJoinUrlDisplay(activeModeratorUrl)}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <a
                  href={activeModeratorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Video size={16} />
                  <span>Join as moderator</span>
                </a>
                <button
                  type="button"
                  className="btn-secondary btn-small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => void handleShare(activeModeratorUrl, `${activeMeeting.title} (moderator)`)}
                >
                  <Share2 size={16} />
                  <span>Share moderator link</span>
                </button>
              </div>
            </div>

            <div style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>Guest (customer)</p>
              <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#64748b' }}>
                {joinUrlUsesJwt(activeGuestUrl) ? 'Signed join URL (guest JWT)' : 'Join URL'}
              </p>
              <p style={joinUrlTextStyle} title={activeGuestUrl}>
                {formatJoinUrlDisplay(activeGuestUrl)}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <a
                  href={activeGuestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Video size={16} />
                  <span>Preview guest join</span>
                </a>
                <button
                  type="button"
                  className="btn-primary btn-small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => void handleShare(activeGuestUrl, `${activeMeeting.title} (guest)`)}
                >
                  <Copy size={16} />
                  <span>Copy guest link</span>
                </button>
              </div>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: 12, color: '#0f172a' }}>Create Jitsi meeting</h2>
          <div className="table-container" style={{ padding: '1.25rem', maxWidth: 720 }}>
            <form onSubmit={handleCreate} className="organization-form">
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Title <span className="required">*</span>
                </label>
                <input
                  id="title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Consultation with client"
                  required
                />
              </div>

              <div className="form-group">
                <span className="form-label">Call type</span>
                <div role="radiogroup" aria-label="Call type" style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={meetingCallType === 'AUDIO'}
                    className={meetingCallType === 'AUDIO' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}
                    onClick={() => setMeetingCallType('AUDIO')}
                  >
                    <Mic size={16} />
                    Audio call
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={meetingCallType === 'VIDEO'}
                    className={meetingCallType === 'VIDEO' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}
                    onClick={() => setMeetingCallType('VIDEO')}
                  >
                    <Video size={16} />
                    Video call
                  </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {meetingCallType === 'AUDIO'
                    ? 'Participants join with microphone only; camera stays off.'
                    : 'Participants can enable camera and microphone from the prejoin screen.'}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <div>
                  <label htmlFor="scheduledTime" className="form-label">
                    Scheduled time <span className="required">*</span>
                  </label>
                  <input
                    id="scheduledTime"
                    type="datetime-local"
                    className="form-input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="durationMinutes" className="form-label">
                    Duration (min)
                  </label>
                  <input
                    id="durationMinutes"
                    type="number"
                    min={5}
                    max={480}
                    className="form-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="participants" className="form-label">
                  Participants (optional)
                </label>
                <textarea
                  id="participants"
                  className="form-input"
                  rows={2}
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Emails or names, separated by commas"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                  <Save size={16} />
                  <span>{submitting ? 'Creating room...' : 'Create & get room link'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.05rem', marginBottom: 12, color: '#0f172a' }}>Meeting history</h2>
          <div className="search-section">
            <div className="search-wrapper">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by title, description, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="table-container" style={{ padding: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Scheduled</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      <p>{meetings.length === 0 ? 'No meetings yet. Create your first room above.' : 'No matches found.'}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const isOpen = expandedId === row.id;
                    return (
                      <Fragment key={row.id}>
                        <tr>
                          <td>
                            <span className="org-name">{row.title}</span>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                              {callTypeLabel(row.meetingCallType)}
                            </div>
                          </td>
                          <td>{formatDateTime(row.scheduledTime)}</td>
                          <td>{row.durationMinutes} min</td>
                          <td>
                            <span
                              className={`status-badge ${
                                row.status === 'SCHEDULED' ? 'active' : row.status === 'CANCELLED' ? 'deleted' : 'inactive'
                              }`}
                            >
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn-icon-edit"
                                onClick={() => void toggleDetail(row.id)}
                                title="View details"
                              >
                                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                              {moderatorJoinUrl(row) && (
                                <>
                                  <a
                                    href={moderatorJoinUrl(row)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary btn-small"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}
                                    title="Moderator join"
                                  >
                                    <Video size={14} />
                                    Mod
                                  </a>
                                  <button
                                    type="button"
                                    className="btn-secondary btn-small"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}
                                    onClick={() => void handleShare(guestJoinUrl(row), `${row.title} (guest)`)}
                                    title="Copy guest link for customer"
                                  >
                                    <Share2 size={14} />
                                    Guest
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`${row.id}-detail`}>
                            <td colSpan={5} style={{ background: '#f8fafc', padding: '1rem 1.25rem' }}>
                              {detailLoading ? (
                                <p style={{ color: '#64748b', margin: 0 }}>Loading details...</p>
                              ) : detail && detail.id === row.id ? (
                                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                                  <p style={{ margin: 0 }}>
                                    <strong>Description:</strong> {detail.description || '—'}
                                  </p>
                                  <p style={{ margin: 0 }}>
                                    <strong>Call type:</strong> {callTypeLabel(detail.meetingCallType)}
                                  </p>
                                  <p style={{ margin: 0 }}>
                                    <strong>Room ID:</strong> {detail.jitsiRoomId}
                                  </p>
                                  <p style={{ margin: 0 }}>
                                    <strong>Participants:</strong>{' '}
                                    {detail.participants?.length ? detail.participants.join(', ') : 'None'}
                                  </p>
                                  <p style={{ margin: 0 }}>
                                    <strong>JWT:</strong>{' '}
                                    {detail.jitsiJwtEnabled ?? joinUrlUsesJwt(moderatorJoinUrl(detail))
                                      ? 'Yes (?jwt= on links)'
                                      : 'No'}
                                  </p>
                                  <p style={{ margin: 0 }}>
                                    <strong>Moderator URL:</strong>{' '}
                                    <a
                                      href={moderatorJoinUrl(detail)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={moderatorJoinUrl(detail)}
                                      style={joinUrlTextStyle}
                                    >
                                      {formatJoinUrlDisplay(moderatorJoinUrl(detail) ?? '')}
                                    </a>
                                  </p>
                                  <p style={{ margin: 0 }}>
                                    <strong>Guest URL:</strong>{' '}
                                    <a
                                      href={guestJoinUrl(detail)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={guestJoinUrl(detail)}
                                      style={joinUrlTextStyle}
                                    >
                                      {formatJoinUrlDisplay(guestJoinUrl(detail) ?? '')}
                                    </a>
                                  </p>
                                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <a
                                      href={moderatorJoinUrl(detail)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-primary btn-small"
                                    >
                                      <Video size={14} />
                                      Join (moderator)
                                    </a>
                                    <button
                                      type="button"
                                      className="btn-secondary btn-small"
                                      onClick={() => void handleShare(guestJoinUrl(detail), `${detail.title} (guest)`)}
                                    >
                                      <Share2 size={14} />
                                      Copy guest link
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ color: '#64748b', margin: 0 }}>Could not load meeting details.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
