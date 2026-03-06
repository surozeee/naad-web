'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Mail, MessageSquare, Bell, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { bulkSendService } from '@/app/lib/communication.service';
import { userApi, roleApi } from '@/app/lib/user-api.service';
import type { BulkSendRequest, BulkSendTargetType } from '@/app/lib/communication.types';
import type { UserResponse, RoleResponse } from '@/app/lib/user-api.types';

type ChannelTab = 'sms' | 'email' | 'notification';

const tabStyle = (active: boolean) => ({
  padding: '10px 18px',
  border: 'none',
  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
  background: active ? '#eff6ff' : 'transparent',
  color: active ? '#1d4ed8' : '#475569',
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  borderRadius: '8px 8px 0 0',
  marginBottom: -1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: '0.9375rem',
});

export default function BulkMessagePage() {
  const [activeTab, setActiveTab] = useState<ChannelTab>('email');
  const [targetType, setTargetType] = useState<BulkSendTargetType>('ALL');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [users, setUsers] = useState<{ id: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      const list = await roleApi.list({ pageNo: 0, pageSize: 500 });
      setRoles(list ?? []);
    } catch {
      setRoles([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const list = await userApi.list({ pageNo: 0, pageSize: 2000 });
      const arr = (list ?? []) as UserResponse[];
      setUsers(arr.map((u) => ({ id: String(u.id), label: (u.userDetail?.name || u.emailAddress || u.id) ?? '' })));
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'ROLE' && (!roleIds || roleIds.length === 0)) {
      Swal.fire({ icon: 'warning', title: 'Select at least one role.' });
      return;
    }
    if (targetType === 'SELECTED' && (!userIds || userIds.length === 0)) {
      Swal.fire({ icon: 'warning', title: 'Select at least one user.' });
      return;
    }
    if (activeTab === 'email' && (!emailSubject?.trim() || !emailBody?.trim())) {
      Swal.fire({ icon: 'warning', title: 'Email subject and body are required.' });
      return;
    }
    if (activeTab === 'sms' && !smsBody?.trim()) {
      Swal.fire({ icon: 'warning', title: 'SMS body is required.' });
      return;
    }
    if (activeTab === 'notification' && (!notificationTitle?.trim() || !notificationBody?.trim())) {
      Swal.fire({ icon: 'warning', title: 'Notification title and body are required.' });
      return;
    }

    const sendEmail = activeTab === 'email';
    const sendSms = activeTab === 'sms';
    const sendNotification = activeTab === 'notification';

    setSubmitting(true);
    try {
      const body: BulkSendRequest = {
        targetType,
        roleIds: targetType === 'ROLE' ? roleIds : undefined,
        userIds: targetType === 'SELECTED' ? userIds : undefined,
        sendEmail,
        sendSms,
        sendNotification,
        emailSubject: sendEmail ? emailSubject : undefined,
        emailBody: sendEmail ? emailBody : undefined,
        smsBody: sendSms ? smsBody : undefined,
        notificationTitle: sendNotification ? notificationTitle : undefined,
        notificationBody: sendNotification ? notificationBody : undefined,
      };
      const res = await bulkSendService.send(body);
      const data = res.data;
      const msg = [
        `Total users: ${data?.totalUsers ?? 0}`,
        sendEmail && `Email: ${data?.emailSent ?? 0} sent, ${data?.emailFailed ?? 0} failed`,
        sendSms && `SMS: ${data?.smsSent ?? 0} sent, ${data?.smsFailed ?? 0} failed`,
        sendNotification && `Notification: ${data?.notificationSent ?? 0} sent, ${data?.notificationFailed ?? 0} failed`,
      ]
        .filter(Boolean)
        .join('\n');
      Swal.fire({ icon: 'success', title: 'Bulk send completed', text: msg });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Bulk send failed', text: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '0.9375rem',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    background: '#fff',
    boxSizing: 'border-box',
  };

  return (
    <DashboardLayout>
      <div className="organization-page">
        <style>{`
          @keyframes bulk-msg-spin { to { transform: rotate(360deg); } }
          .bulk-msg-spin { animation: bulk-msg-spin 0.8s linear infinite; }
          .bulk-message-form input:focus,
          .bulk-message-form textarea:focus {
            outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          }
        `}</style>
        <Breadcrumb items={[{ label: 'Message Management', href: '/support' }, { label: 'Bulk Message' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={28} style={{ color: '#64748b' }} />
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Bulk Message</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Send SMS, email, or push notification to all users, by role, or selected users.
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <form onSubmit={handleSubmit} className="bulk-message-form">
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#fafbfc' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#334155', marginBottom: 10 }}>Send to</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {(['ALL', 'ROLE', 'SELECTED'] as const).map((t) => (
                  <label key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="radio" name="targetType" checked={targetType === t} onChange={() => setTargetType(t)} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                    <span style={{ fontSize: '0.9375rem', color: '#475569' }}>{t === 'ALL' ? 'All users' : t === 'ROLE' ? 'By role' : 'Selected users'}</span>
                  </label>
                ))}
              </div>
              {targetType === 'ROLE' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Roles</label>
                  <select multiple value={roleIds} onChange={(e) => setRoleIds(Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputBase, minHeight: 100 }}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name ?? r.id}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple.</p>
                </div>
              )}
              {targetType === 'SELECTED' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Users</label>
                  <select multiple value={userIds} onChange={(e) => setUserIds(Array.from(e.target.selectedOptions, (o) => o.value))} style={{ ...inputBase, minHeight: 100 }}>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.label || u.id}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple.</p>
                </div>
              )}
            </div>

            <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 1rem 0 0', gap: 4 }}>
              <button type="button" role="tab" aria-selected={activeTab === 'sms'} style={tabStyle(activeTab === 'sms')} onClick={() => setActiveTab('sms')}><MessageSquare size={18} /> SMS</button>
              <button type="button" role="tab" aria-selected={activeTab === 'email'} style={tabStyle(activeTab === 'email')} onClick={() => setActiveTab('email')}><Mail size={18} /> Email</button>
              <button type="button" role="tab" aria-selected={activeTab === 'notification'} style={tabStyle(activeTab === 'notification')} onClick={() => setActiveTab('notification')}><Bell size={18} /> Notification</button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {activeTab === 'sms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <MessageSquare size={20} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#334155' }}>SMS</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Message (plain text)</label>
                    <textarea placeholder="Enter SMS body…" value={smsBody} onChange={(e) => setSmsBody(e.target.value)} rows={4} style={{ ...inputBase, resize: 'vertical', minHeight: 100 }} />
                  </div>
                </div>
              )}
              {activeTab === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Mail size={20} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#334155' }}>Email</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Subject</label>
                    <input type="text" placeholder="Email subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} style={inputBase} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Body (HTML supported)</label>
                    <textarea placeholder="Email body…" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={5} style={{ ...inputBase, resize: 'vertical', minHeight: 140 }} />
                  </div>
                </div>
              )}
              {activeTab === 'notification' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Bell size={20} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#334155' }}>Push Notification</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Title</label>
                    <input type="text" placeholder="Notification title" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} style={inputBase} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Body</label>
                    <textarea placeholder="Notification body…" value={notificationBody} onChange={(e) => setNotificationBody(e.target.value)} rows={4} style={{ ...inputBase, resize: 'vertical', minHeight: 100 }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                <button type="submit" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.9375rem', fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.9 : 1, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                  {submitting ? <Loader2 size={18} className="bulk-msg-spin" /> : <Send size={18} />}
                  {submitting ? 'Sending…' : `Send ${activeTab === 'sms' ? 'SMS' : activeTab === 'email' ? 'Email' : 'Notification'}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
