'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ImageViewer from '@/components/ImageViewer';
import { cn } from '@/lib/utils';

interface ExamData {
    id: string;
    tipo: string;
    descrizione: string;
    data: string;
    struttura: string;
    stato: string;
    refertoDisponibile?: boolean;
    medico?: string;
    refertoText?: string;
    series?: any[];
}

interface PatientInfo {
    nome: string;
    cognome: string;
    codiceFiscale: string;
    dataNascita: string;
    sesso: string;
    telefono: string;
}

export default function PazienteDashboard() {
    const [patient, setPatient] = useState<PatientInfo | null>(null);
    const [completedExams, setCompletedExams] = useState<ExamData[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then(r => r.json()),
            fetch('/api/paziente/esami').then(r => r.json()),
        ])
            .then(([authData, examData]) => {
                if (authData.success && authData.data) {
                    setPatient(authData.data);
                }
                if (examData.success) {
                    const completed = examData.data?.completed || [];
                    setCompletedExams(completed);
                    // Selection logic: auto-load latest if available
                    if (completed.length > 0 && !selectedExamId) {
                        fetchExamDetails(completed[0].id);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const fetchExamDetails = async (id: string) => {
        setSelectedExamId(id);
        try {
            const res = await fetch(`/api/studi/${id}`);
            const data = await res.json();
            if (data.success) {
                setCompletedExams(prev => prev.map(e => 
                    e.id === id ? { ...e, series: data.data.series, refertoText: data.data.referto } : e
                ));
            }
        } catch (err) { console.error(err); }
    };

    const selectedExam = useMemo(() => 
        completedExams.find(e => e.id === selectedExamId), 
    [completedExams, selectedExamId]);

    // Grouping by structure
    const examsByStructure = useMemo(() => {
        const groups: Record<string, ExamData[]> = {};
        completedExams.forEach(exam => {
            if (!groups[exam.struttura]) groups[exam.struttura] = [];
            groups[exam.struttura].push(exam);
        });
        return groups;
    }, [completedExams]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in p-4">
            
            {/* Top Row: User + Fascicolo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Profile Card */}
                <div className="md:col-span-3 glass-card p-6 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-[#00D4BE] flex items-center justify-center text-3xl font-bold text-slate-900 mb-4 shadow-[0_0_20px_rgba(0,212,190,0.3)]">
                        {patient?.nome?.[0]}{patient?.cognome?.[0]}
                    </div>
                    <h1 className="text-xl font-bold text-white mb-1">{patient?.nome} {patient?.cognome}</h1>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 mb-6 tracking-widest">{patient?.codiceFiscale}</span>

                    <div className="w-full space-y-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 uppercase font-bold tracking-tighter">Nato il</span>
                            <span className="text-white font-medium">{patient?.dataNascita ? new Date(patient.dataNascita).toLocaleDateString() : 'N/D'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 uppercase font-bold tracking-tighter">Sesso</span>
                            <span className="text-white font-medium">{patient?.sesso === 'M' ? 'M' : 'F'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 uppercase font-bold tracking-tighter">Recapito</span>
                            <span className="text-white font-medium">{patient?.telefono || '+39 345 1234567'}</span>
                        </div>
                    </div>

                    <div className="mt-8 w-full p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between group cursor-default hover:bg-teal-500/10 transition-all">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🩸</span>
                            <span className="text-[10px] font-bold uppercase text-teal-400 tracking-widest">Gruppo Sanguigno</span>
                        </div>
                        <span className="text-2xl font-black text-teal-400 group-hover:scale-110 transition-transform">A+</span>
                    </div>
                </div>

                {/* Fascicolo Radiologico */}
                <div className="md:col-span-9 glass-card p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-cyan-400">📋</span>
                        <h2 className="text-lg font-bold">Fascicolo Radiologico</h2>
                    </div>

                    <div className="space-y-8 overflow-y-auto pr-2 max-h-[400px] scrollbar-thin">
                        {Object.entries(examsByStructure).map(([structure, exams]) => (
                            <div key={structure} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-500/70">{structure}</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {exams.map((exam) => (
                                        <div 
                                            key={exam.id}
                                            onClick={() => fetchExamDetails(exam.id)}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                                                selectedExamId === exam.id 
                                                    ? "bg-cyan-500/10 border-cyan-500/40" 
                                                    : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-bold border border-white/5 shadow-inner">
                                                    {exam.tipo}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold">{exam.descrizione}</h4>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(exam.data).toLocaleDateString('it-IT')} — {new Date(exam.data).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-bold tracking-widest text-[#00D4BE] border border-[#00D4BE]/30 px-2 py-0.5 rounded bg-[#00D4BE]/5">REFERTATO</span>
                                                <svg className={cn("w-4 h-4 text-gray-600 group-hover:text-white transition-colors", selectedExamId === exam.id && "text-white")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Viewer + Report (Diagnostic Suite) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                
                {/* DICOM Viewer Card */}
                <div className="lg:col-span-7 glass-card p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-2">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4BE]">DICOM PREVIEW [COMPRESSED]</span>
                         </div>
                         <div className="flex gap-4 opacity-40">
                            <span className="text-xs">🔍</span>
                            <span className="text-xs">➕</span>
                            <span className="text-xs">🔄</span>
                         </div>
                    </div>
                    <div className="flex-1 bg-black rounded-xl overflow-hidden relative group">
                        {selectedExam?.series ? (
                            <ImageViewer series={selectedExam.series} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                <span className="text-xs text-cyan-500/40 uppercase tracking-widest">Caricamento DICOM...</span>
                            </div>
                        )}
                        
                        {/* Andromeda Overlay (Matches Screenshot) */}
                        <div className="absolute top-4 left-4 pointer-events-none text-[10px] font-mono text-cyan-400/80 drop-shadow-md space-y-1">
                            <div>{patient?.nome} {patient?.cognome}</div>
                            <div>DOB: {patient?.dataNascita ? new Date(patient.dataNascita).toLocaleDateString() : 'N/D'}</div>
                            <div>EX-1</div>
                        </div>
                        <div className="absolute top-4 right-4 pointer-events-none text-[10px] font-mono text-cyan-400/80 text-right drop-shadow-md space-y-1">
                            <div>{selectedExam?.struttura}</div>
                            <div>{selectedExam?.data ? new Date(selectedExam.data).toLocaleDateString() : ''}</div>
                            <div>{selectedExam?.tipo} — {selectedExam?.descrizione}</div>
                        </div>
                        
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="bg-[#00D4BE] text-slate-900 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(0,212,190,0.5)] active:scale-95 transition-all">
                                📥 Request Original Full-Resolution DICOM
                             </button>
                        </div>
                    </div>
                </div>

                {/* Report PDF Mockup */}
                <div className="lg:col-span-5 glass-card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4BE]">REFERTO PDF FIRMATO</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold uppercase transition-colors hover:bg-white/5 active:bg-white/10">🖨️ Stampa</button>
                            <button className="px-4 py-1.5 rounded-lg border border-[#00D4BE]/30 text-[9px] font-bold uppercase text-[#00D4BE] transition-colors hover:bg-[#00D4BE]/5">📥 Scarica</button>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-white rounded-xl shadow-2xl p-8 text-slate-800 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                        {/* Report Header */}
                        <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase">Referto Ufficiale</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedExam?.struttura}</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 7h.01M17 7h.01M17 17h.01M7 17h.01"/></svg>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-y-6 mb-10 pb-10 border-b border-slate-50">
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Paziente</label>
                                <p className="text-sm font-bold">{patient?.nome} {patient?.cognome}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Esame</label>
                                <p className="text-sm font-bold">{selectedExam?.tipo} - {selectedExam?.descrizione}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Data Esame</label>
                                <p className="text-xs font-medium">{selectedExam?.data ? new Date(selectedExam.data).toLocaleDateString() : ''}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Refertato il</label>
                                <p className="text-xs font-medium">{selectedExam?.data ? new Date(selectedExam.data).toLocaleDateString() : ''}</p>
                            </div>
                        </div>

                        {/* Report Body */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-l-2 border-[#00D4BE] pl-3">Esito e Considerazioni Cliniche</h4>
                            <div className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap font-serif">
                                {selectedExam?.refertoText || "In attesa di refertazione ufficiale da parte del medico radiologo esperto."}
                            </div>
                        </div>

                        <div className="mt-auto pt-16 flex flex-col items-center">
                             <div className="w-24 h-px bg-slate-100 mb-2" />
                             <p className="text-[8px] text-gray-400 italic">Documento firmato digitalmente — Valido ai fini di legge</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}