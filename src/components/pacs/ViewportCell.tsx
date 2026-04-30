"use client";
import React, { useEffect, useRef, useState } from 'react';
import Viewport, { SeriesData } from '@/components/Viewport';
import type { ViewportGeometry } from '@/lib/dicomGeometry';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type ViewportState = 'active' | 'linked' | 'inactive';

export interface ViewportCellProps {
  /** Unique id for this viewport slot */
  id: string;
  /** Display index (0-based) used by Viewport internally */
  viewportIndex: number;
  /** All series available in the study */
  allSeries: SeriesData[];
  /** Which series is currently assigned to this cell */
  assignedSeriesIdx: number;
  /** Visual selection state */
  selectionState: ViewportState;
  /** Callback when user clicks this cell */
  onActivate: () => void;
  /** Whether a sequence transition animation should play */
  isTransitioning?: boolean;
  /* ── Pass-through props for Viewport ── */
  syncTargetIpp?: number[];
  syncTargetNormal?: number[];
  syncZoom?: number;
  syncWindowWidth?: number;
  syncWindowCenter?: number;
  onSliceChange?: (idx: number, zPos?: number) => void;
  onGeometryChange?: (geometry: ViewportGeometry | null) => void;
  allGeometries?: Record<number, ViewportGeometry>;
  onZoomChange?: (zoom: number) => void;
  onWLChange?: (ww: number, wc: number) => void;
  onDropSeries?: (seriesIdx: number) => void;
  toolMode?: 'WINDOW' | 'ZOOM';
  setToolMode?: (mode: 'WINDOW' | 'ZOOM') => void;
  referenceZ?: number | null;
  rotation?: number;
  hflip?: boolean;
  vflip?: boolean;
  invert?: boolean;
  desiredSliceIdx?: number;
}

/* ─────────────────────────────────────────────
   Border / glow config per state
───────────────────────────────────────────── */
const STATE_STYLES: Record<ViewportState, { border: string; glow: string; label: string }> = {
  active: {
    border: '2px solid #FFCC00',
    glow: '0 0 0 1px rgba(255,204,0,0.25), 0 0 24px rgba(255,204,0,0.3), inset 0 0 0 1px rgba(255,204,0,0.08)',
    label: 'ACTIVE',
  },
  linked: {
    border: '2px solid #3B82F6',
    glow: '0 0 0 1px rgba(59,130,246,0.2), 0 0 18px rgba(59,130,246,0.25), inset 0 0 0 1px rgba(59,130,246,0.06)',
    label: 'LINKED',
  },
  inactive: {
    border: '1px solid rgba(255,255,255,0.08)',
    glow: 'none',
    label: '',
  },
};

/* ─────────────────────────────────────────────
   Corner label (state indicator)
───────────────────────────────────────────── */
function StateCornerLabel({ state }: { state: ViewportState }) {
  if (state === 'inactive') return null;
  const isActive = state === 'active';
  return (
    <div
      className="absolute top-2 right-2 z-40 pointer-events-none"
      aria-hidden="true"
    >
      <span
        style={{
          display: 'inline-block',
          padding: '1px 6px',
          fontSize: 8,
          fontWeight: 900,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          borderRadius: 4,
          background: isActive ? 'rgba(255,204,0,0.18)' : 'rgba(59,130,246,0.18)',
          color: isActive ? '#FFCC00' : '#60A5FA',
          border: `1px solid ${isActive ? 'rgba(255,204,0,0.35)' : 'rgba(59,130,246,0.35)'}`,
        }}
      >
        {STATE_STYLES[state].label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Crossfade overlay — shows during sequence transition
───────────────────────────────────────────── */
function CrossfadeOverlay({ isTransitioning }: { isTransitioning: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-30 pointer-events-none"
      style={{
        background: 'black',
        opacity: isTransitioning ? 0.6 : 0,
        transition: isTransitioning
          ? 'opacity 80ms ease-out'
          : 'opacity 200ms ease-in',
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   ViewportCell
───────────────────────────────────────────── */
export default function ViewportCell({
  id,
  viewportIndex,
  allSeries,
  assignedSeriesIdx,
  selectionState,
  onActivate,
  isTransitioning = false,
  syncTargetIpp,
  syncTargetNormal,
  syncZoom,
  syncWindowWidth,
  syncWindowCenter,
  onSliceChange,
  onGeometryChange,
  allGeometries,
  onZoomChange,
  onWLChange,
  onDropSeries,
  toolMode = 'WINDOW',
  setToolMode,
  referenceZ,
  rotation,
  hflip,
  vflip,
  invert,
  desiredSliceIdx,
}: ViewportCellProps) {
  const style = STATE_STYLES[selectionState];
  const containerRef = useRef<HTMLDivElement>(null);

  /* Focus outline for keyboard nav */
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      ref={containerRef}
      id={`viewport-cell-${id}`}
      role="region"
      aria-label={`Viewport ${viewportIndex + 1}${selectionState !== 'inactive' ? ` — ${style.label}` : ''}`}
      aria-current={selectionState === 'active' ? 'true' : undefined}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={onActivate}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        border: style.border,
        boxShadow: style.glow,
        outline: isFocused ? '2px solid rgba(255,204,0,0.6)' : 'none',
        outlineOffset: 2,
        transition: 'border 200ms ease, box-shadow 200ms ease',
        cursor: selectionState === 'active' ? 'default' : 'pointer',
        background: '#000',
      }}
    >
      {/* Actual DICOM renderer */}
      <Viewport
        allSeries={allSeries}
        initialSeriesIdx={assignedSeriesIdx}
        viewportIndex={viewportIndex}
        isActive={selectionState === 'active'}
        onActivate={onActivate}
        syncTargetIpp={syncTargetIpp}
        syncTargetNormal={syncTargetNormal}
        syncZoom={syncZoom}
        syncWindowWidth={syncWindowWidth}
        syncWindowCenter={syncWindowCenter}
        onSliceChange={onSliceChange}
        onGeometryChange={onGeometryChange}
        allGeometries={allGeometries}
        onZoomChange={onZoomChange}
        onWLChange={onWLChange}
        onDropSeries={onDropSeries}
        toolMode={toolMode}
        setToolMode={setToolMode}
        referenceZ={referenceZ}
        rotation={rotation}
        hflip={hflip}
        vflip={vflip}
        invert={invert}
        desiredSliceIdx={desiredSliceIdx}
      />

      {/* Crossfade overlay for smooth transitions */}
      <CrossfadeOverlay isTransitioning={isTransitioning} />

      {/* State corner label */}
      <StateCornerLabel state={selectionState} />

      {/* Viewport index badge (bottom-left, subtle) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 6,
          left: 6,
          zIndex: 35,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 900,
          color: selectionState === 'active' ? '#FFCC00' : selectionState === 'linked' ? '#60A5FA' : 'rgba(255,255,255,0.3)',
          pointerEvents: 'none',
          fontFamily: 'monospace',
          transition: 'color 200ms',
        }}
      >
        {viewportIndex + 1}
      </div>
    </div>
  );
}
