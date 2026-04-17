"use client";
import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import Viewport, { SeriesData } from './Viewport';
import SeriesThumbnail from './SeriesThumbnail';

interface ImageViewerProps {
  series: SeriesData[];
}

type LayoutType = '1x1' | '1x2' | '2x1' | '2x2';

interface ViewportState {
  seriesIdx: number;
  sliceIdx: number;
  zoom: number;
  windowWidth: number;
  windowCenter: number;
}

const WL_PRESETS = [
  { name: 'Soft', ww: 400, wc: 40, icon: '🥩' },
  { name: 'Bone', ww: 2000, wc: 300, icon: '🦴' },
  { name: 'Lung', ww: 1500, wc: -500, icon: '🫁' }
];

export default function ImageViewer({ series }: ImageViewerProps) {
  /* ── State ── */
  const [layout, setLayout] = useState<LayoutType>('1x1');
  const [activeViewportIdx, setActiveViewportIdx] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const [toolMode, setToolMode] = useState<'WINDOW' | 'ZOOM'>('WINDOW');
  const [studyZPos, setStudyZPos] = useState<number | null>(null);
  const [selectedSeriesIdxs, setSelectedSeriesIdxs] = useState<Set<number>>(new Set());
  const [isGlobalFs, setIsGlobalFs] = useState(false);

  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  // States for each possible viewport (up to 4)
  const [viewportStates, setViewportStates] = useState<ViewportState[]>([
    { seriesIdx: 0, sliceIdx: 0, zoom: 1, windowWidth: 400, windowCenter: 40 },
    { seriesIdx: Math.min(1, series.length - 1), sliceIdx: 0, zoom: 1, windowWidth: 400, windowCenter: 40 },
    { seriesIdx: Math.min(2, series.length - 1), sliceIdx: 0, zoom: 1, windowWidth: 400, windowCenter: 40 },
    { seriesIdx: Math.min(3, series.length - 1), sliceIdx: 0, zoom: 1, windowWidth: 400, windowCenter: 40 },
  ]);

  /* ── Scout Identification ── */
  const topograms = series.filter(s => 
    s.modalita === 'DX' || 
    s.descrizione?.toLowerCase().includes('scout') || 
    s.descrizione?.toLowerCase().includes('localizer')
  );
  
  const diagnosticSeries = series.filter(s => !topograms.includes(s));

  /* ── Global Fullscreen ── */
  const toggleGlobalFs = () => {
    if (!mainContainerRef.current) return;
    if (!document.fullscreenElement) {
      mainContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Global Fullscreen Error: ${err.message}`);
      });
      setIsGlobalFs(true);
    } else {
      document.exitFullscreen();
      setIsGlobalFs(false);
    }
  };

  useEffect(() => {
    const handleFs = () => setIsGlobalFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  /* ── Layout configuration ── */
  const getGridCols = () => {
    if (layout === '1x1') return 'grid-cols-1';
    if (layout === '1x2') return 'grid-cols-2';
    if (layout === '2x1') return 'grid-cols-1';
    if (layout === '2x2') return 'grid-cols-2';
    return 'grid-cols-1';
  };

  const getViewportCount = () => {
    switch (layout) {
      case '1x1': return 1;
      case '1x2': return 2;
      case '2x1': return 2;
      case '2x2': return 4;
    }
  };

  /* ── Sync Handlers ── */
  const handleSliceChange = (vIdx: number, sliceIdx: number, zPos?: number) => {
    if (zPos !== undefined) setStudyZPos(zPos);

    if (isSynced) {
      setViewportStates(prev => prev.map(s => ({ ...s, sliceIdx })));
    } else {
      setViewportStates(prev => {
        const next = [...prev];
        next[vIdx] = { ...next[vIdx], sliceIdx };
        return next;
      });
    }
  };

  const handleZoomChange = (vIdx: number, zoom: number) => {
    if (isSynced) {
      setViewportStates(prev => prev.map(s => ({ ...s, zoom })));
    } else {
      setViewportStates(prev => {
        const next = [...prev];
        next[vIdx] = { ...next[vIdx], zoom };
        return next;
      });
    }
  };

  const handleWLChange = (ww: number, wc: number) => {
    setViewportStates(prev => prev.map(s => ({ ...s, windowWidth: ww, windowCenter: wc })));
  };

  const handleManualWLChange = (vIdx: number, ww: number, wc: number) => {
    if (isSynced) {
      setViewportStates(prev => prev.map(s => ({ ...s, windowWidth: ww, windowCenter: wc })));
    } else {
      setViewportStates(prev => {
        const next = [...prev];
        next[vIdx] = { ...next[vIdx], windowWidth: ww, windowCenter: wc };
        return next;
      });
    }
  };

  /* ── Sidebar Handlers ── */
  const toggleSeriesSelection = (idx: number, shift: boolean) => {
    setSelectedSeriesIdxs(prev => {
      const next = new Set(prev);
      if (shift) {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
      } else {
        next.clear();
        next.add(idx);
      }
      return next;
    });
  };

  const loadSelectionToViewports = () => {
    const selected = Array.from(selectedSeriesIdxs);
    if (selected.length === 0) return;

    // Auto-adjust layout based on selection size
    if (selected.length > 2) setLayout('2x2');
    else if (selected.length > 1) setLayout('1x2');
    else setLayout('1x1');

    setViewportStates(prev => {
      const next = [...prev];
      selected.forEach((sIdx, i) => {
        if (i < 4) {
          next[i] = { ...next[i], seriesIdx: sIdx, sliceIdx: 0 };
        }
      });
      return next;
    });
    
    // Enable sync automatically for multi-comparison
    if (selected.length > 1) setIsSynced(true);
  };

  /* ── UI Actions ── */
  const resetAll = () => {
    setViewportStates(prev => prev.map(s => ({ ...s, zoom: 1, sliceIdx: 0, windowWidth: 400, windowCenter: 40 })));
  };

  const handleDropSeries = (vIdx: number, seriesIdx: number) => {
    setViewportStates(prev => {
      const next = [...prev];
      next[vIdx] = { ...next[vIdx], seriesIdx };
      return next;
    });
  };

  if (series.length === 0) {
    return (
      <div className="glass-card p-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        <p>Nessuna serie disponibile per questo studio.</p>
      </div>
    );
  }

  const renderSeriesCard = (s: SeriesData) => {
    const idx = series.indexOf(s);
    const isSelected = selectedSeriesIdxs.has(idx);

    return (
      <div
        key={s.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('seriesIdx', idx.toString());
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={(e) => toggleSeriesSelection(idx, e.shiftKey)}
        className={cn(
          "group relative rounded-xl border border-white/5 bg-white/5 p-2 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all",
          isSelected && "border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,212,185,0.2)]"
        )}
      >
        {/* Thumbnail Replacement */}
        <div className="aspect-square rounded-lg bg-black flex items-center justify-center mb-2 overflow-hidden border border-white/5 relative">
           <div className={cn(
             "absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-bold border z-10",
             isSelected ? "text-primary-400 border-primary-500/30" : "text-gray-400 border-white/10"
           )}>
              {s.modalita}
           </div>
           
           <SeriesThumbnail 
             instanceId={s.instances[Math.floor(s.instances.length / 2)]?.id} 
             className="w-full h-full"
           />

           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Trascina o Shift+Click</span>
           </div>
        </div>
        <div className="space-y-0.5">
          <p className={cn("text-[11px] font-bold truncate", isSelected ? "text-primary-400" : "text-gray-200")}>
            {s.descrizione || `Serie ${idx + 1}`}
          </p>
          <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono">
            <span>{s.instances.length} immagini</span>
            <span className={isSelected ? "text-primary-500" : "text-primary-400/50"}>#{idx}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={mainContainerRef}
      className={cn(
        "flex flex-col w-full animate-fade-in no-scrollbar overflow-hidden bg-[#020202] transition-all duration-700 ease-in-out",
        isGlobalFs ? "fixed inset-0 z-[9999] h-screen w-screen p-0" : "h-[850px] rounded-2xl border border-white/5 shadow-2xl"
      )}
    >
      
      {/* ── Top Diagnostic Toolbar (MedDream Professional) ── */}
      <div className="h-16 bg-[#080808]/90 backdrop-blur-xl border-b border-white/10 flex items-center px-6 gap-8 shrink-0 z-[60] shadow-2xl">
         <div className="flex items-center gap-4 pr-8 border-r border-white/10">
            <div className="w-9 h-9 rounded-lg bg-primary-500 shadow-[0_0_20px_rgba(0,212,185,0.4)] flex items-center justify-center font-black text-white text-sm tracking-tighter">A</div>
            <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Andromeda</span>
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary-500 -mt-1">Workstation</span>
            </div>
         </div>

         {/* Tool Group: View */}
         <div className="flex items-center gap-3 px-6 border-r border-white/10 h-10">
            <button 
              onClick={() => setToolMode('WINDOW')}
              className={cn("px-4 py-2 rounded-xl flex items-center gap-2.5 transition-all border", toolMode === 'WINDOW' ? "bg-primary-500 border-primary-400 text-white shadow-lg" : "text-gray-500 border-transparent hover:text-white hover:bg-white/5")}
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Windowing</span>
            </button>
            <button 
              onClick={() => setToolMode('ZOOM')}
              className={cn("px-4 py-2 rounded-xl flex items-center gap-2.5 transition-all border", toolMode === 'ZOOM' ? "bg-primary-500 border-primary-400 text-white shadow-lg" : "text-gray-500 border-transparent hover:text-white hover:bg-white/5")}
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Zoom / Pan</span>
            </button>
         </div>

         {/* Tool Group: Layout */}
         <div className="flex items-center gap-3 px-6 border-r border-white/10">
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
              <button onClick={() => setLayout('1x1')} className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all", layout === '1x1' ? "bg-white/10 text-primary-400" : "text-gray-600 hover:text-white")}>
                 <div className="w-4 h-4 border-2 border-current rounded-sm" />
              </button>
              <button onClick={() => setLayout('1x2')} className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all", layout === '1x2' ? "bg-white/10 text-primary-400" : "text-gray-600 hover:text-white")}>
                 <div className="flex gap-0.5"><div className="w-1.5 h-4 border-2 border-current rounded-sm" /><div className="w-1.5 h-4 border-2 border-current rounded-sm" /></div>
              </button>
              <button onClick={() => setLayout('2x2')} className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all", layout === '2x2' ? "bg-white/10 text-primary-400" : "text-gray-600 hover:text-white")}>
                 <div className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 border-2 border-current rounded-sm" /><div className="w-1.5 h-1.5 border-2 border-current rounded-sm" /><div className="w-1.5 h-1.5 border-2 border-current rounded-sm" /><div className="w-1.5 h-1.5 border-2 border-current rounded-sm" /></div>
              </button>
            </div>
         </div>

         {/* Tool Group: Actions */}
         <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSynced(!isSynced)}
              className={cn("flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest", 
                isSynced ? "bg-primary-500 border-primary-400 text-white shadow-[0_0_25px_rgba(0,212,185,0.4)]" : "bg-white/5 border-white/10 text-gray-500 hover:text-white shadow-xl"
              )}
            >
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" /></svg>
               Synchronize
            </button>

            <button 
              onClick={resetAll}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors flex items-center gap-2 group"
            >
               <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               Reset View
            </button>
         </div>

         <button 
           onClick={toggleGlobalFs}
           className="ml-auto w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-primary-500/20 hover:border-primary-500/40 transition-all group"
         >
            {isGlobalFs ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
            ) : (
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
            )}
         </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Series Sidebar ── */}
        <div className="w-64 bg-[#080808] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-white/5">
             <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Filmstrip</span>
                {selectedSeriesIdxs.size > 0 && (
                  <button onClick={() => setSelectedSeriesIdxs(new Set())} className="text-[8px] text-primary-500 hover:underline">Clear</button>
                )}
             </div>
             {selectedSeriesIdxs.size > 1 && (
                <button 
                  onClick={loadSelectionToViewports}
                  className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-primary-500/10 transition-all flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300"
                >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                   Batch Sync
                </button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar pb-20">
            {topograms.length > 0 && (
              <div className="space-y-3">
                 <h4 className="text-[8px] font-black text-gray-600 tracking-widest pl-1 uppercase">Localizers</h4>
                 <div className="grid grid-cols-2 gap-2">
                    {topograms.map(s => renderSeriesCard(s))}
                 </div>
              </div>
            )}
            <div className="space-y-3">
               <h4 className="text-[8px] font-black text-gray-600 tracking-widest pl-1 uppercase">Diagnostics</h4>
               <div className="flex flex-col gap-3">
                  {diagnosticSeries.map(s => renderSeriesCard(s))}
               </div>
            </div>
          </div>
        </div>

        {/* ── Main Viewport Area ── */}
        <div className={cn(
          "flex-1 grid gap-1.5 p-1.5 bg-black",
          getGridCols(),
          (layout === '2x1' || layout === '2x2') ? 'grid-rows-2' : 'grid-rows-1'
        )}>
          {Array.from({ length: getViewportCount() }).map((_, idx) => (
            <Viewport
              key={idx}
              viewportIndex={idx}
              allSeries={series}
              initialSeriesIdx={viewportStates[idx].seriesIdx}
              isActive={activeViewportIdx === idx}
              onActivate={() => setActiveViewportIdx(idx)}
              syncSliceIdx={isSynced ? viewportStates[idx].sliceIdx : undefined}
              syncZoom={isSynced ? viewportStates[idx].zoom : undefined}
              syncWindowWidth={viewportStates[idx].windowWidth}
              syncWindowCenter={viewportStates[idx].windowCenter}
              onSliceChange={(sliceIdx, zPos) => handleSliceChange(idx, sliceIdx, zPos)}
              onZoomChange={(zoom) => handleZoomChange(idx, zoom)}
              onWLChange={(ww, wc) => handleManualWLChange(idx, ww, wc)}
              onDropSeries={(sIdx) => handleDropSeries(idx, sIdx)}
              toolMode={toolMode}
              setToolMode={setToolMode}
              referenceZ={studyZPos}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
