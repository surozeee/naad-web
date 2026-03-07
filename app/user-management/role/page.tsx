'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Key,
  Plus,
  Search,
  Edit,
  X,
  Check,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FolderTree,
  Shield,
  ShieldPlus,
  Info,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { roleApi, permissionGroupApi } from '@/app/lib/user-api.service';
import type { RoleResponse, PermissionGroupTreeResponse } from '@/app/lib/user-api.types';

function mapItem(raw: RoleResponse) {
  const statusVal = String(raw.status ?? 'ACTIVE').toUpperCase();
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    status: statusVal === 'ACTIVE' ? 'active' : statusVal === 'DELETED' ? 'deleted' : 'inactive',
    permissionIds: (raw.permissions ?? []).map((p) => String(p.id)),
    permissionNames: (raw.permissions ?? []).map((p) => p.name),
  };
}

type TreeNodeProps = {
  node: PermissionGroupTreeResponse;
  depth: number;
  formData: { permissionIds: string[] };
  expandedGroupIds: Record<string, boolean>;
  onTogglePermission: (id: string) => void;
  onToggleGroup: (node: PermissionGroupTreeResponse, checked: boolean) => void;
  isGroupChecked: (node: PermissionGroupTreeResponse) => boolean;
  isGroupIndeterminate: (node: PermissionGroupTreeResponse) => boolean;
  onToggleExpanded: (id: string) => void;
};

function PermissionGroupTreeNode({
  node,
  depth,
  formData,
  expandedGroupIds,
  onTogglePermission,
  onToggleGroup,
  isGroupChecked,
  isGroupIndeterminate,
  onToggleExpanded,
}: TreeNodeProps) {
  const groupCheckRef = useRef<HTMLInputElement>(null);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const hasPermissions = (node.permissions ?? []).length > 0;
  const hasExpandableContent = hasChildren || hasPermissions;
  const expanded = !!expandedGroupIds[node.id];
  const checked = isGroupChecked(node);
  const indeterminate = isGroupIndeterminate(node);

  useEffect(() => {
    if (groupCheckRef.current) groupCheckRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const toggleExpand = () => {
    if (hasExpandableContent) onToggleExpanded(node.id);
  };

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        role={hasExpandableContent ? 'button' : undefined}
        tabIndex={hasExpandableContent ? 0 : undefined}
        onClick={hasExpandableContent ? toggleExpand : undefined}
        onKeyDown={hasExpandableContent ? (e) => e.key === 'Enter' && toggleExpand() : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          borderRadius: 8,
          background: depth === 0 ? '#f8fafc' : 'transparent',
          marginLeft: depth * 16,
          cursor: hasExpandableContent ? 'pointer' : undefined,
        }}
      >
        <input
          ref={groupCheckRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggleGroup(node, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          style={{ marginRight: 4, flexShrink: 0 }}
        />
        <FolderTree size={14} style={{ color: '#64748b', flexShrink: 0 }} />
        {depth > 0 && (
          <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.02em', flexShrink: 0 }}>Sub</span>
        )}
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{node.name}</span>
        {node.code && <span style={{ fontSize: 12, color: '#64748b' }}>({node.code})</span>}
        {hasExpandableContent && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpanded(node.id); }}
            style={{ padding: 2, border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', marginLeft: 'auto', flexShrink: 0 }}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown
              size={16}
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>
        )}
      </div>
      {expanded && hasChildren && (
        <div style={{ marginLeft: depth * 16 + 8 }}>
          {(node.children ?? []).map((child) => (
            <PermissionGroupTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              formData={formData}
              expandedGroupIds={expandedGroupIds}
              onTogglePermission={onTogglePermission}
              onToggleGroup={onToggleGroup}
              isGroupChecked={isGroupChecked}
              isGroupIndeterminate={isGroupIndeterminate}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
      {expanded && (node.permissions ?? []).length > 0 && (
        <div style={{ marginLeft: depth * 16 + 28, marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          {(node.permissions ?? []).map((perm) => (
            <div
              key={perm.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              <input
                type="checkbox"
                checked={formData.permissionIds.includes(String(perm.id))}
                onChange={() => onTogglePermission(String(perm.id))}
                style={{ marginRight: 4 }}
              />
              <Shield size={12} style={{ color: '#64748b', flexShrink: 0 }} />
              <span style={{ fontSize: 12 }}>{perm.name}</span>
              {perm.code && <span style={{ fontSize: 11, color: '#94a3b8' }}>({perm.code})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SortKey = 'name' | 'description' | 'status';

export default function RolePage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [roles, setRoles] = useState<ReturnType<typeof mapItem>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    permissionIds: [] as string[],
    selectedGroupIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permissionGroupTree, setPermissionGroupTree] = useState<PermissionGroupTreeResponse[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Record<string, boolean>>({});
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [detailRole, setDetailRole] = useState<ReturnType<typeof mapItem> | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsModalRole, setPermissionsModalRole] = useState<ReturnType<typeof mapItem> | null>(null);
  const [permissionsModalFormData, setPermissionsModalFormData] = useState({ permissionIds: [] as string[], selectedGroupIds: [] as string[] });
  const [permissionsModalExpanded, setPermissionsModalExpanded] = useState<Record<string, boolean>>({});
  const [permissionsModalSearch, setPermissionsModalSearch] = useState('');

  function collectPermissionIds(node: PermissionGroupTreeResponse): string[] {
    if (!node) return [];
    const fromPerms = (node.permissions ?? []).map((p) => (p?.id != null ? String(p.id).trim() : '')).filter(Boolean);
    const fromChildren = (node.children ?? []).flatMap((child) => collectPermissionIds(child));
    return [...fromPerms, ...fromChildren];
  }

  function collectGroupIds(node: PermissionGroupTreeResponse): string[] {
    if (!node?.id) return [];
    const id = String(node.id).trim();
    const fromChildren = (node.children ?? []).flatMap((child) => collectGroupIds(child));
    return [id, ...fromChildren];
  }

  function collectAllGroupIds(nodes: PermissionGroupTreeResponse[]): string[] {
    return nodes.flatMap((node) => [node.id, ...collectAllGroupIds(node.children ?? [])]);
  }

  function filterPermissionTree(nodes: PermissionGroupTreeResponse[], search: string): PermissionGroupTreeResponse[] {
    const q = search.trim().toLowerCase();
    if (!q) return nodes;
    function groupMatches(n: PermissionGroupTreeResponse) {
      const name = (n.name ?? '').toLowerCase();
      const code = (n.code ?? '').toLowerCase();
      return name.includes(q) || code.includes(q);
    }
    function permMatches(p: { name?: string; code?: string }) {
      const name = (p.name ?? '').toLowerCase();
      const code = (p.code ?? '').toLowerCase();
      return name.includes(q) || code.includes(q);
    }
    function filterNode(node: PermissionGroupTreeResponse): PermissionGroupTreeResponse | null {
      const filteredChildren = (node.children ?? []).map(filterNode).filter((n): n is PermissionGroupTreeResponse => n != null);
      const filteredPerms = (node.permissions ?? []).filter(permMatches);
      const selfMatch = groupMatches(node);
      const childMatch = filteredChildren.length > 0 || filteredPerms.length > 0;
      if (!selfMatch && !childMatch) return null;
      return { ...node, children: filteredChildren, permissions: selfMatch ? (node.permissions ?? []) : filteredPerms };
    }
    return nodes.map(filterNode).filter((n): n is PermissionGroupTreeResponse => n != null);
  }

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await roleApi.list({ pageNo: 0, pageSize: 1000 });
      setRoles((list ?? []).map(mapItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissionGroupTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const tree = await permissionGroupApi.getActiveTree();
      setPermissionGroupTree(tree ?? []);
    } catch {
      setPermissionGroupTree([]);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (showPermissionsModal) fetchPermissionGroupTree();
  }, [showPermissionsModal, fetchPermissionGroupTree]);

  useEffect(() => {
    if (showPermissionsModal && permissionGroupTree.length > 0) {
      const allIds = collectAllGroupIds(permissionGroupTree);
      setPermissionsModalExpanded((prev) => {
        const next = { ...prev };
        allIds.forEach((id) => { next[id] = true; });
        return next;
      });
    }
  }, [showPermissionsModal, permissionGroupTree]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const togglePermission = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id) ? prev.permissionIds.filter((x) => x !== id) : [...prev.permissionIds, id],
    }));
  };

  const toggleGroup = (node: PermissionGroupTreeResponse, checked: boolean) => {
    const permIds = collectPermissionIds(node);
    const groupIds = collectGroupIds(node);
    setFormData((prev) => {
      if (checked) {
        return { ...prev, permissionIds: Array.from(new Set([...prev.permissionIds, ...permIds])), selectedGroupIds: Array.from(new Set([...prev.selectedGroupIds, ...groupIds])) };
      }
      const permSet = new Set(prev.permissionIds);
      const groupSet = new Set(prev.selectedGroupIds);
      permIds.forEach((id) => permSet.delete(id));
      groupIds.forEach((id) => groupSet.delete(id));
      return { ...prev, permissionIds: Array.from(permSet), selectedGroupIds: Array.from(groupSet) };
    });
  };

  const permissionIdSet = useMemo(() => new Set(formData.permissionIds.map((id) => String(id).trim()).filter(Boolean)), [formData.permissionIds]);
  const selectedGroupIdSet = useMemo(() => new Set(formData.selectedGroupIds.map((id) => String(id).trim()).filter(Boolean)), [formData.selectedGroupIds]);

  const isGroupChecked = (node: PermissionGroupTreeResponse): boolean => {
    const groupId = node?.id != null ? String(node.id).trim() : '';
    if (selectedGroupIdSet.has(groupId)) return true;
    const ids = collectPermissionIds(node);
    if (ids.length === 0) return false;
    return ids.every((id) => permissionIdSet.has(id));
  };

  const isGroupIndeterminate = (node: PermissionGroupTreeResponse): boolean => {
    if (isGroupChecked(node)) return false;
    const ids = collectPermissionIds(node);
    if (ids.length === 0) return false;
    const selected = ids.filter((id) => permissionIdSet.has(id));
    return selected.length > 0 && selected.length < ids.length;
  };

  const toggleExpanded = (id: string) => {
    setExpandedGroupIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openPermissionsModal = (row: ReturnType<typeof mapItem>) => {
    setPermissionsModalRole(row);
    setPermissionsModalFormData({ permissionIds: row.permissionIds ?? [], selectedGroupIds: [] });
    setPermissionsModalExpanded({});
    setPermissionsModalSearch('');
    setShowPermissionsModal(true);
  };

  const closePermissionsModal = () => {
    setShowPermissionsModal(false);
    setPermissionsModalRole(null);
  };

  const permissionsModalPermissionIdSet = useMemo(
    () => new Set(permissionsModalFormData.permissionIds.map((id) => String(id).trim()).filter(Boolean)),
    [permissionsModalFormData.permissionIds]
  );
  const permissionsModalGroupIdSet = useMemo(
    () => new Set(permissionsModalFormData.selectedGroupIds.map((id) => String(id).trim()).filter(Boolean)),
    [permissionsModalFormData.selectedGroupIds]
  );

  const permissionsModalFilteredTree = useMemo(
    () => filterPermissionTree(permissionGroupTree, permissionsModalSearch),
    [permissionGroupTree, permissionsModalSearch]
  );

  const permissionsModalTogglePermission = (id: string) => {
    setPermissionsModalFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id) ? prev.permissionIds.filter((x) => x !== id) : [...prev.permissionIds, id],
    }));
  };

  const permissionsModalToggleGroup = (node: PermissionGroupTreeResponse, checked: boolean) => {
    const permIds = collectPermissionIds(node);
    const groupIds = collectGroupIds(node);
    setPermissionsModalFormData((prev) => {
      if (checked) {
        return { ...prev, permissionIds: Array.from(new Set([...prev.permissionIds, ...permIds])), selectedGroupIds: Array.from(new Set([...prev.selectedGroupIds, ...groupIds])) };
      }
      const permSet = new Set(prev.permissionIds);
      const groupSet = new Set(prev.selectedGroupIds);
      permIds.forEach((id) => permSet.delete(id));
      groupIds.forEach((id) => groupSet.delete(id));
      return { ...prev, permissionIds: Array.from(permSet), selectedGroupIds: Array.from(groupSet) };
    });
  };

  const permissionsModalIsGroupChecked = (node: PermissionGroupTreeResponse): boolean => {
    const groupId = node?.id != null ? String(node.id).trim() : '';
    if (permissionsModalGroupIdSet.has(groupId)) return true;
    const ids = collectPermissionIds(node);
    if (ids.length === 0) return false;
    return ids.every((id) => permissionsModalPermissionIdSet.has(id));
  };

  const permissionsModalIsGroupIndeterminate = (node: PermissionGroupTreeResponse): boolean => {
    if (permissionsModalIsGroupChecked(node)) return false;
    const ids = collectPermissionIds(node);
    if (ids.length === 0) return false;
    const selected = ids.filter((id) => permissionsModalPermissionIdSet.has(id));
    return selected.length > 0 && selected.length < ids.length;
  };

  const permissionsModalToggleExpanded = (id: string) => {
    setPermissionsModalExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSavePermissionsModal = async () => {
    if (!permissionsModalRole) return;
    setSubmitting(true);
    setError(null);
    try {
      await roleApi.update(permissionsModalRole.id, {
        name: permissionsModalRole.name,
        description: permissionsModalRole.description ?? undefined,
        status: (permissionsModalRole.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        permissionIds: permissionsModalFormData.permissionIds.length ? permissionsModalFormData.permissionIds : undefined,
      });
      await fetchRoles();
      closePermissionsModal();
      if (detailRole?.id === permissionsModalRole.id) setDetailRole({ ...detailRole, permissionIds: permissionsModalFormData.permissionIds, permissionNames: [] });
      await Swal.fire({ title: 'Updated', text: 'Permissions updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Update failed', icon: 'error' });
    } finally {
      setSubmitting(false);
    }
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
        description: formData.description.trim() || undefined,
        status: (formData.status === 'active' ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        permissionIds: formData.permissionIds.length ? formData.permissionIds : undefined,
      };
      if (editingId) {
        await roleApi.update(editingId, body);
        await Swal.fire({ title: 'Updated', text: 'Role updated successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await roleApi.create(body);
        await Swal.fire({ title: 'Created', text: 'Role created successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchRoles();
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
    setFormData({ name: '', description: '', status: 'active', permissionIds: [], selectedGroupIds: [] });
    setErrors({});
    setEditingId(null);
  };

  const handleEdit = (row: ReturnType<typeof mapItem>) => {
    setFormData({ name: row.name, description: row.description, status: row.status, permissionIds: row.permissionIds ?? [], selectedGroupIds: [] });
    setEditingId(row.id);
    setDetailRole(null);
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
      await roleApi.changeStatus(row.id, newStatus);
      await fetchRoles();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const filtered = roles.filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const aStr = String(aVal ?? '').toLowerCase();
    const bStr = String(bVal ?? '').toLowerCase();
    if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = sorted.slice(startIndex, endIndex);
  const hasNoData = sorted.length === 0;
  const singlePage = totalPages === 1;

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const SortableTh = ({ columnKey, children, style }: { columnKey: SortKey; children: React.ReactNode; style?: React.CSSProperties }) => (
    <th role="button" tabIndex={0} onClick={() => handleSort(columnKey)} onKeyDown={(e) => e.key === 'Enter' && handleSort(columnKey)} className="sortable-th" style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 14 }}>
          {sortBy === columnKey ? (sortDirection === 'asc' ? <ChevronUp size={14} color="#2563eb" strokeWidth={2.4} /> : <ChevronDown size={14} color="#2563eb" strokeWidth={2.4} />) : <ArrowUpDown size={14} color="#94a3b8" strokeWidth={1.9} />}
        </span>
      </span>
    </th>
  );

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'User Management' }, { label: 'Roles' }]} />
        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: '1.35rem' }}>Roles</h1>
            </div>
            <div style={{ marginTop: -12, position: 'relative' }} onMouseEnter={() => setShowInfoTooltip(true)} onMouseLeave={() => setShowInfoTooltip(false)}>
              <button type="button" aria-label="Roles information" style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: 2, borderRadius: 999, cursor: 'help', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#334155', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)' }}>
                <Info size={18} />
              </button>
              {showInfoTooltip && (
                <div style={{ position: 'absolute', top: '50%', left: 'calc(100% + 10px)', transform: 'translateY(-50%)', zIndex: 1200, width: 260, padding: '10px 12px', borderRadius: 12, border: '1px solid #dbe2ea', background: '#ffffff', color: '#334155', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)', fontSize: 12, lineHeight: 1.5, fontWeight: 500 }}>
                  <div style={{ position: 'absolute', left: -6, top: '50%', width: 10, height: 10, background: '#ffffff', borderLeft: '1px solid #dbe2ea', borderBottom: '1px solid #dbe2ea', transform: 'translateY(-50%) rotate(45deg)' }} />
                  Roles define access levels. Assign permissions to roles, then assign roles to users to control what they can do.
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} /><span>Add Role</span>
          </button>
        </div>
        {error && (
          <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>
        )}
        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} />
            <input type="text" placeholder="Search roles..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="search-input" />
          </div>
        </div>
        <div className="table-container">
          <table className="data-table country-data-table">
            <thead>
              <tr>
                <SortableTh columnKey="name" style={{ minWidth: 180 }}>Name</SortableTh>
                <SortableTh columnKey="description">Description</SortableTh>
                <SortableTh columnKey="status">Status</SortableTh>
                <th style={{ textTransform: 'capitalize' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: 15 }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="empty-state" style={{ fontSize: 15 }}><p>{roles.length === 0 ? 'No roles found' : 'No roles match your search'}</p></td></tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id} role="button" tabIndex={0} onClick={() => setDetailRole(row)} onKeyDown={(e) => e.key === 'Enter' && setDetailRole(row)} style={{ cursor: 'pointer' }} className="data-table-row-clickable">
                    <td><div className="org-name-cell"><span className="org-name">{row.name}</span></div></td>
                    <td>{row.description || '—'}</td>
                    <td>
                      <span className={`status-badge ${row.status}`}>
                        {row.status === 'active' && <Check size={14} />}
                        {row.status === 'inactive' && <X size={14} />}
                        {row.status === 'deleted' && <Trash2 size={14} />}
                        <span>{row.status === 'active' ? 'Active' : row.status === 'deleted' ? 'Deleted' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <span className="action-tooltip-wrap">
                          <button type="button" className="btn-icon-edit" aria-label="Add permission" onClick={(e) => { e.stopPropagation(); openPermissionsModal(row); }}><ShieldPlus size={18} /></button>
                          <span className="action-tooltip">Add permission</span>
                        </span>
                        <span className="action-tooltip-wrap">
                          <button type="button" className="btn-icon-edit" aria-label="Edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}><Edit size={18} /></button>
                          <span className="action-tooltip">Edit</span>
                        </span>
                        <span className="action-tooltip-wrap">
                          <button type="button" className="btn-icon-edit" aria-label={row.status === 'active' ? 'Deactivate' : 'Activate'} onClick={(e) => { e.stopPropagation(); handleChangeStatus(row); }}>{row.status === 'active' ? <X size={18} /> : <Check size={18} />}</button>
                          <span className="action-tooltip">{row.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <label htmlFor="items-per-page" className="pagination-label">Show:</label>
                      <select id="items-per-page" className="pagination-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                      </select>
                      <span className="pagination-label">per page</span>
                    </div>
                    <div className="pagination-info">Showing {hasNoData ? 0 : startIndex + 1} to {Math.min(endIndex, sorted.length)} of {sorted.length}</div>
                    <div className="pagination-controls">
                      <button type="button" className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}><ChevronLeft size={18} /><span>Previous</span></button>
                      <div className="pagination-numbers">
                        {singlePage ? (
                          <button type="button" className="pagination-number active" disabled aria-current="page">1</button>
                        ) : (
                          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                              return (
                                <button key={page} type="button" className={`pagination-number ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)} aria-current={currentPage === page ? 'page' : undefined}>{page}</button>
                              );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="pagination-ellipsis" aria-hidden>...</span>;
                            return null;
                          })
                        )}
                      </div>
                      <button type="button" className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}><span>Next</span><ChevronRight size={18} /></button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {showAddModal && (
          <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '92vw', height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingId ? 'Edit Role' : 'Add Role'}</h2>
                <button className="modal-close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="organization-form" style={{ padding: '0 1.5rem 1.5rem', flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {errors.submit && <div className="form-error" style={{ marginBottom: 0, fontSize: 14 }}>{errors.submit}</div>}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="name" className="form-label" style={{ fontSize: 14 }}>Name <span className="required">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g., Admin" style={{ fontSize: 15, minHeight: 44 }} />
                  {errors.name && <span className="form-error" style={{ fontSize: 13 }}>{errors.name}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="description" className="form-label" style={{ fontSize: 14 }}>Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="form-input" rows={4} style={{ fontSize: 15, minHeight: 100, resize: 'vertical' }} />
                </div>
                <div className="form-actions" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ fontSize: 15, minHeight: 44 }}>Cancel</button>
                  <button type="submit" className="btn-primary btn-small" disabled={submitting} style={{ fontSize: 15, minHeight: 44 }}><Save size={16} /><span>{editingId ? 'Update' : 'Create'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showPermissionsModal && permissionsModalRole && (
          <div className="modal-overlay" onClick={closePermissionsModal}>
            <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 960, width: '92vw', height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ flexShrink: 0, padding: '1rem 1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Assign permissions — {permissionsModalRole.name}</h2>
                <button type="button" className="modal-close-btn" onClick={closePermissionsModal} aria-label="Close"><X size={24} /></button>
              </div>
              <div style={{ padding: '0 1.5rem 1.5rem', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap', flexShrink: 0 }}>
                  <div className="search-wrapper" style={{ flex: '1 1 200px', minWidth: 0, fontSize: 15 }}>
                    <Search size={20} />
                    <input type="text" placeholder="Search permission group or permission..." value={permissionsModalSearch} onChange={(e) => setPermissionsModalSearch(e.target.value)} className="search-input" style={{ fontSize: 15, minHeight: 44 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button type="button" className="btn-secondary" onClick={closePermissionsModal} style={{ fontSize: 15, minHeight: 44 }}>Cancel</button>
                    <button type="button" className="btn-primary btn-small" disabled={submitting} onClick={handleSavePermissionsModal} style={{ fontSize: 15, minHeight: 44 }}><Save size={16} /><span>Save</span></button>
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, fontSize: 14 }}>
                  {treeLoading ? <span style={{ color: '#64748b', fontSize: 15 }}>Loading permission tree...</span> : permissionGroupTree.length === 0 ? <span style={{ color: '#64748b', fontSize: 15 }}>No permission groups loaded</span> : permissionsModalFilteredTree.length === 0 ? <span style={{ color: '#64748b', fontSize: 15 }}>No groups or permissions match your search</span> : permissionsModalFilteredTree.map((node) => (
                    <PermissionGroupTreeNode key={node.id} node={node} depth={0} formData={{ permissionIds: permissionsModalFormData.permissionIds }} expandedGroupIds={permissionsModalExpanded} onTogglePermission={permissionsModalTogglePermission} onToggleGroup={permissionsModalToggleGroup} isGroupChecked={permissionsModalIsGroupChecked} isGroupIndeterminate={permissionsModalIsGroupIndeterminate} onToggleExpanded={permissionsModalToggleExpanded} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {detailRole && (
          <div className="modal-overlay" onClick={() => setDetailRole(null)}>
            <div className="modal-content organization-modal permission-detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, width: '92vw', height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header country-modal-header" style={{ flexShrink: 0, padding: '1rem 1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Role Detail</h2>
                <button type="button" className="modal-close-btn country-modal-close" onClick={() => setDetailRole(null)} aria-label="Close"><X size={22} /></button>
              </div>
              <div className="organization-form permission-detail-form" style={{ gap: '1rem', padding: '0 1.5rem 1.5rem', flex: 1, minHeight: 0, overflow: 'auto' }}>
                <div className="form-row permission-detail-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 14 }}><Key size={14} /> Name</label>
                    <p className="permission-detail-value" style={{ fontSize: 15, margin: 0, padding: '8px 0', fontWeight: 600 }}>{detailRole.name}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: 14 }}>Status</label>
                    <p className="permission-detail-value" style={{ margin: 0, padding: '8px 0', fontSize: 15 }}>
                      <span className={`status-badge ${detailRole.status}`}>{detailRole.status === 'active' && <Check size={14} />}{detailRole.status === 'inactive' && <X size={14} />}{detailRole.status === 'deleted' && <Trash2 size={14} />}<span>{detailRole.status === 'active' ? 'Active' : detailRole.status === 'deleted' ? 'Deleted' : 'Inactive'}</span></span>
                    </p>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Description</label>
                  <p className="permission-detail-value" style={{ fontSize: 15, margin: 0, padding: '8px 0', lineHeight: 1.5 }}>{detailRole.description || '—'}</p>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 14 }}>Permissions</label>
                  <p className="permission-detail-value" style={{ fontSize: 15, margin: 0, padding: '8px 0', lineHeight: 1.5 }}>{detailRole.permissionNames?.length ? detailRole.permissionNames.join(', ') : '—'}</p>
                </div>
                <div className="form-actions permission-detail-actions" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <button type="button" className="btn-primary btn-small" aria-label="Edit role" onClick={() => handleEdit(detailRole)} style={{ fontSize: 15, minHeight: 44 }}><Edit size={16} /><span>Edit</span></button>
                  <button type="button" className="btn-cancel" onClick={() => setDetailRole(null)} style={{ fontSize: 15, minHeight: 44 }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

