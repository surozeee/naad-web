'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import styles from './birth-time-field.module.css';

type Props = {
  id?: string;
  value: string; // HH:mm (24h)
  onChange: (hhMm: string) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

type Parts12 = { hour12: number; minute: number; period: 'AM' | 'PM' };
type ClockMode = 'hour' | 'minute';
type Placement = 'below' | 'above';

const CX = 120;
const CY = 120;
const R_NUM = 78;
const R_HAND = 62;
/** Approximate popover height used before first measure */
const POPOVER_FALLBACK_HEIGHT = 340;
const VIEWPORT_GAP = 8;

function normalizeHhMm(raw: string): string {
  const m = String(raw ?? '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '10:30';
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function toParts12(hhMm: string): Parts12 {
  const [hStr, mStr] = normalizeHhMm(hhMm).split(':');
  const h24 = parseInt(hStr!, 10);
  const minute = parseInt(mStr!, 10);
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour12, minute, period };
}

function toHhMm24(parts: Parts12): string {
  let h24 = parts.hour12 % 12;
  if (parts.period === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

function formatDisplay(hhMm: string): string {
  const { hour12, minute, period } = toParts12(hhMm);
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

/** Angle for clock value: 12 at top, clockwise. stepCount=12 for hours, 60 for minutes. */
function valueToAngle(value: number, stepCount: number): number {
  const normalized = ((value % stepCount) + stepCount) % stepCount;
  return (normalized / stepCount) * 360 - 90;
}

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * radius,
    y: CY + Math.sin(rad) * radius,
  };
}

function angleFromPointer(clientX: number, clientY: number, rect: DOMRect): number {
  const x = clientX - (rect.left + rect.width / 2);
  const y = clientY - (rect.top + rect.height / 2);
  let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

function hourFromAngle(deg: number): number {
  const raw = Math.round(deg / 30) % 12;
  return raw === 0 ? 12 : raw;
}

function minuteFromAngle(deg: number): number {
  return Math.round(deg / 6) % 60;
}

/**
 * Birth-time field with analog clock picker (hour dial → minute dial).
 * Closes on outside click / Escape. Emits 24h `HH:mm` for kundali APIs.
 */
export function BirthTimeField({ id, value, onChange, disabled, 'aria-label': ariaLabel }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const modeRef = useRef<ClockMode>('hour');
  const partsRef = useRef<Parts12>(toParts12(value));
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ClockMode>('hour');
  const [placement, setPlacement] = useState<Placement>('below');
  const display = normalizeHhMm(value);
  const parts = useMemo(() => toParts12(display), [display]);

  partsRef.current = parts;
  modeRef.current = mode;

  const updatePlacement = useCallback(() => {
    const trigger = rootRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const popoverH = popoverRef.current?.offsetHeight || POPOVER_FALLBACK_HEIGHT;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
    const spaceAbove = rect.top - VIEWPORT_GAP;
    // Prefer below; flip above when bottom can't fit and top has more room.
    if (spaceBelow < popoverH && spaceAbove > spaceBelow) {
      setPlacement('above');
    } else {
      setPlacement('below');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: Event) => {
      if (draggingRef.current) return;
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setMode('hour');
    updatePlacement();
    // Re-measure after paint (real popover height) and on viewport changes.
    const raf = requestAnimationFrame(updatePlacement);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, updatePlacement]);

  const commit = useCallback(
    (next: Parts12) => {
      partsRef.current = next;
      onChange(toHhMm24(next));
    },
    [onChange]
  );

  const applyFromPointer = useCallback(
    (clientX: number, clientY: number, finish: boolean) => {
      const svg = dialRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const deg = angleFromPointer(clientX, clientY, rect);
      const current = partsRef.current;
      if (modeRef.current === 'hour') {
        commit({ ...current, hour12: hourFromAngle(deg) });
        if (finish) setMode('minute');
      } else {
        commit({ ...current, minute: minuteFromAngle(deg) });
      }
    },
    [commit]
  );

  const onDialPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    applyFromPointer(e.clientX, e.clientY, false);
  };

  const onDialPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    applyFromPointer(e.clientX, e.clientY, false);
  };

  const onDialPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    applyFromPointer(e.clientX, e.clientY, true);
  };

  const toggle = () => {
    if (disabled) return;
    setOpen((wasOpen) => {
      if (!wasOpen && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
        const spaceAbove = rect.top - VIEWPORT_GAP;
        setPlacement(
          spaceBelow < POPOVER_FALLBACK_HEIGHT && spaceAbove > spaceBelow ? 'above' : 'below'
        );
      }
      return !wasOpen;
    });
  };

  const handAngle =
    mode === 'hour' ? valueToAngle(parts.hour12 % 12, 12) : valueToAngle(parts.minute, 60);
  const handTip = polar(handAngle, R_HAND);

  const hourTicks = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const p = polar(valueToAngle(n % 12, 12), R_NUM);
    return { n, ...p, active: parts.hour12 === n };
  });

  const minuteTicks = Array.from({ length: 12 }, (_, i) => {
    const n = i * 5;
    const p = polar(valueToAngle(n, 60), R_NUM);
    return { n, ...p, active: parts.minute === n };
  });

  return (
    <div
      ref={rootRef}
      className={`${styles.wrap} ${disabled ? styles.disabled : ''} ${open ? styles.open : ''}`.trim()}
      role="group"
      aria-label={ariaLabel ?? 'Time of birth'}
    >
      <button
        type="button"
        className={styles.iconBtn}
        disabled={disabled}
        aria-label="Open time picker"
        tabIndex={-1}
        onClick={(e) => {
          e.preventDefault();
          toggle();
        }}
      >
        <Clock size={16} strokeWidth={2} />
      </button>

      <button
        type="button"
        id={id}
        className={styles.trigger}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Time of birth'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        {formatDisplay(display)}
      </button>

      {open && !disabled ? (
        <div
          ref={popoverRef}
          className={`${styles.popover} ${placement === 'above' ? styles.popoverAbove : styles.popoverBelow}`.trim()}
          role="dialog"
          aria-label="Choose time"
        >
          <div className={styles.clockHeader}>
            <button
              type="button"
              className={`${styles.seg} ${mode === 'hour' ? styles.segActive : ''}`.trim()}
              aria-pressed={mode === 'hour'}
              onClick={() => setMode('hour')}
            >
              {String(parts.hour12).padStart(2, '0')}
            </button>
            <span className={styles.colon} aria-hidden>
              :
            </span>
            <button
              type="button"
              className={`${styles.seg} ${mode === 'minute' ? styles.segActive : ''}`.trim()}
              aria-pressed={mode === 'minute'}
              onClick={() => setMode('minute')}
            >
              {String(parts.minute).padStart(2, '0')}
            </button>
            <div className={styles.periodToggle} role="group" aria-label="AM or PM">
              <button
                type="button"
                className={`${styles.periodBtn} ${parts.period === 'AM' ? styles.periodActive : ''}`.trim()}
                aria-pressed={parts.period === 'AM'}
                onClick={() => commit({ ...parts, period: 'AM' })}
              >
                AM
              </button>
              <button
                type="button"
                className={`${styles.periodBtn} ${parts.period === 'PM' ? styles.periodActive : ''}`.trim()}
                aria-pressed={parts.period === 'PM'}
                onClick={() => commit({ ...parts, period: 'PM' })}
              >
                PM
              </button>
            </div>
          </div>

          <div className={styles.clockBody}>
            <svg
              ref={dialRef}
              className={styles.dial}
              viewBox="0 0 240 240"
              role="slider"
              aria-label={mode === 'hour' ? 'Hour dial' : 'Minute dial'}
              aria-valuemin={mode === 'hour' ? 1 : 0}
              aria-valuemax={mode === 'hour' ? 12 : 59}
              aria-valuenow={mode === 'hour' ? parts.hour12 : parts.minute}
              onPointerDown={onDialPointerDown}
              onPointerMove={onDialPointerMove}
              onPointerUp={onDialPointerUp}
              onPointerCancel={() => {
                draggingRef.current = false;
              }}
            >
              <circle className={styles.dialFace} cx={CX} cy={CY} r="104" />
              <line
                className={styles.hand}
                x1={CX}
                y1={CY}
                x2={handTip.x}
                y2={handTip.y}
              />
              <circle className={styles.handKnob} cx={handTip.x} cy={handTip.y} r="18" />
              <circle className={styles.centerDot} cx={CX} cy={CY} r="5" />

              {(mode === 'hour' ? hourTicks : minuteTicks).map((t) => (
                <g key={t.n}>
                  <circle
                    className={`${styles.tickHit} ${t.active ? styles.tickHitActive : ''}`.trim()}
                    cx={t.x}
                    cy={t.y}
                    r="18"
                  />
                  <text
                    className={`${styles.tickLabel} ${t.active ? styles.tickLabelActive : ''}`.trim()}
                    x={t.x}
                    y={t.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {mode === 'hour' ? t.n : String(t.n).padStart(2, '0')}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className={styles.clockFooter}>
            <button type="button" className={styles.footerBtn} onClick={() => setOpen(false)}>
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
