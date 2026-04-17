"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { initCornerstone, getCornerstone } from '@/lib/cornerstone-init';
import ViewportOverlay from './ViewportOverlay';

/* ── Types ── */
export interface SeriesData {
  id: string;
  descrizione: string | null;
  modalita: string | null;
  instances: Array<{ id: string; filePath: string; fileSize: number }>;
  pazienteNome?: string;
  pazienteId?: string;
  data?: string;
}

interface ViewportProps {
  allSeries: SeriesData[];
  initialSeriesIdx: number;
  viewportIndex: number;
  isActive: boolean;
  onActivate: () => void;
  syncSliceIdx?: number;
  syncZoom?: number;
  syncWindowWidth?: number;
  syncWindowCenter?: number;
  onSliceChange?: (idx: number, zPos?: number) => void;
  onZoomChange?: (zoom: number) => void;
  onWLChange?: (ww: number, wc: number) => void;
  onDropSeries?: (seriesIdx: number) => void;
  toolMode: 'WINDOW' | 'ZOOM';
  setToolMode?: (mode: 'WINDOW' | 'ZOOM') => void;
  referenceZ?: number | null;
}

const BORDER_COLORS = [
  { border: 'border-blue-500', dot: 'bg-blue-500', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
  { border: 'border-amber-500', dot: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  { border: 'border-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  { border: 'border-rose-500', dot: 'bg-rose-500', text: 'text-rose-400', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]' },
];

export default function Viewport({
  allSeries,
  initialSeriesIdx,
  viewportIndex,
  isActive,
  onActivate,
  syncSliceIdx,
  syncZoom,
  syncWindowWidth,
  syncWindowCenter,
  onSliceChange,
  onZoomChange,
  onWLChange,
  onDropSeries,
  toolMode,
  setToolMode,
  referenceZ,
}: ViewportProps) {
  const [selectedSeriesIdx, setSelectedSeriesIdx] = useState(initialSeriesIdx);
  const [isOver, setIsOver] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [zRange, setZRange] = useState<{ min: number, max: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [orientation, setOrientation] = useState<'axial' | 'sagittal' | 'coronal' | 'unknown'>('axial');
  const [voi, setVoi] = useState({ ww: 400, wc: 40 });
  const [zoomScale, setZoomScale] = useState(1);

  // Sync with parent when drag and drop updates initialSeriesIdx
  useEffect(() => {
    setSelectedSeriesIdx(initialSeriesIdx);
    setCurrentIdx(0);
    setZRange(null); // Reset range for new series
  }, [initialSeriesIdx]);

  // Use refs for callbacks to avoid unstable prop loops
  const onWLChangeRef = useRef(onWLChange);
  const onSliceChangeRef = useRef(onSliceChange);
  const onZoomChangeRef = useRef(onZoomChange);
  const onActivateRef = useRef(onActivate);

  useEffect(() => { onWLChangeRef.current = onWLChange; }, [onWLChange]);
  useEffect(() => { onSliceChangeRef.current = onSliceChange; }, [onSliceChange]);
  useEffect(() => { onZoomChangeRef.current = onZoomChange; }, [onZoomChange]);
  useEffect(() => { onActivateRef.current = onActivate; }, [onActivate]);

  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef<number | null>(null); // null, 0 (Left), 2 (Right)

  const series = allSeries[selectedSeriesIdx];
  const instances = series?.instances ?? [];
  const current = instances[currentIdx];
  const total = instances.length;
  const color = BORDER_COLORS[viewportIndex % BORDER_COLORS.length];

  /* ── Detect Orientation ── */
  const detectOrientation = (image: any) => {
    const iop = image.data?.string('x00200037')?.split('\\').map(parseFloat);
    if (!iop || iop.length < 6) return 'axial';

    const [x1, y1, z1, x2, y2, z2] = iop;
    
    if (Math.abs(z1) < 0.1 && Math.abs(z2) < 0.1) return 'axial';
    if (Math.abs(x1) < 0.1 && Math.abs(x2) < 0.1) return 'sagittal';
    if (Math.abs(y1) < 0.1 && Math.abs(y2) < 0.1) return 'coronal';
    
    return 'axial';
  };

  /* ── Initialize Cornerstone ── */
  useEffect(() => {
    let active = true;
    
    const setup = async () => {
      const cs = await initCornerstone();
      if (!active || !viewportRef.current || isInitialized.current || !cs) return;

      cs.enable(viewportRef.current);
      isInitialized.current = true;
      setIsReady(true);
      
      const handleResize = () => {
        if (viewportRef.current) cs.resize(viewportRef.current);
      };
      window.addEventListener('resize', handleResize);
      
      if (current?.id) loadImage(current.id, true);
    };

    setup();

    return () => {
      active = false;
      const cs = getCornerstone();
      if (viewportRef.current && cs) {
         try { cs.disable(viewportRef.current); } catch(e) {}
      }
    };
  }, []);

  /* ── Load Image & Fetch Range ── */
  const loadImage = useCallback(async (instanceId: string, setupDefault = false) => {
    const cs = getCornerstone();
    if (!viewportRef.current || !instanceId || !cs) return;
    
    setLoading(true);
    setHasError(false);

    try {
      const imageId = `wadouri:/api/images/${instanceId}`;
      const image = await cs.loadImage(imageId);
      
      if (viewportRef.current) {
        cs.displayImage(viewportRef.current, image);
        cs.resize(viewportRef.current);
        
        if (setupDefault) {
          cs.fitToWindow(viewportRef.current);
          
          if (image.windowWidth !== undefined && image.windowCenter !== undefined) {
             const newWw = image.windowWidth;
             const newWc = image.windowCenter;
             setVoi(prev => (prev.ww === newWw && prev.wc === newWc) ? prev : { ww: newWw, wc: newWc });
             onWLChangeRef.current?.(newWw, newWc);
          }
        }

        const viewport = cs.getViewport(viewportRef.current);
        if (viewport) {
           const newScale = viewport.scale;
           const newWw = viewport.voi.windowWidth;
           const newWc = viewport.voi.windowCenter;
           
           setZoomScale(prev => prev === newScale ? prev : newScale);
           setVoi(prev => (prev.ww === newWw && prev.wc === newWc) ? prev : { ww: newWw, wc: newWc });
        }

        setOrientation(detectOrientation(image));
        
        // IMMEDIATE: Set loading to false once image is displayed
        setLoading(false);

        if (!zRange && instances.length > 1) {
             const firstImgId = `wadouri:/api/images/${instances[0].id}`;
             const lastImgId = `wadouri:/api/images/${instances[instances.length - 1].id}`;
             
             Promise.all([
               cs.loadImage(firstImgId),
               cs.loadImage(lastImgId)
             ]).then(([firstImg, lastImg]) => {
                const zStart = firstImg.data?.string('x00200032')?.split('\\')[2];
                const zEnd = lastImg.data?.string('x00200032')?.split('\\')[2];
                if (zStart && zEnd) {
                   const z1 = parseFloat(zStart);
                   const z2 = parseFloat(zEnd);
                   setZRange({ min: Math.min(z1, z2), max: Math.max(z1, z2) });
                }
             }).catch(e => console.warn('Z-range fetch failed:', e));
        }

        const zPos = image.data?.string('x00200032')?.split('\\')[2];
        const numericZ = zPos ? parseFloat(zPos) : undefined;
        onSliceChangeRef.current?.(currentIdx, numericZ);
      }
    } catch (err) {
      console.error('Cornerstone load error:', err);
      setHasError(true);
      setLoading(false);
    }
  }, [currentIdx, instances, zRange]); // currentIdx removed from being a direct trigger for identity change if not needed, but it is used inside. Stabilized by refs.

  /* ── Effect: Load on index change ── */
  useEffect(() => {
    if (current?.id) {
      // Use a lock to prevent concurrent loads if quickly scrolling
      loadImage(current.id, currentIdx === 0);
    }
  }, [current?.id, loadImage]); // currentIdx removed - we only want to load when ID changes. navigate handles currentIdx locally.

  /* ── Sync from parent ── */
  useEffect(() => {
    const newWw = syncWindowWidth ?? 400;
    const newWc = syncWindowCenter ?? 40;
    setVoi(prev => (prev.ww === newWw && prev.wc === newWc) ? prev : { ww: newWw, wc: newWc });
  }, [syncWindowWidth, syncWindowCenter]);

  useEffect(() => {
    const newZoom = syncZoom ?? 1;
    setZoomScale(prev => prev === newZoom ? prev : newZoom);
  }, [syncZoom]);

  useEffect(() => {
    if (syncSliceIdx !== undefined && syncSliceIdx !== currentIdx && syncSliceIdx < total) {
      setCurrentIdx(syncSliceIdx);
    }
  }, [syncSliceIdx, currentIdx, total]);

  useEffect(() => {
    const cs = getCornerstone();
    if (isReady && syncZoom !== undefined && viewportRef.current && cs) {
      const viewport = cs.getViewport(viewportRef.current);
      if (viewport && viewport.scale !== syncZoom) {
        viewport.scale = syncZoom;
        cs.setViewport(viewportRef.current, viewport);
      }
    }
  }, [syncZoom, isReady]);

  useEffect(() => {
    const cs = getCornerstone();
    if (isReady && (syncWindowWidth !== undefined || syncWindowCenter !== undefined) && viewportRef.current && cs) {
      const viewport = cs.getViewport(viewportRef.current);
      if (viewport) {
        if (syncWindowWidth !== undefined) viewport.voi.windowWidth = syncWindowWidth;
        if (syncWindowCenter !== undefined) viewport.voi.windowCenter = syncWindowCenter;
        cs.setViewport(viewportRef.current, viewport);
      }
    }
  }, [syncWindowWidth, syncWindowCenter, isReady]);

  /* ── Navigation ── */
  const navigate = useCallback(
    (newIdx: number) => {
      let finalIdx = newIdx;
      if (newIdx < 0) finalIdx = total - 1;
      if (newIdx >= total) finalIdx = 0;
      
      setCurrentIdx(prev => prev === finalIdx ? prev : finalIdx);
    },
    [total]
  );

  /* ── Mouse interactions ── */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(currentIdx + (e.deltaY > 0 ? 1 : -1));
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        if (e.button === 2) return;
        e.preventDefault();
        isDragging.current = e.button;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setContextMenu(null);
        onActivate();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current === null) return;
      const cs = getCornerstone();
      if (!cs || !el) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const viewport = cs.getViewport(el);
      if (!viewport) return;

      if (isDragging.current === 0) {
        viewport.translation.x += deltaX / viewport.scale;
        viewport.translation.y += deltaY / viewport.scale;
      } else if (isDragging.current === 2) {
        if (toolMode === 'ZOOM') {
          const zoomDelta = 1 + (deltaY / 100);
          viewport.scale *= zoomDelta;
          const newScale = viewport.scale;
          setZoomScale(prev => prev === newScale ? prev : newScale);
          onZoomChangeRef.current?.(viewport.scale);
        } else {
          viewport.voi.windowWidth += deltaX;
          viewport.voi.windowCenter += deltaY;
          const newWw = viewport.voi.windowWidth;
          const newWc = viewport.voi.windowCenter;
          setVoi(prev => (prev.ww === newWw && prev.wc === newWc) ? prev : { ww: newWw, wc: newWc });
          onWLChangeRef.current?.(viewport.voi.windowWidth, viewport.voi.windowCenter);
        }
      }

      cs.setViewport(el, viewport);
    };

    const onMouseUp = () => {
      isDragging.current = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isReady, currentIdx, navigate, toolMode]); // Removed unstable callbacks from deps

  /* ── Right Click Handler ── */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setContextMenu(null);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!series || total === 0) {
    return (
      <div className={cn('relative flex items-center justify-center rounded-lg border-2 bg-black/40', color.border)} onClick={onActivate}>
        <p className="text-xs text-gray-500">Nessuna immagine</p>
      </div>
    );
  }

  let referenceIndicatorPos = null;
  if (zRange && referenceZ !== null && referenceZ !== undefined) {
    const range = zRange.max - zRange.min;
    if (range !== 0) {
       referenceIndicatorPos = ((zRange.max - referenceZ) / range) * 100;
    }
  }

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const data = e.dataTransfer.getData('seriesIdx');
        if (data && onDropSeries) {
          onDropSeries(parseInt(data));
        }
      }}
      className={cn(
        'relative flex flex-col rounded-xl border overflow-hidden bg-black transition-all h-full group/vp',
        color.border,
        isActive ? 'ring-2 ring-primary-500/40 border-primary-500 shadow-[0_0_20px_rgba(0,212,185,0.15)]' : 'border-white/10',
        isFullscreen && 'rounded-none border-0'
      )}
      onClick={onActivate}
      onContextMenu={handleContextMenu}
    >
      {/* ── Top Header (Metadata) ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0 animate-pulse', color.dot)} />
        <span className="text-[11px] font-black uppercase tracking-tight text-white/90 drop-shadow-md">
           {series.descrizione || series.modalita} 
        </span>
        
        <button 
          onClick={toggleFullscreen}
          className="ml-auto w-7 h-7 flex items-center justify-center text-white/40 hover:text-white transition-all bg-black/40 rounded-full pointer-events-auto backdrop-blur-sm border border-white/5 opacity-0 group-hover/vp:opacity-100"
          title="Fullscreen"
        >
          {isFullscreen ? (
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          ) : (
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          )}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Diagnostic HUD Overlay */}
        {!loading && !hasError && (
          <ViewportOverlay
            patientName={series.pazienteNome || 'MARIO ROSSI'}
            patientId={series.pazienteId || 'P-001'}
            modality={series.modalita || 'CT'}
            windowWidth={voi.ww}
            windowCenter={voi.wc}
            zoom={zoomScale}
            sliceIndex={currentIdx}
            totalSlices={total}
            zPos={referenceZ ?? undefined}
            studyDate={series.data || '2026-04-16'}
            orientation={orientation}
          />
        )}

        {/* ── Localizer Bar (Reference) ── */}
        <div className="w-1.5 bg-black/80 relative h-full border-r border-white/5 overflow-hidden">
           {referenceIndicatorPos !== null && (
              <div 
                className="absolute w-full h-1 bg-primary-500 shadow-[0_0_15px_#00D4BE] transition-all duration-300 ease-out z-30"
                style={{ top: `${Math.max(0, Math.min(100, referenceIndicatorPos))}%` }}
              />
           )}
           <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/10 pointer-events-none" />
        </div>

        {/* ── Viewport Area ── */}
        <div 
          ref={viewportRef}
          className="relative flex-1 bg-black cursor-crosshair h-full"
          onContextMenu={(e) => e.preventDefault()}
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/60 backdrop-blur-[1px]">
               <div className="w-12 h-12 relative">
                  <div className="absolute inset-0 border-2 border-primary-500/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
               </div>
               <span className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-primary-400">Loading Diagnostic Data</span>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[11px] gap-2 p-4 text-center text-gray-400 z-50">
               <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <p className="font-bold text-white uppercase tracking-wider">DICOM DECODING FAILURE</p>
               <button onClick={() => loadImage(current.id)} className="text-[10px] text-primary-500 hover:text-primary-400 font-bold border-b border-primary-500/20 pb-0.5">RETRY ENGINE</button>
            </div>
          )}
        </div>

        {/* ── Navigation Slider ── */}
        <div className="w-8 flex flex-col items-center py-4 bg-black/60 border-l border-white/5 relative group-hover/vp:bg-black/80 transition-colors">
          <input
            type="range"
            min="0"
            max={total - 1}
            value={currentIdx}
            onChange={(e) => navigate(parseInt(e.target.value))}
            className="appearance-none bg-transparent w-40 h-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 cursor-pointer"
            style={{ accentColor: '#00D4BE' }}
          />
        </div>
      </div>

      {/* ── Right Click Diagnostics Menu ── */}
      {contextMenu && (
        <div 
          className="fixed z-[100] w-52 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={closeMenu}
          onMouseLeave={closeMenu}
        >
          <div className="px-4 py-3 border-b border-white/5 bg-white/5">
             <span className="text-[9px] font-black uppercase text-primary-400 tracking-[0.2em]">Diagnostic Tools</span>
          </div>
          <div className="p-1.5 flex flex-col gap-1">
             <button 
               onClick={() => { setToolMode?.('WINDOW'); closeMenu(); }}
               className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all", toolMode === 'WINDOW' ? "bg-primary-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>
                Windowing (W/L)
             </button>
             <button 
               onClick={() => { setToolMode?.('ZOOM'); closeMenu(); }}
               className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all", toolMode === 'ZOOM' ? "bg-primary-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                Zoom / Pan
             </button>
             <div className="h-px bg-white/5 my-1" />
             <button 
               onClick={() => { navigate(0); closeMenu(); }}
               className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] font-bold text-gray-400 hover:bg-white/5 hover:text-white"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Reset Orientation
             </button>
          </div>
          <div className="px-4 py-2 bg-black flex justify-between items-center text-[8px] font-black text-gray-700 uppercase tracking-widest">
             <span>Andromeda PACS</span>
             <span>v3.0</span>
          </div>
        </div>
      )}

      {/* ── Footer Stats ── */}
      <div className="flex items-center gap-3 px-3 py-1 bg-black/40 text-[9px] font-mono text-gray-500/50 select-none border-t border-white/5">
        <span className="text-primary-500/30">ORIENTATION: {orientation}</span>
        <span className="ml-auto">DICOM-URI // {series.id.split('-')[0]}</span>
      </div>
    </div>
  );
}
