'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { colorApi } from '@/app/lib/master.service';
import type { ColorResponse } from '@/app/lib/master.types';

/** Fallback palette if Color API is unavailable (matches backend seed). */
export const HOROSCOPE_LUCKY_COLORS = [
  { name: 'Red', hex: '#DC2626' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Pink', hex: '#DB2777' },
  { name: 'White', hex: '#F8FAFC' },
  { name: 'Silver', hex: '#94A3B8' },
  { name: 'Gold', hex: '#D4A017' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Black', hex: '#0F172A' },
] as const;

export type HoroscopeLuckyColorName = (typeof HOROSCOPE_LUCKY_COLORS)[number]['name'];

const MAX_COLORS = 6;

export type LuckyColorSwatch = {
  id?: string;
  name: string;
  hex: string;
  isSystem?: boolean;
};

export function parseLuckyColors(value?: string | null): string[] {
  if (!value?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(/[,|/]+/)) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function serializeLuckyColors(colors: string[]): string {
  return colors.map((c) => c.trim()).filter(Boolean).join(', ');
}

function normalizeHex(value: string): string | null {
  const raw = value.trim();
  const match = raw.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

function isLightHex(hex: string): boolean {
  const h = normalizeHex(hex);
  if (!h) return false;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

function toSwatches(items: ColorResponse[]): LuckyColorSwatch[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    hex: normalizeHex(c.hexCode) ?? c.hexCode,
    isSystem: Boolean(c.isSystem),
  }));
}

interface HoroscopeColorPickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  max?: number;
}

/** Multi-select lucky color swatches; stored as comma-separated names. Palette from Color master API. */
export function HoroscopeColorPicker({
  value,
  onChange,
  label = 'Lucky colors',
  className = '',
  max = MAX_COLORS,
}: HoroscopeColorPickerProps) {
  const [palette, setPalette] = useState<LuckyColorSwatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#6366F1');
  const [customError, setCustomError] = useState('');

  const loadPalette = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await colorApi.listActive();
      const items = ((res.data ?? []) as ColorResponse[]).filter(
        (c) => !c.status || String(c.status).toUpperCase() === 'ACTIVE'
      );
      // Only active colors from master — no hardcoded fallback when API succeeds.
      setPalette(toSwatches(items));
    } catch {
      setPalette([]);
      setLoadError('Could not load active colors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPalette();
  }, [loadPalette]);

  const selected = useMemo(() => parseLuckyColors(value), [value]);
  const selectedKeys = useMemo(
    () => new Set(selected.map((c) => c.toLowerCase())),
    [selected]
  );

  const findSwatch = (name: string): LuckyColorSwatch | undefined => {
    const key = name.trim().toLowerCase();
    const fromPalette = palette.find((c) => c.name.toLowerCase() === key);
    if (fromPalette) return fromPalette;
    const asHex = normalizeHex(name);
    if (asHex) return { name, hex: asHex };
    return undefined;
  };

  const toggle = (name: string) => {
    const key = name.toLowerCase();
    const exists = selectedKeys.has(key);
    if (exists) {
      onChange(serializeLuckyColors(selected.filter((c) => c.toLowerCase() !== key)));
      return;
    }
    if (selected.length >= max) return;
    onChange(serializeLuckyColors([...selected, name]));
  };

  const remove = (name: string) => {
    onChange(serializeLuckyColors(selected.filter((c) => c.toLowerCase() !== name.toLowerCase())));
  };

  const removeFromPalette = async (swatch: LuckyColorSwatch) => {
    if (swatch.isSystem || !swatch.id) return;
    try {
      await colorApi.delete(swatch.id);
      if (selectedKeys.has(swatch.name.toLowerCase())) remove(swatch.name);
      await loadPalette();
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Failed to remove color');
    }
  };

  const addCustomColor = async () => {
    const name = customName.trim();
    const hex = normalizeHex(customHex);
    if (!name) {
      setCustomError('Enter a color name');
      return;
    }
    if (!hex) {
      setCustomError('Pick a valid color');
      return;
    }
    if (palette.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setCustomError('That color name already exists');
      return;
    }

    setSaving(true);
    setCustomError('');
    try {
      await colorApi.create({ name, hexCode: hex });
      await loadPalette();
      if (!selectedKeys.has(name.toLowerCase()) && selected.length < max) {
        onChange(serializeLuckyColors([...selected, name]));
      }
      setCustomName('');
      setCustomHex('#6366F1');
      setShowCustomForm(false);
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Failed to save color');
    } finally {
      setSaving(false);
    }
  };

  const renderSwatch = (color: LuckyColorSwatch) => {
    const isOn = selectedKeys.has(color.name.toLowerCase());
    const disabled = !isOn && selected.length >= max;
    const light = isLightHex(color.hex);
    const canRemove = Boolean(color.id && !color.isSystem);
    return (
      <div key={color.id ?? color.name} className="relative group">
        <button
          type="button"
          title={color.name}
          disabled={disabled}
          aria-pressed={isOn}
          onClick={() => toggle(color.name)}
          className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
            isOn
              ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/25 scale-105'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{ backgroundColor: color.hex }}
        >
          {isOn ? (
            <Check
              size={14}
              strokeWidth={3}
              className={light ? 'text-slate-800' : 'text-white'}
            />
          ) : null}
          <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
            {color.name}
          </span>
        </button>
        {canRemove ? (
          <button
            type="button"
            title={`Remove ${color.name} from palette`}
            aria-label={`Remove ${color.name} from palette`}
            onClick={(e) => {
              e.stopPropagation();
              void removeFromPalette(color);
            }}
            className="absolute -right-1 -top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white"
          >
            <X size={9} />
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-2 min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-black dark:text-white">{label}</span>
        <span className="text-[10px] horoscope-muted">
          {loading ? 'Loading…' : `${selected.length}/${max} selected`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {palette.map((color) => renderSwatch(color))}
        <button
          type="button"
          title="Add custom color"
          aria-label="Add custom color"
          aria-expanded={showCustomForm}
          onClick={() => {
            setShowCustomForm((open) => !open);
            setCustomError('');
          }}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed transition-colors ${
            showCustomForm
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-slate-300 text-slate-500 hover:border-slate-500 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-400'
          }`}
        >
          <Plus size={16} strokeWidth={2.25} />
        </button>
      </div>

      {!loading && loadError ? (
        <p className="text-[11px] text-red-600">{loadError}</p>
      ) : null}
      {!loading && !loadError && palette.length === 0 ? (
        <p className="text-[10px] horoscope-muted">
          No active colors. Activate colors in Master Setting → General → Color.
        </p>
      ) : null}

      {showCustomForm ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider horoscope-muted">
            New custom color
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 min-w-[7rem]">
              <span className="text-[10px] horoscope-muted">Swatch</span>
              <input
                type="color"
                value={normalizeHex(customHex) ?? '#6366F1'}
                onChange={(e) => setCustomHex(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 dark:border-slate-600 bg-transparent p-0.5"
              />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[10rem]">
              <span className="text-[10px] horoscope-muted">Name</span>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  if (customError) setCustomError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void addCustomColor();
                  }
                }}
                placeholder="e.g. Coral"
                className="form-input text-sm py-1.5 h-9"
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void addCustomColor()}
              className="h-9 px-3 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add color'}
            </button>
          </div>
          {customError ? <p className="text-[11px] text-red-600">{customError}</p> : null}
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((name) => {
            const swatch = findSwatch(name);
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 pl-1.5 pr-2 py-0.5 text-[11px] font-medium text-black dark:text-white"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0"
                  style={{ backgroundColor: swatch?.hex ?? '#64748b' }}
                />
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => remove(name)}
                  className="rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] horoscope-muted">Select one or more lucky colors</p>
      )}
    </div>
  );
}
