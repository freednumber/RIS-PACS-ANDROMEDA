'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Use dynamic cornerstone access to avoid SSR "window is not defined" error
const getCornerstone = async () => {
    if (typeof window === 'undefined') return null;
    const cs = await import('cornerstone-core');
    return cs.default || cs;
};
import type { DicomStudy, DicomInstance } from '@/lib/dicomweb';

interface DicomViewportProps {
    study: DicomStudy;
    seriesIndex: number;
    currentSlice: number;
    windowWidth?: number;
    windowCenter?: number;
    zoom?: number;
    pan?: { x: number, y: number };
    isActive: boolean;
    onActivate: () => void;
    onSliceChange?: (sliceIdx: number) => void;
    onViewportChange?: (viewport: { windowWidth: number, windowCenter: number, zoom: number, pan: { x: number, y: number } }) => void;
    findings?: { 
        sliceIndex: number; 
        type: 'ROI' | 'LABEL'; 
        x: number; 
        y: number; 
        w: number; 
        h: number; 
        label: string; 
    probability: number;
    }[];
}

const WL_PRESETS = [
    { id: 'SOFT', label: 'Tessuti Molli', ww: 400, wc: 40, icon: '🥩' },
    { id: 'BONE', label: 'Osso', ww: 2000, wc: 500, icon: '🦴' },
    { id: 'LUNG', label: 'Polmone', ww: 1500, wc: -600, icon: '🫁' },
    { id: 'BRAIN', label: 'Encefalo', ww: 80, wc: 40, icon: '🧠' },
    { id: 'STROKE', label: 'Stroke', ww: 40, wc: 40, icon: '⚡' },
];

export default function DicomViewport({
    study,
    seriesIndex,
    currentSlice,
    windowWidth: propsWW,
    windowCenter: propsWC,
    zoom: propsZoom = 1,
    pan: propsPan = { x: 0, y: 0 },
    isActive,
    onActivate,
    onSliceChange,
    onViewportChange,
    findings = []
}: DicomViewportProps) {
    // These are now partially controlled, partially local for interaction speed
    const [localWW, setLocalWW] = useState(propsWW || study.windowWidth || 400);
    const [localWC, setLocalWC] = useState(propsWC || study.windowCenter || 40);
    const [localZoom, setLocalZoom] = useState(propsZoom);
    const [localPan, setLocalPan] = useState(propsPan);
    
    const [isInteracting, setIsInteracting] = useState(false);
    const [activeTool, setActiveTool] = useState<'WL' | 'PAN' | 'ZOOM' | 'MEASURE' | 'MAGNIFY'>('WL');
    const [measurements, setMeasurements] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);
    const [currentMeasure, setCurrentMeasure] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    
    const canvasRef = useRef<HTMLDivElement>(null);
    const interactionStartRef = useRef({ x: 0, y: 0, ww: 0, wc: 0, px: 0, py: 0, z: 0 });

    const series = study.series[seriesIndex];
    const totalSlices = series?.instances.length || 0;
    const currentInstance = series?.instances[currentSlice];

    // ─── CORNERSTONE LIFESTYLE ───────────────────────────────────────────────
    
    // 1. Initialize Viewport
    useEffect(() => {
        const element = canvasRef.current;
        if (!element) return;

        let cornerstone: any;
        const init = async () => {
            cornerstone = await getCornerstone();
            if (cornerstone && element) {
                cornerstone.enable(element);
            }
        }
        init();

        return () => {
            if (cornerstone && element) cornerstone.disable(element);
        };
    }, []);

    // 2. Load and Display Image
    useEffect(() => {
        const element = canvasRef.current;
        if (!element || !currentInstance) return;

        setIsLoaded(false);
        const imageId = `wadouri:${currentInstance.imagePath}`;

        const load = async () => {
            const cornerstone = await getCornerstone();
            if (!cornerstone || !element) return;

            try {
                const image = await cornerstone.loadImage(imageId);
                if (element) {
                    cornerstone.displayImage(element, image);
                    setIsLoaded(true);
                    
                    const viewport = cornerstone.getViewport(element);
                    viewport.voi.windowWidth = localWW;
                    viewport.voi.windowCenter = localWC;
                    viewport.scale = localZoom;
                    viewport.translation.x = localPan.x;
                    viewport.translation.y = localPan.y;
                    cornerstone.setViewport(element, viewport);
                }
            } catch (err) {
                console.error('Cornerstone Load Error:', err);
            }
        };
        load();
    }, [currentInstance?.sopInstanceUID]);

    // 3. Sync local state with props when they change (from outside)
    useEffect(() => {
        if (propsWW !== undefined) setLocalWW(propsWW);
    }, [propsWW]);
    useEffect(() => {
        if (propsWC !== undefined) setLocalWC(propsWC);
    }, [propsWC]);
    useEffect(() => {
        setLocalZoom(propsZoom);
    }, [propsZoom]);
    useEffect(() => {
        setLocalPan(propsPan);
    }, [propsPan.x, propsPan.y]);

    // 4. Update Cornerstone Viewport on Local State Changes
    useEffect(() => {
        const update = async () => {
            const element = canvasRef.current;
            if (!element || !isLoaded) return;
            const cornerstone = await getCornerstone();
            if (!cornerstone) return;

            const viewport = cornerstone.getViewport(element);
            if (!viewport) return;

            viewport.voi.windowWidth = localWW;
            viewport.voi.windowCenter = localWC;
            viewport.scale = localZoom;
            viewport.translation.x = localPan.x;
            viewport.translation.y = localPan.y;
            
            cornerstone.setViewport(element, viewport);
        }
        update();
    }, [localWW, localWC, localZoom, localPan, isLoaded]);

    // ─── MOUSE INTERACTIONS (Optimized for Cornerstone) ─────────────────────
    const handleMouseDown = (e: React.MouseEvent) => {
        onActivate();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        if (activeTool === 'MEASURE') {
            setCurrentMeasure({ x1: localX, y1: localY, x2: localX, y2: localY });
        }

        setIsInteracting(true);
        interactionStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            ww: localWW,
            wc: localWC,
            px: localPan.x,
            py: localPan.y,
            z: localZoom
        };
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        setMousePos({ x: localX, y: localY });

        if (!isInteracting) return;

        const dx = e.clientX - interactionStartRef.current.x;
        const dy = e.clientY - interactionStartRef.current.y;

        if (activeTool === 'MEASURE' && currentMeasure) {
            setCurrentMeasure({ ...currentMeasure, x2: localX, y2: localY });
            return;
        }

        if (e.buttons === 2 || (e.buttons === 1 && activeTool === 'WL')) {
            // Window / Level
            setLocalWW(Math.max(1, interactionStartRef.current.ww + dx * 2));
            setLocalWC(interactionStartRef.current.wc + dy * 2);
        } else if (e.buttons === 1 && activeTool === 'PAN') {
            // Pan
            setLocalPan({
                x: interactionStartRef.current.px + dx,
                y: interactionStartRef.current.py + dy
            });
        } else if (e.buttons === 1 && activeTool === 'ZOOM') {
            // Zoom
            const factor = Math.exp(-dy / 200);
            setLocalZoom(Math.max(0.1, Math.min(10, interactionStartRef.current.z * factor)));
        }
    };

    const handleMouseUp = () => {
        if (activeTool === 'MEASURE' && currentMeasure) {
            setMeasurements(prev => [...prev, currentMeasure]);
            setCurrentMeasure(null);
        }
        setIsInteracting(false);
        // Notify parent of final state after interaction
        if (onViewportChange) {
            onViewportChange({
                windowWidth: localWW,
                windowCenter: localWC,
                zoom: localZoom,
                pan: localPan
            });
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (totalSlices <= 1) return;
        const dir = e.deltaY > 0 ? 1 : -1;
        const nextSlice = Math.max(0, Math.min(totalSlices - 1, currentSlice + dir));
        if (onSliceChange) onSliceChange(nextSlice);
    };

    // Prevent context menu to allow right-click drag
    const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

    if (!series || !currentInstance) return (
        <div className="w-full h-full flex items-center justify-center bg-black text-slate-700 font-mono text-xs border border-white/5">
            [ NO SERIES DATA ]
        </div>
    );

    return (
        <div 
            ref={canvasRef}
            className={`relative w-full h-full bg-black overflow-hidden select-none cursor-crosshair transition-all duration-300 ${isActive ? 'ring-1 ring-cyan-500/50' : 'ring-1 ring-white/5'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
        >
            {/* TOOLBAR OVERLAY (Visible when active) */}
            {isActive && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex gap-1 p-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-2xl">
                    {[
                        { id: 'WL', icon: '🌓', label: 'W/L' },
                        { id: 'PAN', icon: '🖐️', label: 'Pan' },
                        { id: 'ZOOM', icon: '🔍', label: 'Zoom' },
                        { id: 'MEASURE', icon: '📏', label: 'Ruler' },
                        { id: 'MAGNIFY', icon: '🔘', label: 'Magnify' },
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setActiveTool(tool.id as any);
                                if (tool.id !== 'MEASURE') setMeasurements([]);
                            }}
                            className={`p-1.5 rounded-md text-[10px] transition-all ${activeTool === tool.id ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:bg-white/10'}`}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    ))}

                    <div className="h-4 w-px bg-white/10 mx-1 self-center" />

                    {/* PRESETS Quick Menu */}
                    <div className="flex gap-1 group relative">
                        <button className="p-1.5 rounded-md text-[10px] text-slate-400 hover:bg-white/10 flex items-center gap-1">
                            🎨 <span className="text-[8px] font-bold">W/L</span>
                        </button>
                        <div className="absolute top-full left-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 hidden group-hover:flex flex-col gap-1 min-w-[120px] shadow-2xl z-50">
                            {WL_PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLocalWW(p.ww);
                                        setLocalWC(p.wc);
                                        if (onViewportChange) {
                                            onViewportChange({ windowWidth: p.ww, windowCenter: p.wc, zoom: localZoom, pan: localPan });
                                        }
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-left group/item"
                                >
                                    <span className="text-xs">{p.icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-300 group-hover/item:text-cyan-400">{p.label}</span>
                                        <span className="text-[8px] text-slate-500">W:{p.ww} L:{p.wc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* LOADING TEXT */}
            {!isLoaded && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest animate-pulse">Parsing Binary DICOM...</span>
                </div>
            )}

            {/* MEASUREMENTS SVG LAYER */}
            <svg className="absolute inset-0 z-10 pointer-events-none w-full h-full">
                {measurements.map((m, i) => {
                    const length = Math.sqrt(Math.pow(m.x2 - m.x1, 2) + Math.pow(m.y2 - m.y1, 2));
                    const label = `${(length / 2).toFixed(1)} mm`; // Basic calibration
                    return (
                        <g key={i}>
                            <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 2" />
                            <circle cx={m.x1} cy={m.y1} r="3" fill="#00e5ff" />
                            <circle cx={m.x2} cy={m.y2} r="3" fill="#00e5ff" />
                            <text x={(m.x1 + m.x2) / 2 + 5} y={(m.y1 + m.y2) / 2 - 5} fill="#00e5ff" fontSize="11" className="font-mono font-bold" style={{ textShadow: '0 0 4px black' }}>
                                {label}
                            </text>
                        </g>
                    );
                })}
                {currentMeasure && (
                    <line x1={currentMeasure.x1} y1={currentMeasure.y1} x2={currentMeasure.x2} y2={currentMeasure.y2} stroke="#ffcc00" strokeWidth="1.5" strokeDasharray="2 2" />
                )}

                {/* AI FINDINGS ROIs */}
                {findings.filter(f => f.sliceIndex === currentSlice).map((f, i) => (
                    <g key={`ai-${i}`}>
                        <rect 
                            x={Math.max(0, f.x * localZoom + localPan.x)} 
                            y={Math.max(0, f.y * localZoom + localPan.y)} 
                            width={f.w * localZoom} 
                            height={f.h * localZoom} 
                            fill="rgba(239, 68, 68, 0.1)" 
                            stroke="#ef4444" 
                            strokeWidth="2" 
                            className="pacs-ai-box" 
                        />
                        <rect 
                            x={f.x * localZoom + localPan.x} 
                            y={f.y * localZoom + localPan.y - 18} 
                            width={100} 
                            height={18} 
                            fill="#ef4444" 
                        />
                        <text 
                            x={f.x * localZoom + localPan.x + 4} 
                            y={f.y * localZoom + localPan.y - 6} 
                            fill="white" 
                            fontSize="9" 
                            fontWeight="bold"
                        >
                            {f.label} ({Math.round(f.probability * 100)}%)
                        </text>
                    </g>
                ))}
            </svg>

            {/* MAGNIFYING GLASS */}
            {activeTool === 'MAGNIFY' && isInteracting && (
                <div 
                    className="absolute z-40 w-56 h-56 rounded-full border-4 border-white/20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] pointer-events-none"
                    style={{
                        left: mousePos.x - 112,
                        top: mousePos.y - 112,
                        background: 'black'
                    }}
                >
                    <div 
                        className="absolute flex items-center justify-center w-[1000%] h-[1000%]"
                        style={{
                            transform: `translate(${-mousePos.x * 2.5 + 28}px, ${-mousePos.y * 2.5 + 28}px) scale(2.5)`,
                            left: '50%',
                            top: '50%',
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                            src={currentInstance.imagePath} 
                            alt="MAG"
                            className="max-w-none w-auto h-[90vh] object-contain"
                            style={{ filter: 'grayscale(1) brightness(1.3)' }}
                        />
                    </div>
                </div>
            )}

            {/* DIAGNOSTIC OVERLAYS (Professional Grade) */}
            {/* Top Left: Patient */}
            <div className="absolute top-3 left-3 flex flex-col gap-0.5 text-[10px] font-mono pointer-events-none pacs-overlay">
                <span className="text-white font-bold tracking-tight text-[11px]">{study.patientName}</span>
                <span className="text-slate-400">ID: {study.patientID}</span>
                <span className="text-slate-400">DOB: {study.patientBirthDate} ({study.patientSex})</span>
            </div>

            {/* Top Right: Study */}
            <div className="absolute top-3 right-3 flex flex-col gap-0.5 text-[10px] font-mono text-right pointer-events-none pacs-overlay">
                <span className="text-white font-bold">{study.institutionName}</span>
                <span className="text-slate-400">{study.studyDate}</span>
                <span className="text-cyan-500 font-bold">{study.modality}</span>
            </div>

            {/* Bottom Left: Parameters */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-0.5 text-[10px] font-mono pointer-events-none pacs-overlay">
                <div className="flex gap-2 text-slate-400">
                    <span>W: <b className="text-white">{Math.round(localWW)}</b></span>
                    <span>L: <b className="text-white">{Math.round(localWC)}</b></span>
                </div>
                <div className="flex gap-2 text-slate-400">
                    <span>Zoom: <b className="text-white">{Math.round(localZoom * 100)}%</b></span>
                    <span>Loc: <b className="text-white">{currentInstance.sliceLocation}mm</b></span>
                </div>
            </div>

            {/* Bottom Right: Series info */}
            <div className="absolute bottom-3 right-3 flex flex-col gap-0.5 text-[10px] font-mono text-right pointer-events-none pacs-overlay">
                <span className="text-slate-400 uppercase tracking-tighter">{series.seriesDescription}</span>
                <span className="text-white font-black text-xs">IMG: {currentSlice + 1} / {totalSlices}</span>
            </div>

            {/* Orientation Markers */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 text-[9px] font-bold text-slate-500/50">R</div>
            <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[9px] font-bold text-slate-500/50">L</div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-500/50">A</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-500/50">P</div>

            <style jsx>{`
                .pacs-overlay {
                    text-shadow: 1px 1px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(0,0,0,0.8), 1px -1px 0px rgba(0,0,0,0.8), -1px 1px 0px rgba(0,0,0,0.8);
                }
                .pacs-ai-box {
                    animation: ai-pulse 2s infinite ease-in-out;
                }
                @keyframes ai-pulse {
                    0%, 100% { stroke-opacity: 1; fill-opacity: 0.15; }
                    50% { stroke-opacity: 0.4; fill-opacity: 0.05; }
                }
            `}</style>
        </div>
    );
}
