'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const TOOLTIP_OFFSET = 8;
const Z_INDEX = 1000000;

type ActionTooltipProps = {
  text: string;
  children: React.ReactNode;
};

export function ActionTooltip({ text, children }: ActionTooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placeAbove, setPlaceAbove] = useState(true);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 600;
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 800;
    const tooltipH = 40;
    const above = rect.top - tooltipH - TOOLTIP_OFFSET >= 4;
    setPlaceAbove(above);
    setPosition({
      left: Math.max(12, Math.min(viewportW - 12, centerX)),
      top: above ? rect.top - TOOLTIP_OFFSET : rect.bottom + TOOLTIP_OFFSET,
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

  const tooltipEl =
    show &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        role="tooltip"
        style={{
          position: 'fixed',
          left: position.left,
          top: position.top,
          transform: `translate(-50%, ${placeAbove ? '-100%' : '0'})`,
          zIndex: Z_INDEX,
          padding: '6px 10px',
          borderRadius: 6,
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '0.75rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {text}
      </div>,
      document.body
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
      {tooltipEl}
    </>
  );
}
