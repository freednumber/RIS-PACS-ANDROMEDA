"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface SliceSliderProps {
  totalSlices: number;
  currentSlice: number;
  onSliceChange: (sliceIdx: number) => void;
  activeViewportLabel?: string;
  sequenceName?: string;
}

export default function SliceSlider({ totalSlices, currentSlice, onSliceChange, activeViewportLabel = 'VP', sequenceName = '' }: SliceSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const displayIdx = isDragging && dragValue !== null ? dragValue : currentSlice;
  const n = totalSlices;

  const clientXToIndex = useCallback((clientX: number): number => {
    if (!trackRef.current || n <= 1) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * (n - 1);
  }, [n]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const idx = clientXToIndex(clientX);
      setDragValue(idx);
      onSliceChange(Math.round(idx)); // live update while dragging
    };
    const onUp = (e: MouseEvent | TouchEvent) => {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const snapped = Math.max(0, Math.min(n - 1, Math.round(clientXToIndex(clientX))));
      onSliceChange(snapped);
      setIsDragging(false);
      setDragValue(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, clientXToIndex, n, onSliceChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return;
    let next = currentSlice;
    if (e.key === 'ArrowLeft') { e.preventDefault(); next = Math.max(0, currentSlice - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next = Math.min(n - 1, currentSlice + 1); }
    else if (e.key === 'Home') { e.preventDefault(); next = 0; }
    else if (e.key === 'End') { e.preventDefault(); next = n - 1; }
    if (next !== currentSlice) onSliceChange(next);
  };

  const handlePct = n <= 1 ? 50 : (displayIdx / (n - 1)) * 100;
  if (n === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(8,8,8,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', userSelect: 'none', flexShrink: 0 }}>
      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 48, flexShrink: 0 }}>
        <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>ACTIVE</span>
        <span style={{ fontSize: 9, fontWeight: 900, color: '#FFCC00', fontFamily: 'monospace' }}>{activeViewportLabel}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label={`Slice selector for ${activeViewportLabel}`}
        aria-valuenow={Math.round(displayIdx) + 1}
        aria-valuemin={1}
        aria-valuemax={n}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ position: 'relative', flex: 1, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', outline: 'none' }}
        onMouseDown={e => { e.preventDefault(); setIsDragging(true); setDragValue(clientXToIndex(e.clientX)); onSliceChange(Math.round(clientXToIndex(e.clientX))); }}
      >
        {/* Track line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
          <div style={{ position: 'absolute', left: 0, width: `${handlePct}%`, top: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(255,204,0,0.4), rgba(255,204,0,0.7))', borderRadius: 2, transition: isDragging ? 'none' : 'width 120ms ease-out' }} />
        </div>

        {/* Handle */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: `${handlePct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: isDragging ? 20 : 16, height: isDragging ? 20 : 16, borderRadius: '50%', background: 'radial-gradient(circle, #FFE066 0%, #FFCC00 100%)', boxShadow: isDragging ? '0 0 20px rgba(255,204,0,0.8)' : '0 0 12px rgba(255,204,0,0.5), 0 2px 8px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.3)', zIndex: 20, cursor: isDragging ? 'grabbing' : 'grab', transition: isDragging ? 'none' : 'left 120ms cubic-bezier(0.34, 1.56, 0.64, 1), width 100ms ease, height 100ms ease' }}
        />
      </div>

      {/* Info readout */}
      <div style={{ minWidth: 100, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#FFCC00', fontFamily: 'monospace', textAlign: 'right', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sequenceName}>
          {sequenceName || '—'}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          Slice: {Math.round(Math.max(0, Math.min(n - 1, displayIdx))) + 1} / {n}
        </span>
      </div>
    </div>
  );
}
