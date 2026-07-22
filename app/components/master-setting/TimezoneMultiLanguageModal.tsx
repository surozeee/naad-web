'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edit, Languages, Save, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { ActionTooltip } from '@/app/components/common/ActionTooltip';
import { masterService, timezoneLocalApi } from '@/app/lib/master.service';
import type { TimezoneLocalResponse } from '@/app/lib/master.types';
import { formatTimezoneDisplay } from '@/app/lib/timezone-options';
import styles from './timezone-multi-language-modal.module.css';

type SelectOption = { value: string; label: string };

type Props = {
  open: boolean;
  timezoneId: string;
  timezoneName: string;
  timezoneCode: string;
  onClose: () => void;
};

export default function TimezoneMultiLanguageModal({
  open,
  timezoneId,
  timezoneName,
  timezoneCode,
  onClose,
}: Props) {
  const [localeOptions, setLocaleOptions] = useState<SelectOption[]>([]);
  const [localeLanguagesLoading, setLocaleLanguagesLoading] = useState(false);
  const [saved, setSaved] = useState<TimezoneLocalResponse[]>([]);
  const [selectedLocale, setSelectedLocale] = useState('');
  const [localName, setLocalName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSaved = useCallback(async () => {
    if (!timezoneId) return [] as TimezoneLocalResponse[];
    try {
      const list = await timezoneLocalApi.getByTimezoneId(timezoneId);
      setSaved(list);
      return list;
    } catch {
      setSaved([]);
      return [] as TimezoneLocalResponse[];
    }
  }, [timezoneId]);

  const loadLocaleOptions = useCallback(async () => {
    setLocaleLanguagesLoading(true);
    try {
      const res = await masterService.language.listActive();
      const list = (res.data ?? []) as unknown as Record<string, unknown>[];
      const options = list
        .map((item) => {
          const code = String(item.code ?? '').trim().toUpperCase();
          const name = String(item.name ?? code);
          if (!code || item.isDefault === true) return null;
          return { value: code, label: `${name} (${code})` };
        })
        .filter((o): o is SelectOption => o != null);
      setLocaleOptions(options);
      return options;
    } catch {
      setLocaleOptions([]);
      return [] as SelectOption[];
    } finally {
      setLocaleLanguagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [options, list] = await Promise.all([loadLocaleOptions(), loadSaved()]);
      if (cancelled) return;
      const first = list?.[0];
      if (first) {
        setSelectedLocale(String(first.language ?? ''));
        setLocalName(first.name ?? '');
        setEditingId(first.id);
      } else {
        const firstOpt = options[0]?.value ?? '';
        setSelectedLocale(firstOpt);
        setLocalName('');
        setEditingId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadLocaleOptions, loadSaved]);

  const handleLanguageChange = (code: string) => {
    setSelectedLocale(code);
    const existing = saved.find((l) => String(l.language).toUpperCase() === code.toUpperCase());
    if (existing) {
      setEditingId(existing.id);
      setLocalName(existing.name ?? '');
    } else {
      setEditingId(null);
      setLocalName('');
    }
  };

  const handleSave = async () => {
    const name = localName.trim();
    if (!name) {
      await Swal.fire({ title: 'Local name is required', icon: 'warning', timer: 1600, showConfirmButton: false });
      return;
    }
    if (!selectedLocale) {
      await Swal.fire({
        title: 'No language selected',
        text: 'Add an active non-default language first.',
        icon: 'info',
      });
      return;
    }
    setSubmitting(true);
    try {
      const body = { timezoneId, language: selectedLocale, name };
      const savedRow = await timezoneLocalApi.upsert(body);
      const list = await loadSaved();
      const current =
        list.find((l) => String(l.language).toUpperCase() === selectedLocale.toUpperCase()) ??
        savedRow;
      setEditingId(current?.id ?? null);
      setLocalName(current?.name ?? name);
      await Swal.fire({
        title: 'Saved',
        text: 'Timezone locale label saved.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Save failed',
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    const result = await Swal.fire({
      title: 'Remove locale label?',
      text: 'This removes the localized timezone name for that language.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'No',
      confirmButtonColor: '#b91c1c',
    });
    if (!result.isConfirmed) return;
    try {
      await timezoneLocalApi.delete(id);
      const list = await loadSaved();
      if (editingId === id) {
        setEditingId(null);
        setLocalName('');
      }
      const still = list.find((l) => String(l.language).toUpperCase() === selectedLocale.toUpperCase());
      if (still) {
        setEditingId(still.id);
        setLocalName(still.name ?? '');
      }
      await Swal.fire({ title: 'Removed', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err instanceof Error ? err.message : 'Delete failed',
        icon: 'error',
      });
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal-content organization-modal ${styles.panel}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="timezone-local-modal-title"
      >
        <div className={`modal-header ${styles.header}`}>
          <h2 id="timezone-local-modal-title" className={styles.title}>
            <Languages size={24} aria-hidden />
            Multi-language labels
          </h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.entityCard}>
            <div className={styles.entityEyebrow}>Master timezone</div>
            <div className={styles.entityName}>
              {formatTimezoneDisplay(timezoneName) || timezoneName || '—'}
              {timezoneCode ? <span className={styles.entityCode}>{timezoneCode}</span> : null}
            </div>
          </div>

          <div className={styles.fieldsRow}>
            <div className={styles.localeField}>
              <label className={styles.fieldLabel} htmlFor="timezone-local-locale">
                Locale
              </label>
              <select
                id="timezone-local-locale"
                className={`form-input ${styles.localeSelect}`}
                value={selectedLocale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={localeLanguagesLoading || localeOptions.length === 0}
              >
                {localeOptions.length === 0 ? (
                  <option value="">
                    {localeLanguagesLoading ? 'Loading languages…' : 'No other active languages'}
                  </option>
                ) : (
                  localeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.localField}>
              <label className={styles.fieldLabel} htmlFor="timezone-local-name">
                Local name
              </label>
              <input
                id="timezone-local-name"
                type="text"
                className={`form-input ${styles.localInput}`}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="e.g. काठमाडौं"
                disabled={!selectedLocale || submitting}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className="btn-primary btn-small"
              disabled={submitting || !selectedLocale || !localName.trim()}
              onClick={() => void handleSave()}
            >
              <Save size={16} />
              <span>{editingId ? 'Update' : 'Save'}</span>
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn-secondary btn-small"
                disabled={submitting}
                onClick={() => void handleRemove(editingId)}
              >
                <Trash2 size={16} />
                <span>Remove</span>
              </button>
            ) : null}
          </div>

          <div className={styles.savedTitle}>Saved locales</div>
          <div className={styles.savedList}>
            {saved.length === 0 ? (
              <div className={styles.empty}>No locale labels yet.</div>
            ) : (
              saved.map((loc) => (
                <div key={loc.id} className={styles.savedRow}>
                  <div className={styles.savedMain}>
                    <span className={styles.savedCode}>{String(loc.language)}</span>
                    <span className={styles.savedName}>{loc.name}</span>
                  </div>
                  <div className={styles.savedActions}>
                    <ActionTooltip text="Edit">
                      <button
                        type="button"
                        className="btn-icon-edit"
                        onClick={() => handleLanguageChange(String(loc.language))}
                      >
                        <Edit size={14} />
                      </button>
                    </ActionTooltip>
                    <ActionTooltip text="Remove">
                      <button
                        type="button"
                        className="btn-icon-delete"
                        onClick={() => void handleRemove(loc.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </ActionTooltip>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="form-actions" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
            <button type="button" className={`btn-secondary ${styles.closeBtn}`} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
