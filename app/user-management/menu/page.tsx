'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Save,
  ChevronDown,
  Info,
  Languages,
  Globe,
} from 'lucide-react';
import Select from 'react-select';
import type { MultiValue } from 'react-select';
import Swal from 'sweetalert2';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import { ActionTooltip } from '../../components/common/ActionTooltip';
import { PageHeaderWithInfo } from '../../components/common/PageHeaderWithInfo';
import { menuApi, menuLocaleApi, permissionApi } from '@/app/lib/user-api.service';
import { masterService } from '@/app/lib/master.service';
import type { MenuResponse, MenuLocaleResponse, PermissionResponse } from '@/app/lib/user-api.types';

type SelectOption = { value: string; label: string };

function mapItem(raw: MenuResponse) {
  const statusVal = raw.status != null ? String(raw.status).toUpperCase() : 'ACTIVE';
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    url: raw.url,
    code: raw.code,
    icon: raw.icon,
    priority: raw.priority,
    userType: raw.userType,
    hasChildMenu: raw.hasChildMenu ?? 'FALSE',
    parentMenuId: raw.parentMenuId ? String(raw.parentMenuId) : undefined,
    parentMenuName: raw.parentMenuName,
    menuLocales: raw.menuLocales ?? [],
    status: (statusVal === 'ACTIVE' ? 'active' : 'inactive') as 'active' | 'inactive',
  };
}

type MappedMenu = ReturnType<typeof mapItem>;

function getMenuDisplayName(menu: MappedMenu, currentLangCode: string): string {
  const code = currentLangCode.toUpperCase();
  const locale = menu.menuLocales?.find((l) => String(l.language).toUpperCase() === code);
  return (locale?.name ?? menu.name) || '';
}

export default function MenuManagement() {
  const currentLangCode = useMemo(() => 'EN', []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menus, setMenus] = useState<MappedMenu[]>([]);
  const [parentMenus, setParentMenus] = useState<MenuResponse[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingLocales, setEditingLocales] = useState<MenuLocaleResponse[]>([]);
  const [showLocaleForm, setShowLocaleForm] = useState(false);
  const [localeForm, setLocaleForm] = useState({ language: 'EN' as string, name: '' });
  const [editingLocaleId, setEditingLocaleId] = useState<string | null>(null);
  const [localeSubmitting, setLocaleSubmitting] = useState(false);
  const [showTranslationsOnlyModal, setShowTranslationsOnlyModal] = useState(false);
  const [translationsModalMenuName, setTranslationsModalMenuName] = useState('');
  const [localeLanguageOptions, setLocaleLanguageOptions] = useState<SelectOption[]>([]);
  const [localeLanguagesLoading, setLocaleLanguagesLoading] = useState(false);

  const permissionOptions = useMemo<SelectOption[]>(
    () =>
      permissions.map((p) => ({
        value: String(p.id ?? ''),
        label: [p.name, p.code ? `(${p.code})` : ''].filter(Boolean).join(' ').trim() || String(p.id ?? ''),
      })),
    [permissions]
  );

  // In translations-only modal: when adding, exclude already-saved locales; when editing, show all
  const localeOptionsForTranslationsModal = useMemo(() => {
    if (editingLocaleId) return localeLanguageOptions;
    const saved = new Set(editingLocales.map((l) => String(l.language)));
    return localeLanguageOptions.filter((o) => !saved.has(o.value));
  }, [editingLocaleId, editingLocales, localeLanguageOptions]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    code: '',
    icon: '',
    priority: '' as string | number,
    hasChildMenu: 'FALSE' as 'TRUE' | 'FALSE',
    parentMenuId: '',
    permissionIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [expandedSubIds, setExpandedSubIds] = useState<Record<string, boolean>>({});
  const [showSelectedMenuInfoTooltip, setShowSelectedMenuInfoTooltip] = useState(false);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await menuApi.listPaginate({
        pageNo: 0,
        pageSize: 1000,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });
      const items = list ?? [];
      setMenus(items.map(mapItem));
      setParentMenus(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menus');
      setMenus([]);
      setParentMenus([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      const list = await permissionApi.listActive();
      setPermissions(list ?? []);
    } catch {
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    if (showAddModal) fetchPermissions();
  }, [showAddModal, fetchPermissions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleHasChildMenuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      hasChildMenu: checked ? 'TRUE' : 'FALSE',
      permissionIds: checked ? prev.permissionIds : [],
    }));
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
        url: formData.url.trim() || undefined,
        code: formData.code.trim() || undefined,
        icon: formData.icon.trim() || undefined,
        priority: formData.priority !== '' ? Number(formData.priority) : undefined,
        hasChildMenu: formData.hasChildMenu,
        parentMenuId: formData.parentMenuId || undefined,
        permissionIds: formData.permissionIds.length ? formData.permissionIds : undefined,
      };
      if (editingId) {
        await menuApi.update(editingId, body);
        await Swal.fire({ title: 'Updated', text: 'Menu updated successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await menuApi.create(body);
        await Swal.fire({ title: 'Created', text: 'Menu created successfully.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      await fetchMenus();
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
    setFormData({
      name: '',
      url: '',
      code: '',
      icon: '',
      priority: '',
      hasChildMenu: 'FALSE',
      parentMenuId: '',
      permissionIds: [],
    });
    setErrors({});
    setEditingId(null);
    setEditingLocales([]);
    setShowLocaleForm(false);
    setEditingLocaleId(null);
    setLocaleForm({ language: 'EN', name: '' });
  };

  const handleEdit = async (row: MappedMenu) => {
    try {
      const detail = await menuApi.getById(row.id);
      const permIds = (detail?.permissions ?? []).map((p) => String(p.id));
      setFormData({
        name: row.name,
        url: row.url ?? '',
        code: row.code ?? '',
        icon: row.icon ?? '',
        priority: row.priority ?? '',
        hasChildMenu: (detail?.hasChildMenu ?? row.hasChildMenu ?? 'FALSE') as 'TRUE' | 'FALSE',
        parentMenuId: row.parentMenuId ?? '',
        permissionIds: permIds,
      });
      setEditingLocales(detail?.menuLocales ?? []);
      setEditingId(row.id);
      setShowAddModal(true);
      setShowLocaleForm(false);
      setEditingLocaleId(null);
      setLocaleForm({ language: 'EN', name: '' });
    } catch {
      setError('Failed to load menu details');
    }
  };

  const refreshLocalesForEditing = useCallback(async () => {
    if (!editingId) return;
    try {
      const list = await menuLocaleApi.getByMenuId(editingId);
      setEditingLocales(list ?? []);
    } catch {
      setEditingLocales([]);
    }
  }, [editingId]);

  const handleAddLocale = async () => {
    if (!editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      const created = await menuLocaleApi.create({
        menuId: editingId,
        language: localeForm.language,
        name: localeForm.name.trim(),
      });
      await refreshLocalesForEditing();
      if (created?.id) setEditingLocaleId(created.id);
      await fetchMenus();
      await Swal.fire({ title: 'Saved', text: 'Translation saved.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed to add translation', icon: 'error' });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleUpdateLocale = async () => {
    if (!editingLocaleId || !editingId || !localeForm.name.trim()) return;
    setLocaleSubmitting(true);
    try {
      await menuLocaleApi.update(editingLocaleId, {
        menuId: editingId,
        language: localeForm.language,
        name: localeForm.name.trim(),
      });
      await refreshLocalesForEditing();
      await fetchMenus();
      await Swal.fire({ title: 'Updated', text: 'Translation updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed to update', icon: 'error' });
    } finally {
      setLocaleSubmitting(false);
    }
  };

  const handleDeleteLocale = async (localeId: string) => {
    const result = await Swal.fire({
      title: 'Remove translation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await menuLocaleApi.delete(localeId);
      await refreshLocalesForEditing();
      await fetchMenus();
      await Swal.fire({ title: 'Removed', text: 'Translation removed.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const openEditLocale = (locale: MenuLocaleResponse) => {
    setEditingLocaleId(locale.id);
    setLocaleForm({ language: String(locale.language ?? 'EN'), name: locale.name ?? '' });
    setShowLocaleForm(true);
  };

  const openTranslationsModal = useCallback(async (menu: MappedMenu) => {
    setEditingId(menu.id);
    setTranslationsModalMenuName(getMenuDisplayName(menu, currentLangCode) || menu.name);
    setShowLocaleForm(true);
    setEditingLocaleId(null);
    setLocaleForm({ language: 'EN', name: '' });
    try {
      const list = await menuLocaleApi.getByMenuId(menu.id);
      setEditingLocales(list ?? []);
      const first = list?.[0];
      if (first) {
        setLocaleForm({ language: String(first.language ?? 'EN'), name: first.name ?? '' });
        setEditingLocaleId(first.id);
      } else {
        setLocaleForm({ language: 'EN', name: '' });
      }
    } catch {
      setEditingLocales([]);
    }
    setShowTranslationsOnlyModal(true);
  }, [currentLangCode]);

  const handleTranslationsLanguageChange = (language: string) => {
    setLocaleForm((prev) => ({ ...prev, language }));
    const existing = editingLocales.find((l) => String(l.language) === language);
    if (existing) {
      setEditingLocaleId(existing.id);
      setLocaleForm((prev) => ({ ...prev, name: existing.name ?? '' }));
    } else {
      setEditingLocaleId(null);
      setLocaleForm((prev) => ({ ...prev, name: '' }));
    }
  };

  useEffect(() => {
    if (!showTranslationsOnlyModal && !(showAddModal && editingId)) return;
    setLocaleLanguagesLoading(true);
    masterService.language
      .listActive()
      .then((res: { data?: unknown }) => {
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : [];
        const options = list
          .map((item: Record<string, unknown>) => {
            const code = String(item.code ?? item.name ?? '').toUpperCase();
            const name = String(item.name ?? item.code ?? code);
            return code ? { value: code, label: `${name} (${code})` } : null;
          })
          .filter((o): o is SelectOption => o != null);
        setLocaleLanguageOptions(options);
        setLocaleForm((prev) => {
          const firstCode = options[0]?.value ?? prev.language;
          if (!prev.language && firstCode) return { ...prev, language: firstCode };
          if (prev.language && !options.some((o) => o.value === prev.language) && options[0])
            return { ...prev, language: options[0].value };
          return prev;
        });
      })
      .catch(() => setLocaleLanguageOptions([]))
      .finally(() => setLocaleLanguagesLoading(false));
  }, [showTranslationsOnlyModal, showAddModal, editingId]);

  const closeTranslationsOnlyModal = () => {
    setShowTranslationsOnlyModal(false);
    setEditingId(null);
    setEditingLocales([]);
    setShowLocaleForm(false);
    setEditingLocaleId(null);
    setLocaleForm({ language: 'EN', name: '' });
  };

  const handleChangeStatus = async (row: MappedMenu) => {
    const newStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const displayName = getMenuDisplayName(row, currentLangCode) || row.name;
    const result = await Swal.fire({
      title: 'Update status?',
      html: `Set <strong>"${displayName}"</strong> to <strong>${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await menuApi.changeStatus(row.id, newStatus);
      await fetchMenus();
      await Swal.fire({ title: 'Updated', text: 'Status updated.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Failed', icon: 'error' });
    }
  };

  const rootMenus = menus.filter((m) => !m.parentMenuId);
  const filteredRootMenus = rootMenus.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const subMenusByParent = menus.reduce<Record<string, ReturnType<typeof mapItem>[]>>((acc, m) => {
    const pid = m.parentMenuId;
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(m);
    return acc;
  }, {});

  useEffect(() => {
    if (!selectedParentId || !rootMenus.some((m) => m.id === selectedParentId)) {
      setSelectedParentId(rootMenus[0]?.id ?? null);
    }
  }, [rootMenus, selectedParentId]);

  useEffect(() => {
    if (filteredRootMenus.length === 0) return;
    if (!filteredRootMenus.some((m) => m.id === selectedParentId)) {
      setSelectedParentId(filteredRootMenus[0].id);
    }
  }, [filteredRootMenus, selectedParentId]);

  const selectedParent = rootMenus.find((m) => m.id === selectedParentId) ?? null;

  const toggleSubExpanded = (id: string) => {
    setExpandedSubIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete menu?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await menuApi.delete(id);
      await fetchMenus();
      await Swal.fire({ title: 'Deleted', text: 'Menu deleted.', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err instanceof Error ? err.message : 'Delete failed', icon: 'error' });
    }
  };

  const renderMenuNode = (menu: MappedMenu, depth: number) => {
    const expanded = !!expandedSubIds[menu.id];
    const children = subMenusByParent[menu.id] ?? [];

    return (
      <div key={menu.id} style={{ marginBottom: 4 }}>
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
            onClick={() => toggleSubExpanded(menu.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSubExpanded(menu.id); }}
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
              <span style={{ fontWeight: 600, fontSize: 14 }}>{getMenuDisplayName(menu, currentLangCode)}</span>
              {menu.code && <span style={{ fontSize: 12, color: '#64748b' }}>({menu.code})</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <ActionTooltip text="Add Sub Menu">
                <button
                  type="button"
                  className="btn-icon-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                    setFormData((prev) => ({ ...prev, parentMenuId: menu.id }));
                    setShowAddModal(true);
                  }}
                >
                  <Plus size={16} />
                </button>
              </ActionTooltip>
              <ActionTooltip text="Edit">
                <button type="button" className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleEdit(menu); }}>
                  <Edit size={16} />
                </button>
              </ActionTooltip>
              <ActionTooltip text={menu.status === 'active' ? 'Deactivate' : 'Activate'}>
                <button type="button" className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleChangeStatus(menu); }}>
                  {menu.status === 'active' ? <X size={16} /> : <Check size={16} />}
                </button>
              </ActionTooltip>
              {children.length === 0 && (
                <ActionTooltip text="Delete">
                  <button type="button" className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); handleDelete(menu.id); }}>
                    <Trash2 size={16} />
                  </button>
                </ActionTooltip>
              )}
              <ActionTooltip text={expanded ? 'Collapse' : 'Expand'}>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ChevronDown
                    size={16}
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                  />
                </span>
              </ActionTooltip>
            </div>
          </div>
          {expanded && (
            <div style={{ padding: '0.75rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
              {children.length > 0 ? (
                <div style={{ display: 'grid', gap: 4 }}>
                  {children.map((child) => renderMenuNode(child, depth + 1))}
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: 14 }}>No sub menus. Use &quot;Add Sub Menu&quot; on the row to add one.</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="organization-page">
        <Breadcrumb items={[{ label: 'User Management' }, { label: 'Menu' }]} />
      <PageHeaderWithInfo
        title="Menus"
        infoText="Manage navigation menus by user type. Assign URLs, icons, and permissions to build the app sidebar and routes. Add translations for multi-language labels."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={14} />
            Labels: <strong>{currentLangCode}</strong>
          </span>
          <button className="btn-primary btn-small" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Add Menu</span>
          </button>
        </div>
      </PageHeaderWithInfo>
      {error && (
        <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8 }}>
          {error}
        </div>
      )}
      <div className="table-container" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        ) : filteredRootMenus.length === 0 ? (
          <div className="empty-state">
            <p>{menus.length === 0 ? 'No parent menus found' : 'No menus match your search'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(0, 2.1fr)', gap: '1rem', alignItems: 'start' }}>
            <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
              <div style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
                <div className="search-wrapper">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gap: 4, padding: '0.5rem' }}>
                {filteredRootMenus.map((menu) => {
                  const isSelected = menu.id === selectedParentId;
                  return (
                    <div
                      key={menu.id}
                      onClick={() => setSelectedParentId(menu.id)}
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
                          {getMenuDisplayName(menu, currentLangCode)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ActionTooltip text={menu.status === 'active' ? 'Deactivate' : 'Activate'}>
                          <button type="button" className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleChangeStatus(menu); }}>
                            {menu.status === 'active' ? <X size={16} /> : <Check size={16} />}
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text="Edit">
                          <button type="button" className="btn-icon-edit" onClick={(e) => { e.stopPropagation(); handleEdit(menu); }}>
                            <Edit size={16} />
                          </button>
                        </ActionTooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', padding: '1rem' }}>
              {!selectedParent ? (
                <div style={{ color: '#64748b' }}>Select a parent menu to view and manage sub menus.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{getMenuDisplayName(selectedParent, currentLangCode)}</h3>
                      {selectedParent.code && <span style={{ fontSize: 13, color: '#64748b' }}>({selectedParent.code})</span>}
                      <div
                        style={{ position: 'relative', flexShrink: 0 }}
                        onMouseEnter={() => setShowSelectedMenuInfoTooltip(true)}
                        onMouseLeave={() => setShowSelectedMenuInfoTooltip(false)}
                      >
                        <button
                          type="button"
                          aria-label="Menu info"
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
                          }}
                        >
                          <Info size={18} />
                        </button>
                        {showSelectedMenuInfoTooltip && (
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
                              border: '1px solid #dbe2ea',
                              background: '#ffffff',
                              color: '#334155',
                              boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            <div style={{ position: 'absolute', left: -6, top: '50%', width: 10, height: 10, background: '#ffffff', borderLeft: '1px solid #dbe2ea', borderBottom: '1px solid #dbe2ea', transform: 'translateY(-50%) rotate(45deg)' }} />
                            {selectedParent.url ? <div><strong>URL:</strong> {selectedParent.url}</div> : null}
                            {selectedParent.userType ? <div><strong>User type:</strong> {selectedParent.userType}</div> : null}
                            {!selectedParent.url && !selectedParent.userType && selectedParent.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="action-buttons">
                      <ActionTooltip text="Add Sub Menu">
                        <button
                          type="button"
                          className="btn-icon-edit"
                          onClick={() => {
                            resetForm();
                            setFormData((prev) => ({ ...prev, parentMenuId: selectedParent.id }));
                            setShowAddModal(true);
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip text="Multi-language labels">
                        <button
                          type="button"
                          className="btn-icon-edit"
                          onClick={() => openTranslationsModal(selectedParent)}
                          aria-label="Multi-language menu name"
                        >
                          <Languages size={16} />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip text="Edit">
                        <button type="button" className="btn-icon-edit" onClick={() => handleEdit(selectedParent)}>
                          <Edit size={16} />
                        </button>
                      </ActionTooltip>
                      <ActionTooltip text={selectedParent.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <button type="button" className="btn-icon-edit" onClick={() => handleChangeStatus(selectedParent)}>
                          {selectedParent.status === 'active' ? <X size={16} /> : <Check size={16} />}
                        </button>
                      </ActionTooltip>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, fontWeight: 600, color: '#64748b' }}>Nested sub menus</h4>
                    {(subMenusByParent[selectedParent.id] ?? []).length > 0 ? (
                      (subMenusByParent[selectedParent.id] ?? []).map((child) => renderMenuNode(child, 0))
                    ) : (
                      <div style={{ color: '#64748b', fontSize: 14 }}>No sub menus. Use &quot;Add Sub Menu&quot; above to add one.</div>
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
          <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Menu' : 'Add Menu'}</h2>
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
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label htmlFor="url" className="form-label">URL</label>
                  <input type="text" id="url" name="url" value={formData.url} onChange={handleInputChange} className="form-input" placeholder="/users" />
                </div>
                <div className="form-group">
                  <label htmlFor="code" className="form-label">Code</label>
                  <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} className="form-input" placeholder="user-management" />
                </div>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label htmlFor="icon" className="form-label">Icon</label>
                  <input type="text" id="icon" name="icon" value={formData.icon} onChange={handleInputChange} className="form-input" placeholder="Users" />
                </div>
                <div className="form-group">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <input type="number" id="priority" name="priority" value={formData.priority} onChange={handleInputChange} className="form-input" placeholder="0" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="parentMenuId" className="form-label">Parent Menu</label>
                <select id="parentMenuId" name="parentMenuId" value={formData.parentMenuId} onChange={handleInputChange} className="form-input">
                  <option value="">— None —</option>
                  {parentMenus.filter((m) => m.id !== editingId).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasChildMenu === 'TRUE'}
                    onChange={handleHasChildMenuChange}
                  />
                  <span className="form-label" style={{ margin: 0 }}>Has child menu</span>
                </label>
              </div>
              {formData.hasChildMenu === 'TRUE' && (
                <div className="form-group" data-permission-select-wrapper>
                  <label className="form-label">Permissions</label>
                  <div data-permission-select>
                    <Select<SelectOption, true>
                      key={`permission-select-${showAddModal}-${formData.hasChildMenu}-${editingId ?? 'new'}`}
                      classNamePrefix="selectpicker"
                      className="selectpicker-wrapper"
                      isMulti
                      placeholder={permissionsLoading ? 'Loading...' : 'Search and select permissions'}
                      options={permissionOptions}
                      value={formData.permissionIds.map((id) => {
                        const opt = permissionOptions.find((o) => o.value === id);
                        if (opt) return opt;
                        const perm = permissions.find((p) => p.id === id);
                        return { value: id, label: perm ? `${perm.name}${perm.code ? ` (${perm.code})` : ''}` : id };
                      })}
                      onChange={(opts: MultiValue<SelectOption>) =>
                        setFormData((prev) => ({ ...prev, permissionIds: (opts ?? []).map((o) => o.value) }))
                      }
                      isLoading={permissionsLoading}
                      isClearable
                      noOptionsMessage={() => (permissionsLoading ? 'Loading...' : 'No permissions found')}
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

              {editingId && (
                <div className="form-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe size={18} />
                      Multi-language labels
                    </label>
                    {!showLocaleForm && (
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={() => {
                          setEditingLocaleId(null);
                          setLocaleForm({ language: localeLanguageOptions[0]?.value ?? '', name: '' });
                          setShowLocaleForm(true);
                        }}
                      >
                        <Languages size={14} />
                        <span>Add translation</span>
                      </button>
                    )}
                  </div>
                  {showLocaleForm && (
                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 12 }}>Language</label>
                          <select
                            value={localeForm.language}
                            onChange={(e) => setLocaleForm((p) => ({ ...p, language: e.target.value }))}
                            className="form-input"
                            style={{ minHeight: 38 }}
                            disabled={localeLanguagesLoading}
                          >
                            {localeLanguagesLoading ? (
                              <>
                                <option value="">Loading...</option>
                                {localeForm.language ? <option value={localeForm.language}>{localeForm.language}</option> : null}
                              </>
                            ) : localeLanguageOptions.length === 0 ? (
                              <option value="">No active languages</option>
                            ) : (
                              localeLanguageOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 12 }}>Label</label>
                          <input
                            type="text"
                            value={localeForm.name}
                            onChange={(e) => setLocaleForm((p) => ({ ...p, name: e.target.value }))}
                            className="form-input"
                            placeholder="Display name in this language"
                            style={{ minHeight: 38 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn-primary btn-small"
                            disabled={localeSubmitting || !localeForm.language || !localeForm.name.trim()}
                            onClick={editingLocaleId ? handleUpdateLocale : handleAddLocale}
                          >
                            {editingLocaleId ? 'Update' : 'Add'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-small"
                            onClick={() => {
                              setShowLocaleForm(false);
                              setEditingLocaleId(null);
                              setLocaleForm({ language: 'EN', name: '' });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {editingLocales.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#64748b' }}>No translations yet. Add one to show this menu in other languages.</div>
                    ) : (
                      editingLocales.map((loc) => (
                        <div
                          key={loc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, marginRight: 8 }}>{String(loc.language)}</span>
                            <span style={{ color: '#475569' }}>{loc.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <ActionTooltip text="Edit">
                              <button type="button" className="btn-icon-edit" onClick={() => openEditLocale(loc)}>
                                <Edit size={14} />
                              </button>
                            </ActionTooltip>
                            <ActionTooltip text="Remove">
                              <button type="button" className="btn-icon-delete" onClick={() => handleDeleteLocale(loc.id)}>
                                <Trash2 size={14} />
                              </button>
                            </ActionTooltip>
                          </div>
                        </div>
                      ))
                    )}
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

      {showTranslationsOnlyModal && (
        <div className="modal-overlay" onClick={closeTranslationsOnlyModal}>
          <div className="modal-content organization-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: '92vw' }}>
            <div className="modal-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.35rem', margin: 0, flex: '1 1 auto' }}>
                <Languages size={24} />
                Multi-language labels
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Language</label>
                <div style={{ minWidth: 140, width: 160 }}>
                  <Select<SelectOption, false>
                    isSearchable
                    options={localeLanguageOptions}
                    value={localeLanguageOptions.find((o) => o.value === localeForm.language) ?? null}
                    onChange={(opt) => opt && handleTranslationsLanguageChange(opt.value)}
                    isLoading={localeLanguagesLoading}
                    isDisabled={localeLanguagesLoading}
                    placeholder="Search language..."
                    noOptionsMessage={() => (localeLanguageOptions.length === 0 ? 'No active languages' : 'No match')}
                    classNamePrefix="lang-select"
                    styles={{
                      control: (base) => ({ ...base, minHeight: 32, fontSize: 13 }),
                      valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                      input: (base) => ({ ...base, fontSize: 13 }),
                      singleValue: (base) => ({ ...base, fontSize: 13 }),
                      indicatorsContainer: (base) => ({ ...base, paddingRight: 4 }),
                      menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                  />
                </div>
                <button type="button" className="modal-close-btn" onClick={closeTranslationsOnlyModal} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Menu</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{translationsModalMenuName || '—'}</div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Local name</label>
                <input
                  type="text"
                  value={localeForm.name}
                  onChange={(e) => setLocaleForm((p) => ({ ...p, name: e.target.value }))}
                  className="form-input"
                  placeholder="Menu name in this language"
                  style={{ minHeight: 44, fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-primary btn-small"
                  style={{ minHeight: 42, padding: '10px 20px' }}
                  disabled={localeSubmitting || !localeForm.name.trim()}
                  onClick={editingLocaleId ? handleUpdateLocale : handleAddLocale}
                >
                  <Save size={16} />
                  <span>{editingLocaleId ? 'Update' : 'Save'}</span>
                </button>
                {editingLocaleId && (
                  <button
                    type="button"
                    className="btn-secondary btn-small"
                    style={{ minHeight: 42 }}
                    disabled={localeSubmitting}
                    onClick={async () => {
                      await handleDeleteLocale(editingLocaleId);
                      setEditingLocaleId(null);
                      setLocaleForm((p) => ({ ...p, name: '' }));
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Saved translations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {editingLocales.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#64748b', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>No translations yet. Select a language above, enter Local name, and click Save.</div>
                ) : (
                  editingLocales.map((loc) => (
                    <div
                      key={loc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontWeight: 600, color: '#475569', minWidth: 36 }}>{String(loc.language)}</span>
                        <span style={{ color: '#0f172a' }}>{loc.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <ActionTooltip text="Edit">
                          <button type="button" className="btn-icon-edit" onClick={() => handleTranslationsLanguageChange(String(loc.language))}>
                            <Edit size={14} />
                          </button>
                        </ActionTooltip>
                        <ActionTooltip text="Remove">
                          <button type="button" className="btn-icon-delete" onClick={() => handleDeleteLocale(loc.id)}>
                            <Trash2 size={14} />
                          </button>
                        </ActionTooltip>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="form-actions" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                <button type="button" className="btn-secondary" onClick={closeTranslationsOnlyModal} style={{ minHeight: 42 }}>
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
