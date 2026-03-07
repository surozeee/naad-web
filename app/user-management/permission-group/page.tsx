'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Save,
  ChevronDown,
  Info,
} from 'lucide-react';
import Select from 'react-select';
import type { MultiValue } from 'react-select';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { permissionApi, permissionGroupApi } from '@/app/lib/user-api.service';
import type { PermissionGroupResponse, PermissionResponse } from '@/app/lib/user-api.types';

const PAGE_SIZE = 20;
type SelectOption = { value: string; label: string };

const iconTooltipBg = '#2563eb';
const TOOLTIP_GAP = 10;

function IconTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      left: rect.right + TOOLTIP_GAP,
      top: rect.top + rect.height / 2,
    });
  }, []);

  const handleMouseEnter = () => {
    updatePosition();
    setShow(true);
  };

  useEffect(() => {
    if (!show) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [show, updatePosition]);

  const tooltipContent = show && typeof document !== 'undefined' && (
    createPortal(
      <div
        role="tooltip"
        style={{
          position: 'fixed',
          left: position.left,
          top: position.top,
          transform: 'translateY(-50%)',
          zIndex: 1000000,
          padding: '10px 12px',
          borderRadius: 12,
          border: 'none',
          background: iconTooltipBg,
          color: '#ffffff',
          boxShadow: '0 14px 30px rgba(37, 99, 235, 0.35)',
          fontSize: 12,
          lineHeight: 1.5,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -6,
            top: '50%',
            width: 10,
            height: 10,
            background: iconTooltipBg,
            border: 'none',
            transform: 'translateY(-50%) rotate(45deg)',
          }}
        />
        {text}
      </div>,
      document.body
    )
  );

  return (
    <>
      <span
        ref={triggerRef}
        style={{ position: 'relative', display: 'inline-flex' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>
      {tooltipContent}
    </>
  );
}

function mapItem(raw: PermissionGroupResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    description: String(raw.description ?? ''),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
    hasSubChild: raw.hasSubChild ?? 'TRUE',
    parentId: raw.parentId ? String(raw.parentId) : undefined,
    parentName: raw.parentName,
  };
}

function mapPermission(raw: PermissionResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    description: String(raw.description ?? ''),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
    permissionGroupId: raw.permissionGroupId ? String(raw.permissionGroupId) : undefined,
    permissionGroupName: raw.permissionGroupName,
  };
}

export default function PermissionGroupManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<ReturnType<typeof mapItem>[]>([]);
  const [permissions, setPermissions] = useState<ReturnType<typeof mapPermission>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'deleted',
    lastChild: false,
    parentId: '',
    permissionIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [expandedSubIds, setExpandedSubIds] = useState<Record<string, boolean>>({});
  const [permissionOptions, setPermissionOptions] = useState<SelectOption[]>([]);
  const [permissionPage, setPermissionPage] = useState(0);
  const [permissionTotal, setPermissionTotal] = useState(0);
  const [permissionOptionsLoading, setPermissionOptionsLoading] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const permissionSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showSelectedGroupInfoTooltip, setShowSelectedGroupInfoTooltip] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await permissionGroupApi.list({ pageNo: 0, pageSize: 1000 });
      setGroups((list ?? []).map(mapItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permission groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const list = await permissionApi.list({ pageNo: 0, pageSize: 1000 });
      setPermissions((list ?? []).map(mapPermission));
    } catch {
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchPermissions();
  }, [fetchGroups, fetchPermissions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: (formData.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        hasSubChild: (formData.lastChild ? 'FALSE' : 'TRUE') as 'TRUE' | 'FALSE',
        parentId: formData.parentId || undefined,
        permissionIds: formData.lastChild ? (formData.permissionIds ?? []) : undefined,
      };
      if (editingId) {
        await permissionGroupApi.update(editingId, body);
        await Swal.fire({ title: 'Updated', text: 'Permission group updated successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await permissionGroupApi.create(body);
        await Swal.fire({ title: 'Created', text: 'Permission group created successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchGroups();
      await fetchPermissions();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
      setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : 'Operation failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', status: 'active', lastChild: false, parentId: '', permissionIds: [] });
    setErrors({});
    setEditingId(null);
    setPermissionOptions([]);
    setPermissionPage(0);
    setPermissionTotal(0);
    setPermissionSearch('');
  };

  const loadPermissionOptions = useCallback(async (search: string, page: number, append: boolean) => {
    setPermissionOptionsLoading(true);
    try {
      const res = await permissionApi.listAvailable({
        pageNo: page,
        pageSize: PAGE_SIZE,
        search: search ? String(search).trim() : undefined,
      });
      const list: PermissionResponse[] = Array.isArray(res?.result) ? res.result : [];
      const opts: SelectOption[] = list.map((item) => ({
        value: String(item.id ?? ''),
        label: [item.name, item.code ? `(${item.code})` : ''].filter(Boolean).join(' ').trim() || String(item.id ?? ''),
      }));
      setPermissionTotal(typeof res?.totalElements === 'number' ? res.totalElements : list.length);
      if (append) {
        setPermissionOptions((prev) => {
          const seen = new Set(prev.map((o) => o.value));
          const added = opts.filter((o) => o.value && !seen.has(o.value));
          return prev.concat(added);
        });
      } else {
        setPermissionOptions(opts);
      }
      setPermissionPage(page);
    } catch {
      if (!append) setPermissionOptions([]);
    } finally {
      setPermissionOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAddModal || !formData.lastChild) return;
    const timer = setTimeout(() => loadPermissionOptions('', 0, false), 100);
    return () => clearTimeout(timer);
  }, [showAddModal, formData.lastChild, editingId, loadPermissionOptions]);

  const handleEdit = (row: ReturnType<typeof mapItem>) => {
    const groupPermissionIds = (permissions.filter((p) => p.permissionGroupId === row.id).map((p) => p.id)) ?? [];
    setFormData({
      name: row.name,
      code: row.code,
      description: row.description,
      status: row.status,
      lastChild: row.hasSubChild === 'FALSE',
      parentId: row.parentId ?? '',
      permissionIds: groupPermissionIds,
    });
    setEditingId(row.id);
    setShowAddModal(true);
  };

  const handleChangeStatus = async (row: ReturnType<typeof mapItem>) => {
    const newStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${row.name}"</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await permissionGroupApi.changeStatus(row.id, newStatus);
      await fetchGroups();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete permission group?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await permissionGroupApi.delete(id);
      await fetchGroups();
      await Swal.fire({ title: 'Deleted', text: 'Permission group deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const handleRemovePermissionFromGroup = async (permission: ReturnType<typeof mapPermission>, groupId: string) => {
    const result = await Swal.fire({
      title: 'Remove permission from group?',
      html: `Remove <strong>"${permission.name}"</strong> from this permission group? The permission will be unassigned, not deleted.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await permissionGroupApi.removePermission(groupId, permission.id);
      await fetchPermissions();
      await Swal.fire({ title: 'Removed', text: 'Permission removed from group.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Remove failed', icon: 'error' });
    }
  };

  const rootGroups = groups.filter((g) => !g.parentId);
  const filteredParentGroups = rootGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.code && g.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const subGroupsByParent = groups.reduce<Record<string, ReturnType<typeof mapItem>[]>>((acc, g) => {
    if (!g.parentId) return acc;
    if (!acc[g.parentId]) acc[g.parentId] = [];
    acc[g.parentId].push(g);
    return acc;
  }, {});

  /** Recursively render a permission group node and its nested children (by hasSubChild). */
  const renderGroupNode = (group: ReturnType<typeof mapItem>, depth: number) => {
    const expanded = !!expandedSubIds[group.id];
    const children = subGroupsByParent[group.id] ?? [];
    const isLastChild = group.hasSubChild === 'FALSE';
    const subPermissions = permissionByGroup[group.id] ?? [];

    return (
      <div key={group.id} style={{ marginBottom: 4 }}>
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            overflow: 'hidden',
            marginLeft: depth * 20,
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => toggleSubExpanded(group.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSubExpanded(group.id); }}
            style={{
              width: '100%',
              border: 'none',
              background: depth === 0 ? '#f8fafc' : '#fafafa',
              padding: '0.65rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{group.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {!isLastChild && (
                <IconTooltip text="Add Sub Group">
                  <button
                    type="button"
                    className="btn-icon-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                      setFormData((prev) => ({ ...prev, parentId: group.id }));
                      setShowAddModal(true);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </IconTooltip>
              )}
              <IconTooltip text="Edit">
                <button
                  type="button"
                  className="btn-icon-edit"
                  onClick={(e) => { e.stopPropagation(); handleEdit(group); }}
                >
                  <Edit size={16} />
                </button>
              </IconTooltip>
              <IconTooltip text={group.status === 'active' ? 'Deactivate' : 'Activate'}>
                <button
                  type="button"
                  className="btn-icon-edit"
                  onClick={(e) => { e.stopPropagation(); handleChangeStatus(group); }}
                >
                  {group.status === 'active' ? <X size={16} /> : <Check size={16} />}
                </button>
              </IconTooltip>
              {children.length === 0 && subPermissions.length === 0 && (
                <IconTooltip text="Delete">
                  <button
                    type="button"
                    className="btn-icon-delete"
                    onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                  >
                    <Trash2 size={16} />
                  </button>
                </IconTooltip>
              )}
              <IconTooltip text={expanded ? 'Collapse' : 'Expand'}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ChevronDown
                    size={16}
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                  />
                </span>
              </IconTooltip>
            </div>
          </div>
          {expanded && (
            <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
              {!isLastChild && (
                children.length > 0 ? (
                  <div style={{ display: 'grid', gap: 4 }}>
                    {children.map((child) => renderGroupNode(child, depth + 1))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: 14 }}>No sub groups. Use &quot;Add Sub Group&quot; on the row to add one.</div>
                )
              )}
              {isLastChild && (
                subPermissions.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 14 }}>No permissions in this group. Use Edit to add permissions.</div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {subPermissions.map((permission) => (
                      <div
                        key={permission.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{permission.name}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{permission.code || '—'}</div>
                          </div>
                        </div>
                        <IconTooltip text="Remove from group">
                          <button
                            type="button"
                            className="btn-icon-delete"
                            onClick={() => handleRemovePermissionFromGroup(permission, group.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </IconTooltip>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const permissionByGroup = permissions.reduce<Record<string, ReturnType<typeof mapPermission>[]>>((acc, p) => {
    const key = p.permissionGroupId;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  useEffect(() => {
    if (!selectedParentId || !rootGroups.some((g) => g.id === selectedParentId)) {
      setSelectedParentId(rootGroups[0]?.id ?? null);
    }
  }, [rootGroups, selectedParentId]);

  useEffect(() => {
    if (filteredParentGroups.length === 0) return;
    if (!filteredParentGroups.some((g) => g.id === selectedParentId)) {
      setSelectedParentId(filteredParentGroups[0].id);
    }
  }, [filteredParentGroups, selectedParentId]);

  const selectedParent = rootGroups.find((g) => g.id === selectedParentId) ?? null;

  const toggleSubExpanded = (id: string) => {
    setExpandedSubIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'User Management' }, { label: 'Permission Group' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>Permission Groups</h1>
            </div>
            <div
              style={{ marginTop: -12, position: 'relative' }}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <button
                type="button"
                aria-label="Permission groups information"
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
                    width: 260,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: iconTooltipBg,
                    color: '#ffffff',
                    boxShadow: '0 14px 30px rgba(37, 99, 235, 0.35)',
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
                      background: iconTooltipBg,
                      border: 'none',
                      transform: 'translateY(-50%) rotate(45deg)',
                    }}
                  />
                  Permission groups organize permissions hierarchically. Create parent and child groups, then assign permissions to last-child groups for roles.
                </div>
              )}
            </div>
          </div>
        <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={16} />
          <span>Add Permission Group</span>
        </button>
        </div>
        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        )}
        <div className="table-container" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : filteredParentGroups.length === 0 ? (
          <div className="empty-state">
            <p>No parent permission groups found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(0, 2.1fr)', gap: '1rem', alignItems: 'start' }}>
            <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
              <div style={{ padding: '0rem 0rem', borderBottom: '1px solid #e2e8f0' }}>
                <div className="search-wrapper" style={{ marginBottom: '0.75rem' }}>
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search permission group..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <div style={{ display: 'grid' }}>
                {filteredParentGroups.map((parent) => {
                  const isSelected = parent.id === selectedParentId;
                  return (
                    <div
                      key={parent.id}
                      onClick={() => setSelectedParentId(parent.id)}
                      style={{
                        border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
                        borderRadius: 10,
                        padding: '0.625rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        background: isSelected ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {parent.name}
                      </span>
                    </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconTooltip text={parent.status === 'active' ? 'Deactivate' : 'Activate'}>
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={(e) => { e.stopPropagation(); handleChangeStatus(parent); }}
                          >
                            {parent.status === 'active' ? <X size={16} /> : <Check size={16} />}
                          </button>
                        </IconTooltip>
                        <IconTooltip text="Edit">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(parent);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        </IconTooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: '1rem' }}>
              {!selectedParent ? (
                <div style={{ color: '#64748b' }}>Select a parent permission group to view details.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedParent.name}</h3>
                      <div
                        style={{ position: 'relative', flexShrink: 0 }}
                        onMouseEnter={() => setShowSelectedGroupInfoTooltip(true)}
                        onMouseLeave={() => setShowSelectedGroupInfoTooltip(false)}
                      >
                        <button
                          type="button"
                          aria-label="Group description"
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
                        {showSelectedGroupInfoTooltip && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: 'calc(100% + 10px)',
                              transform: 'translateY(-50%)',
                              zIndex: 1200,
                              width: 260,
                              padding: '10px 12px',
                              borderRadius: 12,
                              border: 'none',
                              background: iconTooltipBg,
                              color: '#ffffff',
                              boxShadow: '0 14px 30px rgba(37, 99, 235, 0.35)',
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
                                background: iconTooltipBg,
                                border: 'none',
                                transform: 'translateY(-50%) rotate(45deg)',
                              }}
                            />
                            {selectedParent.description || selectedParent.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="action-buttons">
                      {selectedParent.hasSubChild === 'FALSE' ? null : (
                        <IconTooltip text="Add Sub Permission Group">
                          <button
                            type="button"
                            className="btn-icon-edit"
                            onClick={() => {
                              resetForm();
                              setFormData((prev) => ({ ...prev, parentId: selectedParent.id }));
                              setShowAddModal(true);
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </IconTooltip>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '0.875rem', paddingTop: '0.875rem' }}>
                    {(subGroupsByParent[selectedParent.id] ?? []).length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: 14 }}>
                        {selectedParent.hasSubChild === 'FALSE'
                          ? 'No permissions in this group.'
                          : 'No sub permission groups yet. Use "Add Sub Permission Group" above to add one.'}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 4 }}>
                        {(subGroupsByParent[selectedParent.id] ?? []).map((sub) => renderGroupNode(sub, 0))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content organization-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Permission Group' : 'Add Permission Group'}</h2>
              <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="organization-form">
              {errors.submit && <div className="form-error" style={{ marginBottom: '1rem' }}>{errors.submit}</div>}
              <div className="form-group">
                <label htmlFor="name" className="form-label">Name <span className="required">*</span></label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g., User Management" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="code" className="form-label">Code</label>
                <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} className="form-input" placeholder="e.g., user-management" />
              </div>
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows={2} placeholder="Optional description" />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="lastChild" name="lastChild" checked={formData.lastChild} onChange={handleInputChange} />
                <label htmlFor="lastChild" className="form-label" style={{ marginBottom: 0 }}>Last Child Permission Group</label>
              </div>
              {formData.lastChild && (
                <div className="form-group" data-permission-select-wrapper>
                  <label className="form-label">Permissions (active, not used in other group)</label>
                  <div data-permission-select>
                    <Select<SelectOption, true>
                      key={`permission-select-${showAddModal}-${formData.lastChild}-${editingId ?? 'new'}`}
                      classNamePrefix="selectpicker"
                      className="selectpicker-wrapper"
                      isMulti
                      placeholder={permissionOptionsLoading ? 'Loading...' : 'Search and select permissions'}
                      options={permissionOptions}
                      value={formData.permissionIds.map((id) => {
                        const opt = permissionOptions.find((o) => o.value === id);
                        if (opt) return opt;
                        const p = permissions.find((p) => p.id === id);
                        return { value: id, label: p ? `${p.name}${p.code ? ` (${p.code})` : ''}` : id };
                      })}
                      onMenuOpen={() => loadPermissionOptions(permissionSearch, 0, false)}
                      onChange={(opts: MultiValue<SelectOption>) =>
                        setFormData((prev) => ({ ...prev, permissionIds: (opts ?? []).map((o) => o.value) }))
                      }
                      onInputChange={(newVal) => {
                        if (permissionSearchRef.current) clearTimeout(permissionSearchRef.current);
                        permissionSearchRef.current = setTimeout(() => {
                          setPermissionSearch(newVal);
                          loadPermissionOptions(newVal, 0, false);
                        }, 300);
                      }}
                      onMenuScrollToBottom={() => {
                        const nextPage = permissionPage + 1;
                        if ((nextPage + 1) * PAGE_SIZE <= permissionTotal) {
                          loadPermissionOptions(permissionSearch, nextPage, true);
                        }
                      }}
                      isLoading={permissionOptionsLoading}
                      isClearable
                      filterOption={() => true}
                      noOptionsMessage={() => (permissionOptionsLoading ? 'Loading...' : 'No permissions found')}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                      styles={{
                        control: (base) => ({ ...base, minHeight: 40 }),
                        menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary btn-small" disabled={submitting}>
                  <Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
