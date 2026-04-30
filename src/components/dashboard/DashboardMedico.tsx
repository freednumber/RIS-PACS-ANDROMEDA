'use client';

import { useState, useEffect, useCallback } from 'react';
import NeuralBackground from '@/components/NeuralBackground';
import Link from 'next/link';
import { DICOM_STORE } from '@/lib/dicomweb';
import ImageViewer from '@/components/ImageViewer';
import type { SeriesData } from '@/components/Viewport';

// Modality colors
const modalityColor: Record<string, string> = {
  RMN: 'text-[#00D4BE] bg-[#00D4BE]/10 border-[#00D4BE]/30',
  CT:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  RX:  'text-slate-300 bg-slate-300/10 border-slate-300/30',
  PET: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  ECO: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

interface Study {
    id: string;
    patientName: string;
    studyDescription: string;
    studyDate: string;
    modality: string;
    nodeName: string;
    isFederated: boolean;
    status?: string;
}

export default function DashboardMedico({ stats }: { stats: any }) {
    const [selectedTab, setSelectedTab] = useState<'DA_REFERTARE' | 'REFERTATO'>('DA_REFERTARE');
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isGlobalSearch, setIsGlobalSearch] = useState(false);
    const [studies, setStudies] = useState<Study[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Reporting States
    const [reportText, setReportText] = useState("");
    const [isDictating, setIsDictating] = useState(false);
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    // UI States
    const [showWorklist, setShowWorklist] = useState(true);
    const [showReport, setShowReport] = useState(true);
    const [selectedStudyData, setSelectedStudyData] = useState<any>(null);
    const [isFetchingStudy, setIsFetchingStudy] = useState(false);

    const fetchStudies = useCallback(async () => {
        setIsLoading(true);
        try {
            const endpoint = isGlobalSearch ? '/api/federation/search' : '/api/studi';
            const method = isGlobalSearch ? 'POST' : 'GET';
            const body = isGlobalSearch ? JSON.stringify({ query: searchQuery }) : undefined;
            
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const data = await res.json();
            
            if (data.success) {
                // Adapt mixed response formats
                const results = isGlobalSearch 
                    ? data.results 
                    : data.data.map((s: any) => ({
                        id: s.id,
                        patientName: `${s.patient.nome} ${s.patient.cognome}`,
                        studyDescription: s.descrizione,
                        studyDate: s.dataStudio,
                        modality: s.modalita,
                        nodeName: 'Andromeda-Local',
                        isFederated: false,
                        status: s.firme?.length > 0 ? 'REFERTATO' : 'DA_REFERTARE'
                    }));
                setStudies(results);
            }
        } catch (error) {
            console.error('Fetch studies failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, isGlobalSearch]);

    useEffect(() => {
        fetchStudies();
    }, [fetchStudies]);

    const runAiReport = async () => {
        if (!selectedExamId) return;
        setIsAiGenerating(true);
        try {
            const res = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyId: selectedExamId, tipo: 'REFERTO_SUGGERITO' })
            });
            const data = await res.json();
            if (data.success) {
                setReportText(data.data.contenuto);
            }
        } catch (err) {
            console.error('AI Report failed:', err);
        } finally {
            setIsAiGenerating(false);
        }
    };

    const toggleDictation = () => {
        setIsDictating(!isDictating);
        if (!isDictating && reportText === "") {
            setReportText("Esame RM della spalla sinistra. Non si evidenziano lesioni della cuffia dei rotatori...");
        }
    };

    // Fetch full study details when an exam is selected
    useEffect(() => {
        if (!selectedExamId) {
            setSelectedStudyData(null);
            return;
        }

        setIsFetchingStudy(true);
        fetch(`/api/studi/${selectedExamId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSelectedStudyData(data.data);
                    setReportText(data.data.referto || "");
                }
            })
            .catch(err => console.error('Error fetching study data:', err))
            .finally(() => setIsFetchingStudy(false));
    }, [selectedExamId]);

    const selectedExamObj = studies.find(e => e.id === selectedExamId);

    const saveReport = async () => {
        if (!selectedExamId) return;
        setIsFetchingStudy(true); // Reuse as saving state
        try {
            const res = await fetch(`/api/studi/${selectedExamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referto: reportText }),
            });
            const data = await res.json();
            if (data.success) {
                // Refresh studies to update status
                fetchStudies();
                alert('Referto salvato con successo');
            }
        } catch (err) {
            console.error('Save report failed:', err);
        } finally {
            setIsFetchingStudy(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-[#0A0E1A] font-sans">
            {/* Background Canvas Effect */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
                <NeuralBackground />
            </div>

            {/* Deep background shadow & top-left glow */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,_rgba(0,212,190,0.15)_0%,_transparent_50%)]"></div>

            {/* CSS for scrollbars and 3D floating animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scroll::-webkit-scrollbar { width: 4px; }
                .hide-scroll::-webkit-scrollbar-thumb { background: rgba(0,212,190,0.3); border-radius: 4px; }
                .hide-scroll::-webkit-scrollbar-track { background: transparent; }
                
                .glass-report-panel {
                    background: rgba(13, 18, 32, 0.7);
                    backdrop-filter: blur(12px);
                    border-left: 1px solid rgba(0, 212, 190, 0.1);
                }
            `}} />

            {/* LEFT PANEL: Worklist */}
            <div className={`transition-all duration-500 overflow-hidden relative z-20 flex flex-col ${showWorklist ? 'w-[300px] opacity-100' : 'w-0 opacity-0'}`} style={{ borderRight: '1px solid rgba(0, 212, 190, 0.1)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#00D4BE]/10">
                    <span className="text-white font-bold text-sm tracking-wide">Worklist Clinica</span>
                    <button 
                        onClick={() => setIsGlobalSearch(!isGlobalSearch)}
                        className={`text-[9px] font-black border px-2 py-0.5 rounded-full transition-all ${isGlobalSearch ? 'bg-cyan-500 text-slate-900 border-cyan-400 animate-pulse' : 'bg-slate-900 text-cyan-500 border-cyan-900'}`}
                    >
                        {isGlobalSearch ? 'FEDERAZIONE: ON' : 'GLOBAL SEARCH'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 mx-3 mt-2 bg-[#060A12] rounded-xl border border-white/5">
                    <button
                        onClick={() => { setSelectedTab('DA_REFERTARE'); setSelectedExamId(null); }}
                        className={`flex-1 py-1.5 px-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 rounded-lg ${selectedTab === 'DA_REFERTARE' ? 'bg-[#00D4BE] text-[#0A0E1A] shadow-[0_0_12px_rgba(0,212,190,0.35)]' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        DA REFERTARE
                    </button>
                    <button
                        onClick={() => { setSelectedTab('REFERTATO'); setSelectedExamId(null); }}
                        className={`flex-1 py-1.5 px-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 rounded-lg ${selectedTab === 'REFERTATO' ? 'bg-[#00D4BE] text-[#0A0E1A] shadow-[0_0_12px_rgba(0,212,190,0.35)]' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        REFERTATI
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pb-3">
                    <div className="relative group">
                        <svg className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-[#00D4BE] transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-[#0A0E1A]/50 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-[12px] font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00D4BE] focus:border-[#00D4BE] transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg className="absolute right-3 top-2.5 text-slate-500 cursor-pointer hover:text-white transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    </div>
                </div>

                {/* Patient List */}
                <div className="flex-1 overflow-y-auto hide-scroll p-3 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
                            <div className="w-5 h-5 border border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] uppercase tracking-widest text-[#00D4BE]">Sincronizzazione...</span>
                        </div>
                    ) : studies.filter(e => isGlobalSearch || e.status === selectedTab).map((exam) => {
                        const isSelected = selectedExamId === exam.id;
                        return (
                            <div
                                key={exam.id}
                                onClick={() => setSelectedExamId(exam.id)}
                                className={`p-3 rounded-xl flex gap-3 cursor-pointer transition-all duration-300 border ${isSelected
                                    ? 'bg-[#00D4BE]/8 border-[#00D4BE]/60 shadow-[0_0_20px_rgba(0,212,190,0.08)] ring-1 ring-[#00D4BE]/20 scale-[1.02]'
                                    : 'bg-[#0D1220]/60 border-white/5 hover:border-[#00D4BE]/25 hover:bg-[#00D4BE]/5 hover:translate-x-1'
                                    }`}
                            >
                                <div className="mt-1 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                    <img src={"https://i.pravatar.cc/100?u=" + exam.id} alt="Avatar" className="w-full h-full object-cover opacity-80" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-white text-[13px] tracking-tight">{exam.patientName}</span>
                                        {exam.isFederated && (
                                            <span className="text-[7px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded ml-2 uppercase">Remote</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#00D4BE] mt-0.5">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${modalityColor[exam.modality] ?? ''}`}>{exam.modality}</span>
                                        <span className="text-slate-500 text-[10px]">|</span>
                                        <span className="text-slate-300 truncate text-[11px]">{exam.studyDescription}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                        <span>{new Date(exam.studyDate).toLocaleDateString()}</span>
                                        <span className="mx-0.5 opacity-30">•</span>
                                        <span className="truncate">{exam.nodeName}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CENTER PANEL: DICOM Viewer */}
            <div className="flex-1 relative overflow-hidden bg-black flex flex-col z-10">
                {/* Section Toggle Buttons */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4">
                    <button 
                        onClick={() => setShowWorklist(!showWorklist)}
                        className={`w-8 h-12 rounded-r-xl flex items-center justify-center transition-all border border-l-0 ${showWorklist ? 'bg-[#00D4BE] text-[#0A0E1A] border-[#00D4BE]/30' : 'bg-black/60 text-[#00D4BE] border-[#00D4BE]/20'}`}
                    >
                        {showWorklist ? '◀' : '▶'}
                    </button>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4">
                    <button 
                        onClick={() => setShowReport(!showReport)}
                        className={`w-8 h-12 rounded-l-xl flex items-center justify-center transition-all border border-r-0 ${showReport ? 'bg-[#00D4BE] text-[#0A0E1A] border-[#00D4BE]/30' : 'bg-black/60 text-[#00D4BE] border-[#00D4BE]/20'}`}
                    >
                        {showReport ? '▶' : '◀'}
                    </button>
                </div>

                <div className="absolute inset-0 z-0 opacity-10">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
                              {selectedStudyData ? (
                    <div key={`viewer-${selectedExamId}`} className="absolute inset-0 flex flex-col z-10">
                        <ImageViewer series={selectedStudyData.series} />
                        
                        {/* Status Overlays */}
                        <div className="absolute bottom-4 left-4 z-40 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] drop-shadow-lg">PACS Engine Active</span>
                        </div>
                    </div>
                ) : isFetchingStudy ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#020202]">
                        <div className="w-10 h-10 border-2 border-[#00D4BE] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00D4BE]">Retrieving Study Data...</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-700 gap-4">
                        <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center opacity-20">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                        </div>
                        <span className="text-[10px] tracking-[0.4em] font-black uppercase opacity-40">Select an exam to begin visualization</span>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: Medical Report */}
            <div className={`transition-all duration-500 overflow-hidden relative z-20 flex flex-col glass-report-panel ${showReport ? 'w-[360px] opacity-100' : 'w-0 opacity-0'}`}>

                {selectedExamObj ? (
                    <div key={`report-${selectedExamObj.id}`} className="absolute inset-0 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#00D4BE]">
                            <span className="text-[#0A0E1A] font-bold text-sm tracking-wide">Medical Report</span>
                        </div>
                        {/* Sottotitolo esame */}
                        <div className="px-4 py-2 bg-[#00D4BE]/5 border-b border-[#00D4BE]/15 flex items-center justify-between">
                            <span className="text-[#00D4BE] text-[11px] font-bold tracking-widest uppercase truncate max-w-[70%]">
                                {selectedExamObj.modality} — {selectedExamObj.studyDescription}
                            </span>
                            <button 
                                onClick={runAiReport}
                                disabled={isAiGenerating}
                                className={`p-1.5 rounded-lg border transition-all ${isAiGenerating ? 'animate-pulse bg-purple-500 text-white border-purple-400' : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50 shadow-sm'}`}
                                title="Genera Referto con AI"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                            </button>
                        </div>

                        {/* Report Body */}
                        <div className="flex-1">
                            <textarea
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                placeholder="Start typing the radiological findings..."
                                className="flex-1 w-full h-full resize-none border-none bg-transparent outline-none text-[#00D4BE] text-[15px] leading-[1.8] font-serif placeholder-slate-600 p-8 tracking-wide"
                                readOnly={selectedTab === 'REFERTATO'}
                            ></textarea>
                        </div>

                        {/* Footer CTA */}
                        <div className="p-6 border-t border-[#00D4BE]/10 bg-black/40 space-y-3">
                            {selectedTab === 'DA_REFERTARE' ? (
                                <>
                                    <button 
                                        onClick={saveReport}
                                        className="w-full py-4 bg-[#00D4BE] text-[#0A0E1A] font-bold text-xs tracking-widest uppercase rounded-xl hover:bg-[#00C4AE] active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(0,212,190,0.3)] hover:shadow-[0_0_30px_rgba(0,212,190,0.5)] flex items-center justify-center gap-2"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                        FIRMA & APPROVA REFERTO
                                    </button>

                                    {/* Mic Button */}
                                    <button
                                        onClick={toggleDictation}
                                        className={`p-3 rounded-xl border transition-all duration-300 ${
                                            isDictating
                                                ? 'bg-red-500/10 border-red-500/40 text-red-400 animate-pulse'
                                                : 'bg-[#00D4BE]/10 border-[#00D4BE]/30 text-[#00D4BE] hover:bg-[#00D4BE]/20'
                                        }`}
                                    >
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    </button>
                                </>
                            ) : (
                                <button className="w-full py-3 bg-emerald-500/10 text-emerald-400 font-bold text-xs tracking-widest uppercase rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 cursor-default">
                                    REFERTO FIRMATO
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-[10px] tracking-[0.2em] uppercase text-center px-12 leading-relaxed opacity-40">
                        <svg className="mb-4" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Select an exam to begin reporting
                    </div>
                )}
            </div>

        </div>
    );
}
