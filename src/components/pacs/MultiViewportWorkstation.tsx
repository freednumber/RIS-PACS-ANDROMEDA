"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SeriesData } from '@/components/Viewport';
import type { ViewportGeometry } from '@/lib/dicomGeometry';
import ViewportCell from './ViewportCell';
import type { ViewportState } from './ViewportCell';
import SliceSlider from './SliceSlider';
import SeriesPanel from './SeriesPanel';

/* ─────────────────────────────────────────────
   Data Model
───────────────────────────────────────────── */
type LayoutType = '1x1' | '2x2' | '3x2';

interface VPState {
  id: string;
  assignedSeriesIdx: number;
  sliceIdx: number;
  zoom: number;
  windowWidth: number;
  windowCenter: number;
  rotation: number;
  hflip: boolean;
  vflip: boolean;
  invert: boolean;
  desiredSliceIdx?: number;
}

interface MultiViewportWorkstationProps {
  series: SeriesData[];
  patientName?: string;
  studyDate?: string;
}

/* ─────────────────────────────────────────────
   Layout definitions
───────────────────────────────────────────── */
const LAYOUT_CONFIGS: Record<LayoutType, { cols: number; rows: number; count: number }> = {
  '1x1': { cols: 1, rows: 1, count: 1 },
  '2x2': { cols: 2, rows: 2, count: 4 },
  '3x2': { cols: 3, rows: 2, count: 6 },
};

/* ─────────────────────────────────────────────
   Viewport color map  (index → color string for indicator dots)
───────────────────────────────────────────── */
const VP_COLORS = [
  '#FFCC00', // 0 – active-style yellow
  '#3B82F6', // 1 – blue
  '#10B981', // 2 – green
  '#F43F5E', // 3 – rose
  '#A855F7', // 4 – purple
  '#F97316', // 5 – orange
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function makeDefaultVP(id: string, seriesIdx: number): VPState {
  return { id, assignedSeriesIdx: seriesIdx, sliceIdx: 0, zoom: 1, windowWidth: 400, windowCenter: 40, rotation: 0, hflip: false, vflip: false, invert: false, desiredSliceIdx: undefined };
}

function generateVPId(idx: number) {
  return `vp-${idx}`;
}

/* ─────────────────────────────────────────────
   Toolbar icon components (inline SVG helpers)
───────────────────────────────────────────── */
const Icon1x1 = () => <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderRadius: 2 }} />;
const Icon2x2 = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
    {[0,1,2,3].map(i => <div key={i} style={{ width: 5, height: 5, border: '1.5px solid currentColor', borderRadius: 1 }} />)}
  </div>
);
const Icon3x2 = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
    {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 4, height: 4, border: '1.5px solid currentColor', borderRadius: 1 }} />)}
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function MultiViewportWorkstation({ series, patientName, studyDate }: MultiViewportWorkstationProps) {
  const [layout, setLayout] = useState<LayoutType>('3x2');
  const [activeVPId, setActiveVPId] = useState<string>('vp-0');
  const [linkedVPIds, setLinkedVPIds] = useState<Set<string>>(new Set());
  const [isSynced, setIsSynced] = useState(false);
  const [toolMode, setToolMode] = useState<'WINDOW' | 'ZOOM'>('WINDOW');
  const [geometries, setGeometries] = useState<Record<number, ViewportGeometry>>({});
  const [studyZPos, setStudyZPos] = useState<number | null>(null);
  const [transitioningVPId, setTransitioningVPId] = useState<string | null>(null);
  const [isGlobalFs, setIsGlobalFs] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  /* Track zPos in a ref to batch it with the slice update */
  const pendingZPos = useRef<number | null>(null);

  /* ── Initialize viewport states ── */
  const { count } = LAYOUT_CONFIGS[layout];

  const [vpStates, setVPStates] = useState<VPState[]>(() =>
    Array.from({ length: 6 }, (_, i) => makeDefaultVP(generateVPId(i), Math.min(i, series.length - 1)))
  );

  /* ── Active viewport index ── */
  const activeVPIdx = vpStates.findIndex(v => v.id === activeVPId);
  const activeVP = vpStates[activeVPIdx] ?? vpStates[0];

  /* ── Not using Sequence mapping anymore, slider is now a Slice slider ── */

  /* ── Viewport assignment map (for SeriesPanel) ── */
  const viewportAssignments = useMemo(() => {
    const map: Record<string, number> = {};
    vpStates.forEach(vp => { map[vp.id] = vp.assignedSeriesIdx; });
    return map;
  }, [vpStates]);

  /* ── VP visual state array (for SeriesPanel) ── */
  const vpStateInfoForPanel = useMemo(() => {
    return vpStates.slice(0, count).map((vp, i) => ({
      id: vp.id,
      color: VP_COLORS[i % VP_COLORS.length],
      label: `VP ${i + 1}`,
    }));
  }, [vpStates, count]);

  /* ── Transition helper ── */
  const triggerTransition = useCallback((vpId: string) => {
    setTransitioningVPId(vpId);
    setTimeout(() => setTransitioningVPId(null), 220);
  }, []);

  /* ── Assign series to active viewport ── */
  const assignSeriesToActiveVP = useCallback((seriesIdx: number) => {
    setVPStates(prev => {
      const next = [...prev];
      const vIdx = next.findIndex(v => v.id === activeVPId);
      if (vIdx === -1) return prev;
      if (next[vIdx].assignedSeriesIdx === seriesIdx) return prev;
      next[vIdx] = { ...next[vIdx], assignedSeriesIdx: seriesIdx };
      return next;
    });
    triggerTransition(activeVPId);
  }, [activeVPId, triggerTransition]);

  /* ── Slider: slice change ── */
  const handleSliderSliceChange = useCallback((sliceIdx: number) => {
    setVPStates(prev => {
      const next = [...prev];
      const vIdx = next.findIndex(v => v.id === activeVPId);
      if (vIdx === -1) return prev;
      next[vIdx] = { ...next[vIdx], desiredSliceIdx: sliceIdx };
      return next;
    });
  }, [activeVPId]);

  /* ── Click viewport ── */
  const handleActivate = useCallback((vpId: string) => {
    setActiveVPId(vpId);
  }, []);

  /* ── Ctrl+Click for linked state ── */
  const handleVPClick = useCallback((vpId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setLinkedVPIds(prev => {
        const next = new Set(prev);
        if (vpId === activeVPId) return next; // can't link active
        if (next.has(vpId)) next.delete(vpId); else next.add(vpId);
        return next;
      });
    } else {
      handleActivate(vpId);
      // Clear linked state when switching active
      setLinkedVPIds(new Set());
    }
  }, [activeVPId, handleActivate]);

  /* ── Geometry ── */
  const handleGeometryChange = useCallback((vIdx: number, geom: ViewportGeometry | null) => {
    setGeometries(prev => {
      if (!geom) {
        if (!prev[vIdx]) return prev;
        const n = { ...prev }; delete n[vIdx]; return n;
      }
      return { ...prev, [vIdx]: geom };
    });
  }, []);

  /* ── Slice change ── */
  const handleSliceChange = useCallback((vIdx: number, sliceIdx: number, zPos?: number) => {
    // Batch zPos update together with slice state to avoid double-render
    if (zPos !== undefined) pendingZPos.current = zPos;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      // Flush pending zPos in the same frame
      if (pendingZPos.current !== null) {
        setStudyZPos(pendingZPos.current);
        pendingZPos.current = null;
      }
      setVPStates(prev => {
        if (isSynced) {
          if (prev.every(s => s.sliceIdx === sliceIdx)) return prev;
          return prev.map(s => ({ ...s, sliceIdx }));
        }
        if (prev[vIdx]?.sliceIdx === sliceIdx) return prev;
        const next = [...prev];
        next[vIdx] = { ...next[vIdx], sliceIdx };
        return next;
      });
    });
  }, [isSynced]);

  /* ── Zoom change ── */
  const handleZoomChange = useCallback((vIdx: number, zoom: number) => {
    setVPStates(prev => {
      if (isSynced) {
        if (prev.every(s => s.zoom === zoom)) return prev;
        return prev.map(s => ({ ...s, zoom }));
      }
      if (prev[vIdx]?.zoom === zoom) return prev;
      const next = [...prev]; next[vIdx] = { ...next[vIdx], zoom }; return next;
    });
  }, [isSynced]);

  /* ── WL change ── */
  const handleWLChange = useCallback((vIdx: number, ww: number, wc: number) => {
    setVPStates(prev => {
      if (prev[vIdx]?.windowWidth === ww && prev[vIdx]?.windowCenter === wc) return prev;
      const next = [...prev]; next[vIdx] = { ...next[vIdx], windowWidth: ww, windowCenter: wc }; return next;
    });
  }, []);

  /* ── Drop series ── */
  const handleDropSeries = useCallback((vIdx: number, seriesIdx: number) => {
    setVPStates(prev => {
      const next = [...prev];
      next[vIdx] = { ...next[vIdx], assignedSeriesIdx: seriesIdx };
      return next;
    });
    triggerTransition(vpStates[vIdx]?.id ?? '');
  }, [vpStates, triggerTransition]);

  /* ── Keyboard nav between viewports ── */
  useEffect(() => {
    const { cols, rows } = LAYOUT_CONFIGS[layout];
    const onKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.closest('[role="slider"]')) return; // let slider handle its own keys
      const currentIdx = vpStates.slice(0, count).findIndex(v => v.id === activeVPId);
      if (currentIdx === -1) return;
      let next = currentIdx;
      if (e.key === 'ArrowRight') { e.preventDefault(); next = Math.min(count - 1, currentIdx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); next = Math.max(0, currentIdx - 1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); next = Math.min(count - 1, currentIdx + cols); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); next = Math.max(0, currentIdx - cols); }
      if (next !== currentIdx) {
        setActiveVPId(vpStates[next].id);
        setLinkedVPIds(new Set());
        // Focus the viewport cell DOM element
        const el = document.getElementById(`viewport-cell-${vpStates[next].id}`);
        el?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeVPId, vpStates, layout, count]);

  /* ── Global fullscreen ── */
  const toggleGlobalFs = () => {
    if (!mainRef.current) return;
    if (!document.fullscreenElement) {
      mainRef.current.requestFullscreen().catch(() => {});
      setIsGlobalFs(true);
    } else {
      document.exitFullscreen();
      setIsGlobalFs(false);
    }
  };
  useEffect(() => {
    const fn = () => setIsGlobalFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* ── Layout change: expand vpStates if needed ── */
  const { cols, rows } = LAYOUT_CONFIGS[layout];

  if (series.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 13 }}>
        No series available.
      </div>
    );
  }

  /* ── Active Series info for slice slider ── */
  const activeSeries = series[activeVP?.assignedSeriesIdx ?? 0];
  const activeTotalSlices = activeSeries?.instances?.length ?? 0;
  const activeCurrentSlice = activeVP?.sliceIdx ?? 0;
  const activeSequenceName = activeSeries?.descrizione || activeSeries?.modalita || '';

  /* ── Viewport selection state resolver ── */
  const getSelectionState = (vp: VPState): ViewportState =>
    vp.id === activeVPId ? 'active' : linkedVPIds.has(vp.id) ? 'linked' : 'inactive';

  /* ── Active VP label ── */
  const activeVPLabel = `VP ${vpStates.slice(0, count).findIndex(v => v.id === activeVPId) + 1}`;

  return (
    <div
      ref={mainRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#020202',
        overflow: 'hidden',
        position: isGlobalFs ? 'fixed' : 'relative',
        inset: isGlobalFs ? 0 : undefined,
        zIndex: isGlobalFs ? 9999 : undefined,
      }}
    >
      {/* ── TOP TOOLBAR ── */}
      <div style={{ height: 52, background: 'rgba(8,8,8,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', paddingInline: 16, gap: 12, flexShrink: 0, zIndex: 60 }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #FFCC00, #FF9900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#000', boxShadow: '0 0 16px rgba(255,204,0,0.35)' }}>A</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'white' }}>Andromeda</span>
            <span style={{ fontSize: 6, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#FFCC00' }}>Workstation</span>
          </div>
        </div>

        {/* Separator */}
        <div style={{ flex: 1 }} />

        {/* Tool toggle */}
        {(['WINDOW', 'ZOOM'] as const).map(mode => (
          <ToolBtn key={mode} active={toolMode === mode} onClick={() => setToolMode(mode)} title={mode === 'WINDOW' ? 'Window/Level' : 'Zoom & Pan'}>
            {mode === 'WINDOW' ? (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor"/></svg>
            ) : (
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            )}
          </ToolBtn>
        ))}

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Sync */}
        <ToolBtn active={isSynced} onClick={() => setIsSynced(v => !v)} title="Synchronize viewports">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.1-1.1"/><path d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1"/></svg>
        </ToolBtn>

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Layout presets */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {(['1x1', '2x2', '3x2'] as LayoutType[]).map(lt => (
            <LayoutBtn key={lt} active={layout === lt} onClick={() => { setLayout(lt); setActiveVPId('vp-0'); setLinkedVPIds(new Set()); }}>
              {lt === '1x1' ? <Icon1x1 /> : lt === '2x2' ? <Icon2x2 /> : <Icon3x2 />}
            </LayoutBtn>
          ))}
        </div>

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

        {/* Fullscreen */}
        <ToolBtn active={false} onClick={toggleGlobalFs} title={isGlobalFs ? 'Exit fullscreen' : 'Fullscreen'}>
          {isGlobalFs ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          )}
        </ToolBtn>

        {/* Patient info */}
        {(patientName || studyDate) && (
          <div style={{ marginLeft: 4, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
            {patientName && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{patientName}</span>}
            {studyDate && <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{studyDate}</span>}
          </div>
        )}

        {/* Linked help text */}
        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginLeft: 8, fontFamily: 'monospace', flexShrink: 0 }}>Ctrl+Click = link viewport</span>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ── VIEWPORT GRID ── */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gap: 2,
            padding: 2,
            background: '#020202',
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {vpStates.slice(0, count).map((vp, i) => (
            <div
              key={vp.id}
              style={{ position: 'relative', minHeight: 0, minWidth: 0 }}
              onClick={(e) => handleVPClick(vp.id, e)}
            >
              <ViewportCell
                id={vp.id}
                viewportIndex={i}
                allSeries={series}
                assignedSeriesIdx={vp.assignedSeriesIdx}
                selectionState={getSelectionState(vp)}
                onActivate={() => handleVPClick(vp.id, { ctrlKey: false, metaKey: false } as React.MouseEvent)}
                isTransitioning={transitioningVPId === vp.id}
                syncTargetIpp={isSynced && vp.id !== activeVPId && geometries[activeVPIdx] ? geometries[activeVPIdx].ipp : undefined}
                syncTargetNormal={isSynced && vp.id !== activeVPId && geometries[activeVPIdx] ? geometries[activeVPIdx].normal : undefined}
                syncZoom={isSynced ? vpStates[i].zoom : undefined}
                syncWindowWidth={vpStates[i].windowWidth}
                syncWindowCenter={vpStates[i].windowCenter}
                onSliceChange={(sliceIdx, zPos) => handleSliceChange(i, sliceIdx, zPos)}
                onGeometryChange={(geom) => handleGeometryChange(i, geom)}
                allGeometries={geometries}
                onZoomChange={(zoom) => handleZoomChange(i, zoom)}
                onWLChange={(ww, wc) => handleWLChange(i, ww, wc)}
                onDropSeries={(sIdx) => handleDropSeries(i, sIdx)}
                toolMode={toolMode}
                setToolMode={setToolMode}
                referenceZ={vp.id !== activeVPId ? studyZPos : null}
                rotation={vp.rotation}
                hflip={vp.hflip}
                vflip={vp.vflip}
                invert={vp.invert}
                desiredSliceIdx={vp.desiredSliceIdx}
              />
            </div>
          ))}
        </div>

        {/* ── SERIES PANEL ── */}
        <SeriesPanel
          series={series}
          activeViewportId={activeVPId}
          viewportAssignments={viewportAssignments}
          activeViewportSeriesIdx={activeVP?.assignedSeriesIdx ?? 0}
          onSeriesClick={assignSeriesToActiveVP}
          viewportStates={vpStateInfoForPanel}
        />
      </div>

      {/* ── SLICE SLIDER ── */}
      <SliceSlider
        totalSlices={activeTotalSlices}
        currentSlice={activeCurrentSlice}
        onSliceChange={handleSliderSliceChange}
        activeViewportLabel={activeVPLabel}
        sequenceName={activeSequenceName}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Small UI primitives
───────────────────────────────────────────── */
function ToolBtn({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'rgba(255,204,0,0.15)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(255,204,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? '#FFCC00' : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
    >
      {children}
    </button>
  );
}

function LayoutBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'rgba(255,204,0,0.12)' : 'transparent',
        border: active ? '1px solid rgba(255,204,0,0.35)' : '1px solid transparent',
        color: active ? '#FFCC00' : 'rgba(255,255,255,0.3)',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; } }}
    >
      {children}
    </button>
  );
}
