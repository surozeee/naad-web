'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Info,
  Eye,
  Copy,
  Mail,
  MessageSquare,
  Bell,
  FileText,
} from 'lucide-react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import Swal from 'sweetalert2';
import DashboardLayout from '@/app/components/DashboardLayout';
import Breadcrumb from '@/app/components/common/Breadcrumb';
import { RichTextEditor } from '@/app/components/common/RichTextEditor';
import { messageService } from '@/app/lib/communication.service';
import { languageApi } from '@/app/lib/master.service';
import type {
  MessageResponse,
  MessageRequest,
  MessageDetailRequest,
  MessageStatusEnum,
  MessageTopicEnum,
  MessageChannelEnum,
  MessageLanguageEnum,
} from '@/app/lib/communication.types';

interface Message extends MessageResponse {
  statusDisplay: 'active' | 'inactive';
}

function mapApiToMessage(raw: MessageResponse): Message {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    ...raw,
    statusDisplay: statusVal === 'ACTIVE' ? 'active' : 'inactive',
  };
}

const DEFAULT_PAGE_SIZE = 10;

export default function MessagingTemplatePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailMessage, setDetailMessage] = useState<Message | null>(null);
  const [previewMessage, setPreviewMessage] = useState<Message | null>(null);
  const [contentMessage, setContentMessage] = useState<Message | null>(null);
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentFormData, setContentFormData] = useState<MessageDetailRequest & { enableEmail?: boolean; enableSms?: boolean; enableNotification?: boolean }>({
    emailSubject: '',
    emailBody: '',
    smsBody: '',
    notificationSubject: '',
    notificationBody: '',
    enableEmail: false,
    enableSms: false,
    enableNotification: false,
  });
  type ContentTab = 'email' | 'sms' | 'notification';
  const [contentTab, setContentTab] = useState<ContentTab>('email');
  /** Index into contentMessage.details for the language being edited */
  const [contentSelectedDetailIndex, setContentSelectedDetailIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchMessages = useCallback(async (): Promise<Message[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await messageService.list({
        pageNo: currentPage - 1,
        pageSize: itemsPerPage,
        sortBy,
        direction: sortDirection,
      });
      const data = res.data;
      const list = (data?.result ?? []) as MessageResponse[];
      const mapped = list.map(mapApiToMessage);
      setMessages(mapped);
      setTotalCount(data?.totalElementCount ?? 0);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setMessages([]);
      setTotalCount(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortDirection]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const [formData, setFormData] = useState<MessageRequest & { detail?: MessageDetailRequest }>({
    status: 'ACTIVE',
    enableSms: false,
    enableEmail: false,
    enableNotification: false,
    details: [],
    detail: {
      emailSubject: '',
      emailBody: '',
      smsBody: '',
      notificationSubject: '',
      notificationBody: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('detail.')) {
      const key = name.replace('detail.', '');
      setFormData((prev) => ({
        ...prev,
        detail: { ...prev.detail, [key]: value } as MessageDetailRequest,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value === 'true' ? true : value === 'false' ? false : value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.topic?.trim()) newErrors.topic = 'Topic is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildRequest = (): MessageRequest => {
    const language = (formData.language?.trim() || 'EN') as MessageLanguageEnum;
    const detail: MessageDetailRequest = {
      language,
      emailSubject: formData.detail?.emailSubject,
      emailBody: formData.detail?.emailBody,
      smsBody: formData.detail?.smsBody,
      notificationSubject: formData.detail?.notificationSubject,
      notificationBody: formData.detail?.notificationBody,
    };
    return {
      id: editingId ?? undefined,
      topic: formData.topic as MessageTopicEnum,
      status: formData.status as MessageStatusEnum,
      language,
      enableSms: formData.enableSms ?? false,
      enableEmail: formData.enableEmail ?? false,
      enableNotification: formData.enableNotification ?? false,
      channel: formData.channel as MessageChannelEnum | undefined,
      details: [detail],
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    const topic = formData.topic ?? '';
    try {
      const body = buildRequest();
      if (editingId) {
        await messageService.update(editingId, body);
        await fetchMessages();
        setShowAddModal(false);
        resetForm();
      } else {
        await messageService.create(body);
        const updatedList = await fetchMessages();
        setShowAddModal(false);
        resetForm();
        const created = updatedList.find((m) => m.topic === topic && m.language === 'EN');
        if (created) {
          handleOpenContent(created);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      topic: '',
      language: '',
      status: 'ACTIVE',
      enableSms: false,
      enableEmail: false,
      enableNotification: false,
      details: [],
      detail: {
        emailSubject: '',
        emailBody: '',
        smsBody: '',
        notificationSubject: '',
        notificationBody: '',
      },
    });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (msg: Message) => {
    const firstDetail = msg.details?.[0];
    setFormData({
      id: msg.id,
      topic: msg.topic,
      status: msg.status,
      language: msg.language,
      enableSms: msg.enableSms ?? false,
      enableEmail: msg.enableEmail ?? false,
      enableNotification: msg.enableNotification ?? false,
      channel: msg.channel,
      details: msg.details ?? [],
      detail: firstDetail
        ? {
            language: firstDetail.language,
            emailSubject: firstDetail.emailSubject ?? '',
            emailBody: firstDetail.emailBody ?? '',
            smsBody: firstDetail.smsBody ?? '',
            notificationSubject: firstDetail.notificationSubject ?? '',
            notificationBody: firstDetail.notificationBody ?? '',
          }
        : {
            emailSubject: '',
            emailBody: '',
            smsBody: '',
            notificationSubject: '',
            notificationBody: '',
          },
    });
    setEditingId(msg.id);
    setShowAddModal(true);
  };

  const getEnabledContentTabs = (msg: Message | null): ContentTab[] => {
    if (!msg) return [];
    const all: { key: ContentTab; enabled: boolean }[] = [
      { key: 'email', enabled: msg.enableEmail ?? false },
      { key: 'sms', enabled: msg.enableSms ?? false },
      { key: 'notification', enabled: msg.enableNotification ?? false },
    ];
    const enabled = all.filter((t) => t.enabled).map((t) => t.key);
    return enabled.length > 0 ? enabled : (['email', 'sms', 'notification'] as ContentTab[]);
  };

  const handleOpenContent = (msg: Message) => {
    const details = msg.details ?? [];
    const firstDetail = details[0];
    setContentMessage(msg);
    const enabledTabs = getEnabledContentTabs(msg);
    setContentTab(enabledTabs[0] ?? 'email');
    setContentSelectedDetailIndex(0);
    setContentFormData({
      emailSubject: firstDetail?.emailSubject ?? '',
      emailBody: firstDetail?.emailBody ?? '',
      smsBody: firstDetail?.smsBody ?? '',
      notificationSubject: firstDetail?.notificationSubject ?? '',
      notificationBody: firstDetail?.notificationBody ?? '',
      enableEmail: msg.enableEmail ?? false,
      enableSms: msg.enableSms ?? false,
      enableNotification: msg.enableNotification ?? false,
    });
    setShowContentModal(true);
  };

  const switchContentLanguage = (index: number) => {
    if (!contentMessage?.details?.length || index < 0 || index >= contentMessage.details.length) return;
    setContentSelectedDetailIndex(index);
    const d = contentMessage.details[index];
    setContentFormData((prev) => ({
      ...prev,
      emailSubject: d.emailSubject ?? '',
      emailBody: d.emailBody ?? '',
      smsBody: d.smsBody ?? '',
      notificationSubject: d.notificationSubject ?? '',
      notificationBody: d.notificationBody ?? '',
    }));
  };

  const [addingDetailForId, setAddingDetailForId] = useState<string | null>(null);
  const [addDetailModalMessage, setAddDetailModalMessage] = useState<Message | null>(null);
  const [addDetailAvailableLanguages, setAddDetailAvailableLanguages] = useState<{ value: string; label: string }[]>([]);
  const [addDetailLanguagesLoading, setAddDetailLanguagesLoading] = useState(false);
  const [addDetailSelectedLanguage, setAddDetailSelectedLanguage] = useState<SingleValue<{ value: string; label: string }>>(null);
  const [addDetailCopyFromDetailId, setAddDetailCopyFromDetailId] = useState<SingleValue<{ value: string; label: string }>>(null);
  type AddDetailTab = 'email' | 'sms' | 'notification';
  const [addDetailTab, setAddDetailTab] = useState<AddDetailTab>('email');
  const [addDetailFormData, setAddDetailFormData] = useState<MessageDetailRequest>({
    emailSubject: '',
    emailBody: '',
    smsBody: '',
    notificationSubject: '',
    notificationBody: '',
  });

  useEffect(() => {
    if (!addDetailModalMessage) {
      setAddDetailAvailableLanguages([]);
      setAddDetailSelectedLanguage(null);
      setAddDetailCopyFromDetailId(null);
      setAddDetailFormData({
        emailSubject: '',
        emailBody: '',
        smsBody: '',
        notificationSubject: '',
        notificationBody: '',
      });
      return;
    }
    const existingCodes = new Set(
      (addDetailModalMessage.details ?? []).map((d) => (d.language ?? '').toUpperCase())
    );
    setAddDetailLanguagesLoading(true);
    setAddDetailSelectedLanguage(null);
    languageApi
      .list({ pageNo: 1, pageSize: 500 })
      .then((res) => {
        const items = (res.content ?? res.result ?? []) as Array<{ code?: string; name?: string; status?: string }>;
        const active = items.filter(
          (item) => String(item.status ?? '').toUpperCase() === 'ACTIVE'
        );
        const available = active
          .filter((item) => {
            const code = (item.code ?? '').toUpperCase();
            return code && !existingCodes.has(code);
          })
          .map((item) => ({
            value: (item.code ?? '').toUpperCase(),
            label: `${item.name ?? item.code ?? ''} (${(item.code ?? '').toUpperCase()})`,
          }));
        setAddDetailAvailableLanguages(available);
      })
      .catch(() => setAddDetailAvailableLanguages([]))
      .finally(() => setAddDetailLanguagesLoading(false));
  }, [addDetailModalMessage]);

  useEffect(() => {
    if (!addDetailModalMessage) return;
    const copyId = addDetailCopyFromDetailId?.value;
    if (!copyId) {
      setAddDetailFormData({
        emailSubject: '',
        emailBody: '',
        smsBody: '',
        notificationSubject: '',
        notificationBody: '',
      });
      return;
    }
    const detail = (addDetailModalMessage.details ?? []).find((d) => d.id === copyId);
    if (detail) {
      setAddDetailFormData({
        emailSubject: detail.emailSubject ?? '',
        emailBody: detail.emailBody ?? '',
        smsBody: detail.smsBody ?? '',
        notificationSubject: detail.notificationSubject ?? '',
        notificationBody: detail.notificationBody ?? '',
      });
    }
  }, [addDetailModalMessage, addDetailCopyFromDetailId]);

  const getEnabledDetailTabs = (msg: Message | null): AddDetailTab[] => {
    if (!msg) return [];
    const all: { key: AddDetailTab; enabled: boolean }[] = [
      { key: 'email', enabled: msg.enableEmail ?? false },
      { key: 'sms', enabled: msg.enableSms ?? false },
      { key: 'notification', enabled: msg.enableNotification ?? false },
    ];
    const enabled = all.filter((t) => t.enabled).map((t) => t.key);
    return enabled.length > 0 ? enabled : (['email', 'sms', 'notification'] as AddDetailTab[]);
  };

  const handleOpenAddDetailModal = (msg: Message) => {
    setAddDetailModalMessage(msg);
    const enabled = getEnabledDetailTabs(msg);
    setAddDetailTab(enabled[0] ?? 'email');
  };

  const handleAddDetailModalSubmit = async () => {
    if (!addDetailModalMessage || !addDetailSelectedLanguage) return;
    const languageCode = addDetailSelectedLanguage.value;
    const detailBody: MessageDetailRequest = {
      language: languageCode,
      emailSubject: addDetailFormData.emailSubject || undefined,
      emailBody: addDetailFormData.emailBody || undefined,
      smsBody: addDetailFormData.smsBody || undefined,
      notificationSubject: addDetailFormData.notificationSubject || undefined,
      notificationBody: addDetailFormData.notificationBody || undefined,
    };
    setAddingDetailForId(addDetailModalMessage.id);
    setError(null);
    try {
      await messageService.createDetail(addDetailModalMessage.id, detailBody);
      setAddDetailModalMessage(null); // close add-detail modal right after adding
      const res = await messageService.getById(addDetailModalMessage.id);
      const updated = res.data;
      await fetchMessages();
      if (updated) {
        const refreshedMsg = mapApiToMessage(updated as MessageResponse);
        const newDetails = refreshedMsg.details ?? [];
        const newIndex = newDetails.length - 1;
        setContentMessage(refreshedMsg);
        setContentSelectedDetailIndex(newIndex);
        setContentTab('email');
        setContentFormData({
          emailSubject: '',
          emailBody: '',
          smsBody: '',
          notificationSubject: '',
          notificationBody: '',
          enableEmail: refreshedMsg.enableEmail ?? false,
          enableSms: refreshedMsg.enableSms ?? false,
          enableNotification: refreshedMsg.enableNotification ?? false,
        });
        setShowContentModal(true);
        await Swal.fire({
          title: 'Added',
          text: `Language "${languageCode}" added. Add content for this language below.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message detail');
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Failed to add message detail',
        icon: 'error',
      });
    } finally {
      setAddingDetailForId(null);
    }
  };

  const handleContentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'enableEmail' || name === 'enableSms' || name === 'enableNotification') {
      setContentFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setContentFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentMessage) return;
    const details = contentMessage.details ?? [];
    const currentDetail = details[contentSelectedDetailIndex];
    if (!currentDetail?.id) {
      setError('No message detail found to update.');
      return;
    }
    setContentSubmitting(true);
    setError(null);
    try {
      await messageService.updateDetail(currentDetail.id, {
        language: currentDetail.language,
        emailSubject: contentFormData.emailSubject || undefined,
        emailBody: contentFormData.emailBody || undefined,
        smsBody: contentFormData.smsBody || undefined,
        notificationSubject: contentFormData.notificationSubject || undefined,
        notificationBody: contentFormData.notificationBody || undefined,
      });
      await messageService.update(contentMessage.id, {
        id: contentMessage.id,
        topic: contentMessage.topic,
        status: contentMessage.status,
        language: contentMessage.language,
        enableEmail: contentFormData.enableEmail ?? false,
        enableSms: contentFormData.enableSms ?? false,
        enableNotification: contentFormData.enableNotification ?? false,
        details: [],
      });
      await fetchMessages();
      setShowContentModal(false);
      setContentMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setContentSubmitting(false);
    }
  };

  const resetContentForm = () => {
    setContentFormData({
      emailSubject: '',
      emailBody: '',
      smsBody: '',
      notificationSubject: '',
      notificationBody: '',
      enableEmail: false,
      enableSms: false,
      enableNotification: false,
    });
    setContentMessage(null);
  };

  const handleChangeStatus = async (msg: Message) => {
    const newStatus: MessageStatusEnum = msg.statusDisplay === 'active' ? 'INACTIVE' : 'ACTIVE';
    const newLabel = newStatus === 'ACTIVE' ? 'Active' : 'Inactive';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set this message template to <strong>${newLabel}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'No',
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;
    setError(null);
    try {
      await messageService.changeStatus(msg.id, newStatus);
      await fetchMessages();
      await Swal.fire({
        title: 'Updated',
        text: 'Status updated successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed');
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Status update failed',
        icon: 'error',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete message template?',
      text: 'Are you sure you want to delete this template?',
      icon: 'warning',
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;
    setError(null);
    try {
      await messageService.delete(id);
      await fetchMessages();
      await Swal.fire({
        title: 'Deleted',
        text: 'Message template deleted successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Delete failed',
        icon: 'error',
      });
    }
  };

  const handlePreview = (msg: Message) => {
    setPreviewMessage(msg);
    setShowPreviewModal(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    Swal.fire({ title: 'Copied', text: 'Copied to clipboard.', icon: 'success', timer: 1000, showConfirmButton: false });
  };

  const filteredMessages = messages.filter(
    (msg) =>
      !searchTerm ||
      String(msg.topic ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleChannel = async (
    msg: Message,
    field: 'enableEmail' | 'enableSms' | 'enableNotification'
  ) => {
    const newValue = !(msg[field] ?? false);
    setError(null);
    try {
      await messageService.update(msg.id, {
        id: msg.id,
        topic: msg.topic,
        status: msg.status,
        language: msg.language ?? 'EN',
        enableEmail: field === 'enableEmail' ? newValue : (msg.enableEmail ?? false),
        enableSms: field === 'enableSms' ? newValue : (msg.enableSms ?? false),
        enableNotification: field === 'enableNotification' ? newValue : (msg.enableNotification ?? false),
        details: [],
      });
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortableTh = ({
    columnKey,
    children,
  }: {
    columnKey: string;
    children: React.ReactNode;
  }) => (
    <th
      role="button"
      tabIndex={0}
      onClick={() => handleSort(columnKey)}
      onKeyDown={(e) => e.key === 'Enter' && handleSort(columnKey)}
      className="sortable-th"
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortBy === columnKey ? (
          sortDirection === 'asc' ? (
            <ChevronUp size={14} color="#2563eb" strokeWidth={2.4} />
          ) : (
            <ChevronDown size={14} color="#2563eb" strokeWidth={2.4} />
          )
        ) : (
          <ArrowUpDown size={14} color="#94a3b8" strokeWidth={1.9} />
        )}
      </span>
    </th>
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
    <div className="organization-page">
      <Breadcrumb
        items={[
          { label: 'Message Management', href: '/support' },
          { label: 'Message Template' },
        ]}
      />

      <div className="page-header-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Message Template
            </h1>
          </div>
          <div
            style={{ marginTop: -6, position: 'relative' }}
            onMouseEnter={() => setShowInfoTooltip(true)}
            onMouseLeave={() => setShowInfoTooltip(false)}
          >
            <button
              type="button"
              aria-label="Message template information"
              style={{
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                padding: 2,
                borderRadius: 999,
                cursor: 'help',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
              }}
            >
              <Info size={18} />
            </button>
            {showInfoTooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 'calc(100% + 10px)',
                  transform: 'translateY(-50%)',
                  zIndex: 1200,
                  width: 280,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #dbe2ea',
                  background: '#ffffff',
                  color: '#334155',
                  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
                  fontSize: 12,
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -6,
                    top: '50%',
                    width: 10,
                    height: 10,
                    background: '#ffffff',
                    borderLeft: '1px solid #dbe2ea',
                    borderBottom: '1px solid #dbe2ea',
                    transform: 'translateY(-50%) rotate(45deg)',
                  }}
                />
                Create and manage message templates for emails, SMS, and notifications.
              </div>
            )}
          </div>
        </div>
        <button
          className="btn-primary btn-small"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      {error && (
        <div
          className="error-message"
          style={{
            marginBottom: 16,
            padding: 12,
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      <div className="search-section">
        <div className="search-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by topic..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table country-data-table">
          <thead>
            <tr>
              <SortableTh columnKey="topic">Topic</SortableTh>
              <th>Email</th>
              <th>SMS</th>
              <th>Notification</th>
              <SortableTh columnKey="status">Status</SortableTh>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  Loading templates...
                </td>
              </tr>
            ) : filteredMessages.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <p>No templates found</p>
                  {!searchTerm && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                      }}
                    >
                      <Plus size={20} />
                      <span>Add First Template</span>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredMessages.map((msg) => (
                <tr
                  key={msg.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailMessage(msg)}
                  onKeyDown={(e) => e.key === 'Enter' && setDetailMessage(msg)}
                  className="data-table-row-clickable"
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="org-name-cell">
                      <FileCode size={20} className="org-icon" />
                      <div>
                        <div className="org-name">{msg.topic ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleChannel(msg, 'enableEmail');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleToggleChannel(msg, 'enableEmail');
                    }}
                    title={msg.enableEmail ? 'Disable Email' : 'Enable Email'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className={`status-badge ${msg.enableEmail ? 'active' : 'inactive'}`}
                      style={{ minWidth: 36, justifyContent: 'center' }}
                    >
                      {msg.enableEmail ? <Check size={14} /> : <X size={14} />}
                      <Mail size={14} />
                    </span>
                  </td>
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleChannel(msg, 'enableSms');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleToggleChannel(msg, 'enableSms');
                    }}
                    title={msg.enableSms ? 'Disable SMS' : 'Enable SMS'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className={`status-badge ${msg.enableSms ? 'active' : 'inactive'}`}
                      style={{ minWidth: 36, justifyContent: 'center' }}
                    >
                      {msg.enableSms ? <Check size={14} /> : <X size={14} />}
                      <MessageSquare size={14} />
                    </span>
                  </td>
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleChannel(msg, 'enableNotification');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleToggleChannel(msg, 'enableNotification');
                    }}
                    title={msg.enableNotification ? 'Disable Notification' : 'Enable Notification'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className={`status-badge ${msg.enableNotification ? 'active' : 'inactive'}`}
                      style={{ minWidth: 36, justifyContent: 'center' }}
                    >
                      {msg.enableNotification ? <Check size={14} /> : <X size={14} />}
                      <Bell size={14} />
                    </span>
                  </td>
                  <td
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeStatus(msg);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') handleChangeStatus(msg);
                    }}
                    title={`Set to ${msg.statusDisplay === 'active' ? 'Inactive' : 'Active'}`}
                  >
                    <span className={`status-badge ${msg.statusDisplay}`}>
                      {msg.statusDisplay === 'active' ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      <span>
                        {msg.statusDisplay === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons" style={{ flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn-icon-view"
                        title="Add message detail (language)"
                        onClick={() => handleOpenAddDetailModal(msg)}
                        disabled={addingDetailForId === msg.id}
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        className="btn-icon-view"
                        title="Content (Email, SMS, Notification)"
                        onClick={() => handleOpenContent(msg)}
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        className="btn-icon-view"
                        title="Preview"
                        onClick={() => handlePreview(msg)}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon-edit"
                        title="Edit template"
                        onClick={() => handleEdit(msg)}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="btn-icon-delete"
                        title="Delete"
                        onClick={() => handleDelete(msg.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {totalCount > 0 && (
            <tfoot>
              <tr>
                <td colSpan={6}>
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <label htmlFor="items-per-page-message" className="pagination-label">
                        Show:
                      </label>
                      <select
                        id="items-per-page-message"
                        className="pagination-select"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="pagination-label">per page</span>
                    </div>
                    <div className="pagination-info">
                      Showing {startIndex + 1} to {startIndex + filteredMessages.length} of {totalCount} templates
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                      </button>
                      <div className="pagination-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            );
                          }
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="pagination-ellipsis">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <span>Next</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {detailMessage && (
        <div className="modal-overlay" onClick={() => setDetailMessage(null)}>
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Message Template Detail</h2>
              <button className="modal-close-btn" onClick={() => setDetailMessage(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="organization-form" style={{ gap: '0.5rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 14,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Topic</label>
                  <p style={{ margin: 0, padding: '8px 0', fontWeight: 500 }}>{detailMessage.topic ?? '—'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    <span className={`status-badge ${detailMessage.statusDisplay}`}>
                      {detailMessage.statusDisplay === 'active' ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      <span>{detailMessage.statusDisplay === 'active' ? 'Active' : 'Inactive'}</span>
                    </span>
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{detailMessage.enableEmail ? 'Yes' : 'No'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">SMS</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{detailMessage.enableSms ? 'Yes' : 'No'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Notification</label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{detailMessage.enableNotification ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setDetailMessage(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary btn-small"
                  onClick={() => {
                    handleEdit(detailMessage);
                    setDetailMessage(null);
                    setShowAddModal(true);
                  }}
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: 560, width: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingId ? 'Edit Template' : 'New Message Template'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="organization-form">
              <div className="form-group">
                <label htmlFor="topic" className="form-label">
                  Topic <span className="required">*</span>
                </label>
                <p className="form-description" style={{ margin: '0 0 8px 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                  A unique identifier for when this template is used (e.g. REGISTER, FORGOT_PASSWORD, OTP). Use UPPERCASE with underscores.
                </p>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic ?? ''}
                  onChange={handleInputChange}
                  className={`form-input ${errors.topic ? 'error' : ''}`}
                  placeholder="e.g. REGISTER, FORGOT_PASSWORD"
                />
                {errors.topic && <span className="form-error">{errors.topic}</span>}
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <span className="form-label" style={{ display: 'block', marginBottom: 8 }}>Delivery channels</span>
                <p className="form-description" style={{ margin: '0 0 12px 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                  Choose which channels will be used for this template. You can edit subject and body per channel in the content step.
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                  }}
                >
                  <label
                    htmlFor="template-enableEmail"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: 16,
                      borderRadius: 12,
                      border: `2px solid ${formData.enableEmail ? '#2563eb' : '#e2e8f0'}`,
                      background: formData.enableEmail ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        id="template-enableEmail"
                        name="enableEmail"
                        checked={!!formData.enableEmail}
                        onChange={(e) => setFormData((p) => ({ ...p, enableEmail: e.target.checked }))}
                        style={{ width: 18, height: 18, margin: 0 }}
                      />
                      <Mail size={20} style={{ color: formData.enableEmail ? '#2563eb' : '#64748b' }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Email</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                      Send template content by email (subject + body).
                    </span>
                  </label>
                  <label
                    htmlFor="template-enableSms"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: 16,
                      borderRadius: 12,
                      border: `2px solid ${formData.enableSms ? '#2563eb' : '#e2e8f0'}`,
                      background: formData.enableSms ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        id="template-enableSms"
                        name="enableSms"
                        checked={!!formData.enableSms}
                        onChange={(e) => setFormData((p) => ({ ...p, enableSms: e.target.checked }))}
                        style={{ width: 18, height: 18, margin: 0 }}
                      />
                      <MessageSquare size={20} style={{ color: formData.enableSms ? '#2563eb' : '#64748b' }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>SMS</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                      Send template as a short text message.
                    </span>
                  </label>
                  <label
                    htmlFor="template-enableNotification"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: 16,
                      borderRadius: 12,
                      border: `2px solid ${formData.enableNotification ? '#2563eb' : '#e2e8f0'}`,
                      background: formData.enableNotification ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        id="template-enableNotification"
                        name="enableNotification"
                        checked={!!formData.enableNotification}
                        onChange={(e) => setFormData((p) => ({ ...p, enableNotification: e.target.checked }))}
                        style={{ width: 18, height: 18, margin: 0 }}
                      />
                      <Bell size={20} style={{ color: formData.enableNotification ? '#2563eb' : '#64748b' }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Notification</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                      Show in-app or push notifications (subject + body).
                    </span>
                  </label>
                </div>
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addDetailModalMessage && (
        <div
          className="modal-overlay"
          onClick={() => setAddDetailModalMessage(null)}
        >
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: 640, width: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Message content: {addDetailModalMessage.topic ?? 'Template'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setAddDetailModalMessage(null)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="organization-form">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  borderBottom: '1px solid #e2e8f0',
                  marginBottom: 16,
                }}
              >
                <div role="tablist" style={{ display: 'flex', gap: 0 }}>
                  {[
                    { key: 'email' as const, label: 'Email', icon: Mail, enabled: addDetailModalMessage.enableEmail ?? false },
                    { key: 'sms' as const, label: 'SMS', icon: MessageSquare, enabled: addDetailModalMessage.enableSms ?? false },
                    { key: 'notification' as const, label: 'Notification', icon: Bell, enabled: addDetailModalMessage.enableNotification ?? false },
                  ]
                    .filter((t) => t.enabled)
                    .map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={addDetailTab === key}
                      onClick={() => setAddDetailTab(key)}
                      style={{
                        display: 'inline-flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 20px',
                        border: 'none',
                        borderBottom: addDetailTab === key ? '2px solid #2563eb' : '2px solid transparent',
                        background: addDetailTab === key ? '#eff6ff' : 'transparent',
                        color: addDetailTab === key ? '#1d4ed8' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: addDetailTab === key ? 600 : 500,
                        fontSize: 14,
                        marginBottom: -1,
                      }}
                    >
                      <Icon size={20} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {addDetailLanguagesLoading ? (
                    <span style={{ fontSize: 13, color: '#64748b' }}>Loading...</span>
                  ) : addDetailAvailableLanguages.length === 0 ? (
                    <span style={{ fontSize: 13, color: '#64748b' }}>No languages available</span>
                  ) : (
                    <div style={{ minWidth: 120 }}>
                      <Select<{ value: string; label: string }>
                        options={addDetailAvailableLanguages}
                        value={addDetailSelectedLanguage}
                        onChange={setAddDetailSelectedLanguage}
                        placeholder="Language"
                        isSearchable
                        classNamePrefix="selectpicker"
                        className="selectpicker-wrapper"
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                        menuPosition="fixed"
                        styles={{
                          control: (base) => ({ ...base, minHeight: 40, height: 40, borderColor: '#e2e8f0' }),
                          valueContainer: (base) => ({ ...base, height: 40, padding: '0 10px' }),
                          indicatorsContainer: (base) => ({ ...base, height: 40 }),
                          menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {(addDetailModalMessage.details?.length ?? 0) > 0 && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Copy content from (optional)</label>
                  <Select<{ value: string; label: string }>
                    options={[
                      { value: '', label: 'None' },
                      ...(addDetailModalMessage.details ?? []).map((d) => ({
                        value: d.id,
                        label: d.language ?? `Language (${d.id})`,
                      })),
                    ]}
                    value={addDetailCopyFromDetailId}
                    onChange={setAddDetailCopyFromDetailId}
                    placeholder="None"
                    isSearchable={false}
                    classNamePrefix="selectpicker"
                    className="selectpicker-wrapper"
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{
                      control: (base) => ({ ...base, minHeight: 42 }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                  />
                </div>
              )}

              {addDetailTab === 'email' && ((addDetailModalMessage.enableEmail ?? false) || getEnabledDetailTabs(addDetailModalMessage).length >= 3) && (
                <div role="tabpanel" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Email subject</label>
                    <input
                      type="text"
                      value={addDetailFormData.emailSubject ?? ''}
                      onChange={(e) => setAddDetailFormData((p) => ({ ...p, emailSubject: e.target.value }))}
                      className="form-input"
                      placeholder="e.g. Welcome to the app"
                    />
                  </div>
                  <div className="form-group">
                    <RichTextEditor
                      label="Email body"
                      value={addDetailFormData.emailBody ?? ''}
                      onChange={(html) => setAddDetailFormData((p) => ({ ...p, emailBody: html }))}
                      placeholder="Use variables like {{user_name}}"
                      minHeight={200}
                    />
                  </div>
                </div>
              )}

              {addDetailTab === 'sms' && ((addDetailModalMessage.enableSms ?? false) || getEnabledDetailTabs(addDetailModalMessage).length >= 3) && (
                <div role="tabpanel" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <RichTextEditor
                      label="SMS body"
                      value={addDetailFormData.smsBody ?? ''}
                      onChange={(html) => setAddDetailFormData((p) => ({ ...p, smsBody: html }))}
                      placeholder="Short message text"
                      minHeight={120}
                    />
                  </div>
                </div>
              )}

              {addDetailTab === 'notification' && ((addDetailModalMessage.enableNotification ?? false) || getEnabledDetailTabs(addDetailModalMessage).length >= 3) && (
                <div role="tabpanel" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Notification subject</label>
                    <input
                      type="text"
                      value={addDetailFormData.notificationSubject ?? ''}
                      onChange={(e) => setAddDetailFormData((p) => ({ ...p, notificationSubject: e.target.value }))}
                      className="form-input"
                      placeholder="Notification title"
                    />
                  </div>
                  <div className="form-group">
                    <RichTextEditor
                      label="Notification body"
                      value={addDetailFormData.notificationBody ?? ''}
                      onChange={(html) => setAddDetailFormData((p) => ({ ...p, notificationBody: html }))}
                      placeholder="Notification body"
                      minHeight={160}
                    />
                  </div>
                </div>
              )}

              <div className="form-actions" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAddDetailModalMessage(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary btn-small"
                  disabled={!addDetailSelectedLanguage || addingDetailForId === addDetailModalMessage.id}
                  onClick={handleAddDetailModalSubmit}
                >
                  {addingDetailForId === addDetailModalMessage.id ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContentModal && contentMessage && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowContentModal(false);
            resetContentForm();
          }}
        >
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: 640, width: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Message content: {contentMessage.topic ?? 'Template'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowContentModal(false);
                  resetContentForm();
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleContentSubmit} className="organization-form">
              {(() => {
                const details = contentMessage.details ?? [];
                const contentTabConfig = [
                  { key: 'email' as const, label: 'Email', icon: Mail, enabled: contentMessage.enableEmail ?? false },
                  { key: 'sms' as const, label: 'SMS', icon: MessageSquare, enabled: contentMessage.enableSms ?? false },
                  { key: 'notification' as const, label: 'Notification', icon: Bell, enabled: contentMessage.enableNotification ?? false },
                ] as const;
                const enabledTabs = contentTabConfig.filter((t) => t.enabled);
                const tabsToShow = enabledTabs.length > 0 ? enabledTabs : contentTabConfig;
                const activeTab = contentTab;
                return (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: 16,
                      }}
                    >
                      <div role="tablist" style={{ display: 'flex', gap: 0 }}>
                        {tabsToShow.map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === key}
                            onClick={() => setContentTab(key)}
                            style={{
                              display: 'inline-flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              padding: '12px 20px',
                              border: 'none',
                              borderBottom: activeTab === key ? '2px solid #2563eb' : '2px solid transparent',
                              background: activeTab === key ? '#eff6ff' : 'transparent',
                              color: activeTab === key ? '#1d4ed8' : '#64748b',
                              cursor: 'pointer',
                              fontWeight: activeTab === key ? 600 : 500,
                              fontSize: 14,
                              marginBottom: -1,
                            }}
                          >
                            <Icon size={20} />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {details.length > 0 ? (
                          (() => {
                            const languageOptions = details.map((d, idx) => ({
                              value: idx,
                              label: d.language ?? `Language ${idx + 1}`,
                            }));
                            const languageValue = languageOptions[contentSelectedDetailIndex] ?? languageOptions[0];
                            return (
                              <div style={{ minWidth: 120 }}>
                                <Select<{ value: number; label: string }>
                                  options={languageOptions}
                                  value={languageValue}
                                  onChange={(opt: SingleValue<{ value: number; label: string }>) => {
                                    if (opt != null) switchContentLanguage(opt.value);
                                  }}
                                  isSearchable={false}
                                  classNamePrefix="selectpicker"
                                  className="selectpicker-wrapper"
                                  menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                                  menuPosition="fixed"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      minHeight: 40,
                                      height: 40,
                                      borderColor: '#e2e8f0',
                                    }),
                                    valueContainer: (base) => ({
                                      ...base,
                                      height: 40,
                                      padding: '0 10px',
                                    }),
                                    indicatorsContainer: (base) => ({
                                      ...base,
                                      height: 40,
                                    }),
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 1000000,
                                    }),
                                  }}
                                />
                              </div>
                            );
                          })()
                        ) : (
                          <span style={{ fontSize: 13, color: '#64748b' }}>No languages yet. Use &quot;Add message detail&quot; in the table row to add a language.</span>
                        )}
                      </div>
                    </div>
                    {activeTab === 'email' && ((contentMessage.enableEmail ?? false) || tabsToShow.length >= 3) && (
                      <div role="tabpanel" style={{ marginBottom: 16 }}>
                        <div className="form-group">
                          <label htmlFor="content-emailSubject" className="form-label">Email subject</label>
                          <input
                            type="text"
                            id="content-emailSubject"
                            name="emailSubject"
                            value={contentFormData.emailSubject ?? ''}
                            onChange={handleContentInputChange}
                            className="form-input"
                            placeholder="e.g. Welcome to the app"
                          />
                        </div>
                        <div className="form-group">
                          <RichTextEditor
                            label="Email body"
                            value={contentFormData.emailBody ?? ''}
                            onChange={(html) => setContentFormData((p) => ({ ...p, emailBody: html }))}
                            placeholder="Use variables like {{user_name}}"
                            minHeight={200}
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'sms' && ((contentMessage.enableSms ?? false) || tabsToShow.length >= 3) && (
                      <div role="tabpanel" style={{ marginBottom: 16 }}>
                        <div className="form-group">
                          <RichTextEditor
                            label="SMS body"
                            value={contentFormData.smsBody ?? ''}
                            onChange={(html) => setContentFormData((p) => ({ ...p, smsBody: html }))}
                            placeholder="Short message text"
                            minHeight={120}
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'notification' && ((contentMessage.enableNotification ?? false) || tabsToShow.length >= 3) && (
                      <div role="tabpanel" style={{ marginBottom: 16 }}>
                        <div className="form-group">
                          <label htmlFor="content-notificationSubject" className="form-label">Notification subject</label>
                          <input
                            type="text"
                            id="content-notificationSubject"
                            name="notificationSubject"
                            value={contentFormData.notificationSubject ?? ''}
                            onChange={handleContentInputChange}
                            className="form-input"
                            placeholder="Notification title"
                          />
                        </div>
                        <div className="form-group">
                          <RichTextEditor
                            label="Notification body"
                            value={contentFormData.notificationBody ?? ''}
                            onChange={(html) => setContentFormData((p) => ({ ...p, notificationBody: html }))}
                            placeholder="Notification body"
                            minHeight={160}
                          />
                        </div>
                      </div>
                    )}

                  </>
                );
              })()}

              <div className="form-actions" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowContentModal(false);
                    resetContentForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-small" disabled={contentSubmitting}>
                  <Save size={16} />
                  <span>{contentSubmitting ? 'Saving...' : 'Save content'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && previewMessage && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div
            className="modal-content organization-modal"
            style={{ maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Preview: {previewMessage.topic ?? 'Template'}</h2>
              <button className="modal-close-btn" onClick={() => setShowPreviewModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="organization-form">
              {previewMessage.details?.[0] && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email subject</label>
                    <div
                      style={{
                        padding: 12,
                        backgroundColor: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{previewMessage.details[0].emailSubject ?? '—'}</span>
                      <button
                        type="button"
                        className="btn-icon-view"
                        onClick={() => handleCopy(previewMessage.details![0].emailSubject ?? '')}
                        title="Copy"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email body</label>
                    <div
                      className="rich-text-editor-preview"
                      style={{
                        padding: 12,
                        backgroundColor: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        maxHeight: 300,
                        overflowY: 'auto',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: previewMessage.details[0].emailBody?.trim() || '—',
                      }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={() => handleCopy(previewMessage.details![0].emailBody ?? '')}
                    >
                      <Copy size={16} />
                      <span>Copy body</span>
                    </button>
                  </div>
                </>
              )}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPreviewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
