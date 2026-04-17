'use client';

import { formatDateTime, getModalitaLabel } from '@/lib/utils';
import ImageViewer from '@/components/ImageViewer';

interface StudyData {
    id: string;
    accessionNumber: string;
    studyInstanceUID: string;
    dataStudio: string;
    descrizione: string | null;
    modalita: string;
    bodyPart: string | null;
    sedeEsame: string | null;
    stato: string;
    priorita: string;
    referto: string | null;
    dataReferto: string | null;
    note: string | null;
    patient: {
        id: string; nome: string; cognome: string;
    };
    medicoRichiedente: { nome: string; cognome: string; specializzazione: string | null } | null;
    medicoRefertante: { nome: string; cognome: string; specializzazione: string | null } | null;
    series: Array<{
        id: string; descrizione: string | null; modalita: string | null;
        instances: Array<{ id: string; filePath: string; fileSize: number }>;
    }>;
    firme: Array<{ id: string; createdAt: string; firmaData: string }>;
}

const MOCK_MAP: Record<string, number> = {
    'mock-1': 0,
    'mock-2': 1,
    'mock-3': 2
};

interface ViewportState {
    studyInstanceUID: string;
    seriesIndex: number;
    currentSlice: number;
    windowWidth: number;
    windowCenter: number;
    zoom: number;
    pan: { x: number, y: number };
}

export default function EsameDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [study, setStudy] = useState<StudyData | null>(null);
    const [loading, setLoading] = useState(true);

    // AI States
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<{ 
        contenuto: string; 
        confidenza: number;
        findings?: any[];
    } | null>(null);
    const [isAgentOpen, setIsAgentOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/studi/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStudy(data.data);
                }
            })
            .catch(err => console.error('Fetch study error:', err))
            .finally(() => setLoading(false));
    }, [id]);

    const runAiAnalysis = async (type: string) => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyId: id, type })
            });
            const data = await res.json();
            if (data.data) {
                setAiResult(data.data);
                setIsAiPanelOpen(true);
            }
        } catch (err) {
            console.error('AI Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full" />
                <p className="text-sm font-mono tracking-widest text-cyan-500 uppercase">Accessing Andromeda Vault...</p>
            </div>
        );
    }

    if (!study) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="glass-card p-12 text-center">
                    <svg className="mx-auto mb-4 opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <h2 className="text-xl font-bold mb-2">Esame non trovato</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                        L&apos;esame richiesto non è disponibile nel sistema.
                    </p>
                    <Link href="/dashboard/paziente" className="btn-primary">Torna alla Dashboard</Link>
                </div>
            </div>
        );
    }

    const modalityIcons: Record<string, string> = { MR: '🧠', CT: '🫁', CR: '🦴', US: '🫀', MG: '🔬' };

    return (
        <div className="space-y-5 animate-fade-in relative min-h-screen">
            <CornerstoneInit />
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/paziente" className="hover:underline" style={{ color: '#00e5ff' }}>Dashboard</Link>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                <span className="truncate">{study.descrizione}</span>
            </div>

            {/* ═══ MAIN LAYOUT ═══ */}
            <div className={`grid gap-5 transition-all duration-500 ${isAiPanelOpen ? 'grid-cols-1 lg:grid-cols-[1fr_340px]' : 'grid-cols-1'}`}>

                {/* ═══ LEFT: PACS VIEWPOINTS GRID ═══ */}
                <div className="rounded-2xl overflow-hidden relative flex flex-col min-h-[650px]" style={{ background: '#000', border: '1px solid rgba(0,229,255,0.2)' }}>

                    {/* ─── Global Viewer Toolbar ─── */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/80 border-b border-white/10 backdrop-blur-md z-40">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Clinical Viewer Online</span>
                        </div>

                        <div className="h-4 w-px bg-white/10 mx-2" />

                        <button onClick={() => runAiAnalysis('DIAGNOSI_DIFFERENZIALE')}
                            className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                             Andromeda Insight™
                        </button>
                    </div>

                    {/* ─── Unified Multi-Grid Viewer ─── */}
                    <div className="flex-1 bg-black">
                        <ImageViewer series={study.series} />
                    </div>

                    {/* ─── Bottom Status Bar ─── */}
                    <div className="flex items-center gap-6 px-4 py-1.5 bg-black text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
                         <div className="flex gap-2">
                             <span className="text-cyan-500 font-bold">MODE:</span>
                             <span>Patient Portal Review</span>
                         </div>
                         <div className="ml-auto">
                             Andromeda Secured PACS v2.5
                         </div>
                    </div>
                </div>

                {/* ═══ RIGHT: EXAM/SERIES LIST SIDEBAR ═══ */}
                <div>
                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-4">
                        <button 
                            onClick={() => setSidebarTab('SERIES')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'SERIES' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-white'}`}
                        >
                            Series
                        </button>
                        <button 
                            onClick={() => setSidebarTab('EXAMS')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'EXAMS' ? 'bg-cyan-500 text-black' : 'text-slate-500 hover:text-white'}`}
                        >
                            Exams
                        </button>
                    </div>

                    <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-hide">
                        {sidebarTab === 'EXAMS' ? (
                            DICOM_STORE.map(study => {
                                const isStudyInView = viewports.some(v => v.studyInstanceUID === study.studyInstanceUID);
                                const sliceCount = getTotalInstances(study);
                                return (
                                    <button
                                        key={study.studyInstanceUID}
                                        onClick={() => {
                                            handleViewportUpdate(activeViewport, { 
                                                studyInstanceUID: study.studyInstanceUID,
                                                seriesIndex: 0,
                                                currentSlice: 0,
                                                windowWidth: study.windowWidth,
                                                windowCenter: study.windowCenter
                                            });
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-200"
                                        style={{
                                            background: isStudyInView ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isStudyInView ? '#00e5ff' : 'rgba(0,229,255,0.12)'}`,
                                            opacity: isStudyInView ? 1 : 0.7
                                        }}
                                    >
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                                            style={{ background: '#0d1b2a', border: '1px solid rgba(0,229,255,0.1)' }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={study.thumbnailPath} alt={study.studyDescription} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-[11px] truncate" style={{ color: '#e0f7fa' }}>{study.studyDescription}</div>
                                            <div className="text-[9px]" style={{ color: '#78909c' }}>{formatPatientName(study.patientName)}</div>
                                            <div className="text-[8px]" style={{ color: '#546e7a' }}>{study.series.length} series · {sliceCount} imgs</div>
                                        </div>
                                        <div className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-bold text-cyan-400">
                                            {study.modality}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            selectedStudy.series.map((series, idx) => {
                                const isActiveSeries = viewports[activeViewport].seriesIndex === idx && viewports[activeViewport].studyInstanceUID === selectedStudy.studyInstanceUID;
                                return (
                                    <button
                                        key={series.seriesInstanceUID}
                                        onClick={() => handleViewportUpdate(activeViewport, { seriesIndex: idx, currentSlice: 0 })}
                                        className="w-full flex flex-col gap-2 p-3 rounded-2xl text-left transition-all duration-200 group relative overflow-hidden"
                                        style={{
                                            background: isActiveSeries ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isActiveSeries ? '#00e5ff' : 'rgba(255,255,255,0.06)'}`
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={series.instances[0].imagePath} 
                                                    alt={series.seriesDescription} 
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-bold text-cyan-400 mb-0.5">SERIES {series.seriesNumber}</div>
                                                <div className="text-[11px] font-semibold text-white truncate leading-tight">{series.seriesDescription}</div>
                                                <div className="text-[9px] text-slate-500 mt-1">{series.instances.length} Slices · {series.modality}</div>
                                            </div>
                                        </div>
                                        {isActiveSeries && (
                                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-cyan-500 text-black text-[8px] font-black uppercase tracking-tighter">
                                                Active Viewport
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* ─── DICOMweb Info ─── */}
                    <div className="mt-5 p-3 rounded-xl" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#00e5ff' }}>
                            DICOMweb Endpoint
                        </div>
                        <div className="font-mono text-[9px] leading-relaxed break-all" style={{ color: '#546e7a' }}>
                            QIDO-RS: /api/dicomweb/studies<br />
                            WADO-RS: /api/dicomweb/studies/&#123;uid&#125;/.../rendered<br />
                            Adapter: healthcare-dicom-dicomweb-adapter
                        </div>
                    </div>

                    {/* ─── Quick controls hint ─── */}
                    <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#78909c' }}>
                            Controlli
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 text-[9px]" style={{ color: '#546e7a' }}>
                            <span>⇅ Scroll rotella</span><span>Scorri slice</span>
                            <span>← → frecce</span><span>Slice prec/succ</span>
                            <span>Home / End</span><span>Prima / ultima</span>
                            <span>Filmstrip</span><span>Click su thumbnail</span>
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHTMOST: AI FINDINGS PANEL (Conditional) ═══ */}
                {isAiPanelOpen && (
                    <div className="flex flex-col h-full glass-card border-cyan-500/30 animate-slide-in-right overflow-hidden shadow-[0_0_40px_rgba(0,212,190,0.1)]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-cyan-500/10">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">Analisi AI</span>
                            </div>
                            <button onClick={() => setIsAiPanelOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-60">
                                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase">Elaborazione Vision AI...</span>
                                </div>
                            ) : aiResult ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidenza</span>
                                        <span className="text-[10px] font-black text-emerald-400">{Math.round(aiResult.confidenza * 100)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${aiResult.confidenza * 100}%` }} />
                                    </div>
                                    
                                    <div className="pt-4 font-serif text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                                        {aiResult.contenuto}
                                    </div>

                                    <div className="pt-6 space-y-3">
                                        <button className="w-full py-2.5 bg-cyan-500 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,212,190,0.3)]">
                                            Copia nel Referto
                                        </button>
                                        <button className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all">
                                            Richiedi Second Opinion
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-40 text-center">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                    <span className="text-[10px] uppercase tracking-widest">Pronto per l&apos;analisi intelligente</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ STUDY INFO CARD ═══ */}
            <div className={`glass-card p-5 transition-all duration-500 ${isAiPanelOpen ? 'lg:mr-[360px]' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h1 className="text-xl font-bold">{study.descrizione}</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                                style={{ background: 'rgba(0,200,83,0.12)', color: '#00c853', border: '1px solid rgba(0,200,83,0.2)' }}>
                                ✓ Disponibile
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <span className="flex items-center gap-1.5">📅 {formatDateTime(study.dataStudio)}</span>
                            <span className="flex items-center gap-1.5">🏥 {study.sedeEsame}</span>
                            <span className="flex items-center gap-1.5">📊 {study.series.length} serie · {study.series.reduce((acc, s) => acc + s.instances.length, 0)} immagini</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ AGENT CHAT BUBBLE ═══ */}
            <div className="fixed bottom-6 right-6 z-[100]">
                {isAgentOpen ? (
                    <div className="w-[360px] h-[500px] bg-[#0A0E1A] border border-cyan-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-spring-up">
                        <div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">🤖</div>
                                <div>
                                    <div className="text-[11px] font-black text-white uppercase tracking-tighter">Andromeda Agent</div>
                                    <div className="text-[9px] text-cyan-100 opacity-80 uppercase tracking-widest">Online · Clinica Villa Serena</div>
                                </div>
                            </div>
                            <button onClick={() => setIsAgentOpen(false)} className="text-white hover:opacity-70 transition-opacity">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-900 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold">🤖</div>
                                <div className="max-w-[80%] bg-slate-800 rounded-2xl rounded-tl-none p-3 text-[12px] text-slate-200 leading-relaxed shadow-lg border border-white/5">
                                    Ciao! Sono l&apos;assistente clinico di Andromeda. Come posso aiutarti con lo studio di <b>{study.patient.cognome} {study.patient.nome}</b> oggi?
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/5">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Chiedi all'agente..." 
                                    className="w-full bg-[#0d1220] border border-cyan-500/20 rounded-2xl px-4 py-3 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
                                />
                                <button className="absolute right-2 top-2 p-1.5 bg-cyan-500 text-slate-900 rounded-lg hover:bg-cyan-400 transition-colors">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAgentOpen(true)}
                        className="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center text-slate-900 shadow-[0_8px_30px_rgba(0,212,190,0.4)] hover:shadow-[0_12px_45px_rgba(0,212,190,0.6)] hover:-translate-y-1 transition-all duration-300 active:scale-95 group"
                    >
                        <div className="relative">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border-2 border-[#0A0E1A] animate-ping" />
                        </div>
                    </button>
                )}
            </div>

            <style jsx global>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes spring-up {
                    0% { transform: translateY(40px) scale(0.9); opacity: 0; }
                    70% { transform: translateY(-5px) scale(1.02); opacity: 1; }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                .animate-spring-up {
                    animation: spring-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
}
