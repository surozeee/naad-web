'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Settings2, FolderOpen, Key, Save, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Breadcrumb from '../../components/common/Breadcrumb';
import {
  settingService,
  settingCategoryService,
  settingDetailService,
} from '@/app/lib/setting.service';
import type {
  SettingResponse,
  SettingCategoryResponse,
  SettingDetailResponse,
} from '@/app/lib/setting.types';

const PAGE_SIZE = 100;

type EditedValues = Record<string, string>;

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SettingResponse[]>([]);
  const [selectedSettingId, setSelectedSettingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<SettingCategoryResponse[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [detailsByCategoryId, setDetailsByCategoryId] = useState<Record<string, SettingDetailResponse[]>>({});
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<EditedValues>({});
  const [savingDetailId, setSavingDetailId] = useState<string | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDetailValue = (d: SettingDetailResponse) =>
    editedValues[d.id] !== undefined ? editedValues[d.id] : (d.value ?? '');

  const setDetailValue = (detailId: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [detailId]: value }));
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await settingService.list({
        pageNo: 0,
        pageSize: PAGE_SIZE,
        sortBy: 'name',
        direction: 'asc',
      });
      const list = (res.data?.result ?? (res as { result?: SettingResponse[] }).result ?? []) as SettingResponse[];
      setSettings(list);
      if (list.length > 0 && !selectedSettingId) {
        setSelectedSettingId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSettingId]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchCategories = useCallback(async (settingId: string) => {
    setCategoriesLoading(true);
    try {
      const res = await settingCategoryService.list({
        settingId,
        pageNo: 0,
        pageSize: PAGE_SIZE,
        sortBy: 'name',
        direction: 'asc',
      });
      const list = (res.data?.result ?? (res as { result?: SettingCategoryResponse[] }).result ?? []) as SettingCategoryResponse[];
      setCategories(list);
      setExpandedCategoryIds(new Set());
      setDetailsByCategoryId((prev) => {
        const next = { ...prev };
        list.forEach((c) => {
          if (!(c.id in next)) next[c.id] = [];
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSettingId) fetchCategories(selectedSettingId);
    else setCategories([]);
  }, [selectedSettingId, fetchCategories]);

  const fetchDetails = useCallback(async (settingCategoryId: string) => {
    setDetailsLoading((prev) => ({ ...prev, [settingCategoryId]: true }));
    try {
      const res = await settingDetailService.list({
        settingCategoryId,
        pageNo: 0,
        pageSize: PAGE_SIZE,
        sortBy: 'key',
        direction: 'asc',
      });
      const list = (res.data?.result ?? (res as { result?: SettingDetailResponse[] }).result ?? []) as SettingDetailResponse[];
      setDetailsByCategoryId((prev) => ({ ...prev, [settingCategoryId]: list }));
    } catch {
      setDetailsByCategoryId((prev) => ({ ...prev, [settingCategoryId]: [] }));
    } finally {
      setDetailsLoading((prev) => ({ ...prev, [settingCategoryId]: false }));
    }
  }, []);

  const toggleCategory = (categoryId: string) => {
    const isExpanding = !expandedCategoryIds.has(categoryId);
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
    if (isExpanding && (detailsByCategoryId[categoryId]?.length ?? 0) === 0 && !detailsLoading[categoryId]) {
      fetchDetails(categoryId);
    }
  };

  const saveCategory = useCallback(
    async (categoryId: string) => {
      const details = detailsByCategoryId[categoryId] ?? [];
      if (details.length === 0) return;
      setSavingCategoryId(categoryId);
      setError(null);
      try {
        await settingDetailService.bulkUpdate({
          settingCategoryId: categoryId,
          details: details.map((d) => ({
            key: d.key,
            value: editedValues[d.id] !== undefined ? editedValues[d.id] : (d.value ?? ''),
            displayName: d.displayName,
          })),
        });
        setEditedValues((prev) => {
          const next = { ...prev };
          details.forEach((d) => delete next[d.id]);
          return next;
        });
        await fetchDetails(categoryId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSavingCategoryId(null);
      }
    },
    [detailsByCategoryId, editedValues, fetchDetails]
  );

  const saveOneDetail = useCallback(
    async (categoryId: string, d: SettingDetailResponse) => {
      setSavingDetailId(d.id);
      setError(null);
      const value = editedValues[d.id] !== undefined ? editedValues[d.id] : (d.value ?? '');
      try {
        await settingDetailService.bulkUpdate({
          settingCategoryId: categoryId,
          details: [{ key: d.key, value, displayName: d.displayName }],
        });
        setEditedValues((prev) => {
          const next = { ...prev };
          delete next[d.id];
          return next;
        });
        await fetchDetails(categoryId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setSavingDetailId(null);
      }
    },
    [editedValues, fetchDetails]
  );

  const selectedSetting = settings.find((s) => s.id === selectedSettingId);

  return (
    <DashboardLayout>
      <div className="organization-page">
        <style>{`
          @keyframes system-settings-spin {
            to { transform: rotate(360deg); }
          }
          .system-settings-spin { animation: system-settings-spin 0.8s linear infinite; }
        `}</style>
        <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'Configuration' }]} />

        <div className="page-header-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings2 size={28} style={{ color: '#64748b' }} />
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>
                System Settings
              </h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Setting → Category → Detail (tabs, collapse, detail)
              </p>
            </div>
          </div>
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

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading settings...</div>
        ) : settings.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No settings found.</div>
        ) : (
          <>
            <div
              role="tablist"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                borderBottom: '1px solid #e2e8f0',
                marginBottom: 20,
                paddingBottom: 0,
              }}
            >
              {settings.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={selectedSettingId === s.id}
                  type="button"
                  onClick={() => setSelectedSettingId(s.id)}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderBottom: selectedSettingId === s.id ? '2px solid #2563eb' : '2px solid transparent',
                    background: selectedSettingId === s.id ? '#eff6ff' : 'transparent',
                    color: selectedSettingId === s.id ? '#1d4ed8' : '#475569',
                    fontWeight: selectedSettingId === s.id ? 600 : 500,
                    cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    marginBottom: -1,
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {selectedSettingId && (
              <div style={{ maxWidth: 900 }}>
                {selectedSetting?.description && (
                  <p style={{ color: '#64748b', marginBottom: 16, fontSize: '0.875rem' }}>
                    {selectedSetting.description}
                  </p>
                )}

                {categoriesLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No categories for this setting.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categories.map((cat) => {
                      const isExpanded = expandedCategoryIds.has(cat.id);
                      const details = detailsByCategoryId[cat.id] ?? [];
                      const loadingDetails = detailsLoading[cat.id];

                      return (
                        <div
                          key={cat.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: '#fff',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '14px 16px',
                              border: 'none',
                              background: isExpanded ? '#f8fafc' : '#fafafa',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontWeight: 500,
                              color: '#334155',
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown size={20} style={{ flexShrink: 0, color: '#64748b' }} />
                            ) : (
                              <ChevronRight size={20} style={{ flexShrink: 0, color: '#64748b' }} />
                            )}
                            <FolderOpen size={18} style={{ flexShrink: 0, color: '#64748b' }} />
                            <span>{cat.name}</span>
                            {cat.description && (
                              <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.875rem' }}>
                                — {cat.description}
                              </span>
                            )}
                          </button>

                          {isExpanded && (
                            <div
                              style={{
                                padding: '12px 16px 16px 44px',
                                borderTop: '1px solid #e2e8f0',
                                background: '#fff',
                              }}
                            >
                              {loadingDetails ? (
                                <div style={{ padding: '12px 0', color: '#64748b', fontSize: '0.875rem' }}>
                                  Loading details...
                                </div>
                              ) : details.length === 0 ? (
                                <div style={{ padding: '12px 0', color: '#94a3b8', fontSize: '0.875rem' }}>
                                  No details.
                                </div>
                              ) : (
                                <>
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(2, 1fr)',
                                      gap: 12,
                                    }}
                                  >
                                    {details.map((d) => (
                                      <div
                                        key={d.id}
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 4,
                                          padding: '10px 12px',
                                          border: '1px solid #e2e8f0',
                                          borderRadius: 8,
                                          background: '#fafbfc',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <Key size={14} style={{ flexShrink: 0, color: '#94a3b8' }} />
                                          <span style={{ fontWeight: 500, color: '#334155', fontSize: '0.8125rem' }}>
                                            {d.displayName || d.key}
                                          </span>
                                        </div>
                                        {d.displayName && d.displayName !== d.key && (
                                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{d.key}</div>
                                        )}
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                                          <input
                                            type="text"
                                            value={getDetailValue(d)}
                                            onChange={(e) => setDetailValue(d.id, e.target.value)}
                                            placeholder="Value"
                                            style={{
                                              flex: 1,
                                              minWidth: 0,
                                              padding: '8px 10px',
                                              fontSize: '0.8125rem',
                                              border: '1px solid #e2e8f0',
                                              borderRadius: 6,
                                              background: '#fff',
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => saveOneDetail(cat.id, d)}
                                            disabled={savingDetailId !== null}
                                            style={{
                                              flexShrink: 0,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: 4,
                                              padding: '6px 10px',
                                              fontSize: '0.75rem',
                                              fontWeight: 500,
                                              color: '#2563eb',
                                              background: '#eff6ff',
                                              border: '1px solid #bfdbfe',
                                              borderRadius: 6,
                                              cursor: savingDetailId !== null ? 'not-allowed' : 'pointer',
                                            }}
                                          >
                                            {savingDetailId === d.id ? (
                                              <Loader2 size={12} className="system-settings-spin" />
                                            ) : (
                                              <Save size={12} />
                                            )}
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ marginTop: 12 }}>
                                    <button
                                      type="button"
                                      onClick={() => saveCategory(cat.id)}
                                      disabled={savingCategoryId !== null}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '8px 14px',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        color: '#fff',
                                        background: '#2563eb',
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: savingCategoryId !== null ? 'not-allowed' : 'pointer',
                                      }}
                                    >
                                      {savingCategoryId === cat.id ? (
                                        <Loader2 size={16} className="system-settings-spin" />
                                      ) : (
                                        <Save size={16} />
                                      )}
                                      Save all in this category
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
