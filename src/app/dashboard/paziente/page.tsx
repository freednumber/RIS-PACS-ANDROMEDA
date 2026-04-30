'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ImageViewer from '@/components/ImageViewer';

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
    const [upcomingExams, setUpcomingExams] = useState<ExamData[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewerExamId, setViewerExamId] = useState<string | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingForm, setBookingForm] = useState({ tipoEsame: 'RX', descrizioneEsame: '', dataDesiderata: '', struttura: 'Andromeda General Hospital', note: '' });

    // Build the viewer URL with patient/exam context
    const viewerUrl = useMemo(() => {
        if (!viewerExamId) return null;
        const exam = completedExams.find(e => e.id === viewerExamId);
        if (!exam) return null;
        const params = new URLSearchParams({
            studyId: viewerExamId,
            patient: `${patient?.cognome || ''}^${patient?.nome || ''}`,
            patientId: patient?.codiceFiscale || '',
            studyDate: exam.data ? new Date(exam.data).toISOString().slice(0, 10).replace(/-/g, '') : '',
            studyDesc: `${exam.tipo} ${exam.descrizione}`,
            institution: exam.struttura || '',
            modality: exam.tipo || 'CT',
        });
        return `/dicom-viewer-v4.html?${params.toString()}`;
    }, [viewerExamId, completedExams, patient]);

    // Close viewer on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && viewerExamId) setViewerExamId(null);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [viewerExamId]);

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
                    setUpcomingExams(examData.data?.upcoming || []);
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

    const handleBookExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/prenotazioni', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingForm)
            });
            if (res.ok) {
                setShowBookingModal(false);
                fetch('/api/paziente/esami').then(r => r.json()).then(d => {
                    if(d.success) {
                        setUpcomingExams(d.data?.upcoming || []);
                        setCompletedExams(d.data?.completed || []);
                    }
                });
                setBookingForm({ tipoEsame: 'RX', descrizioneEsame: '', dataDesiderata: '', struttura: 'Andromeda General Hospital', note: '' });
                alert("Richiesta di prenotazione inviata con successo.");
            }
        } catch(e) { console.error(e); }
    };

    const handleAcceptProposal = async (id: string, accept: boolean) => {
        try {
            const res = await fetch(`/api/prenotazioni/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stato: accept ? 'CONFERMATO' : 'ANNULLATO' })
            });
            if (res.ok) {
                fetch('/api/paziente/esami').then(r => r.json()).then(d => d.success && setUpcomingExams(d.data?.upcoming || []));
            }
        } catch (e) { console.error(e); }
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

    const handlePrintReferto = () => {
        const content = document.getElementById('referto-content')?.innerHTML;
        if (!content) return;
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(`
                <html>
                    <head>
                        <title>Stampa Referto</title>
                        <style>
                            @page { margin: 20mm; }
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; font-size: 14px; line-height: 1.6; }
                            h3 { font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
                            p { margin: 0; }
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
                            .text-slate-600 { color: #333; font-family: Georgia, serif; }
                            .pt-16 { padding-top: 50px; font-style: italic; font-size: 11px; text-align: center; }
                            .text-sm { font-size: 14px; }
                            .text-[10px], .text-[9px], .text-[8px] { font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
                            label { display: block; font-size: 10px; color: #666; text-transform: uppercase; font-weight: bold; }
                            .border-l-2 { border-left: 2px solid #000; padding-left: 10px; margin-bottom: 10px; }
                            svg { display: none; }
                        </style>
                    </head>
                    <body>
                        ${content}
                    </body>
                </html>
            `);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => {
                printWin.print();
                printWin.close();
            }, 500);
        }
    };

    const handleDownloadReferto = () => {
        const text = selectedExam?.refertoText || "In attesa di refertazione ufficiale da parte del medico radiologo esperto.";
        const dateStr = selectedExam?.data ? new Date(selectedExam.data).toLocaleDateString() : '';
        const blob = new Blob([
            `REFERTO UFFICIALE - ${selectedExam?.struttura || ''}\n`,
            "--------------------------------------------------\n",
            `Paziente: ${patient?.nome} ${patient?.cognome}\n`,
            `Esame: ${selectedExam?.tipo} - ${selectedExam?.descrizione}\n`,
            `Data Esame: ${dateStr}\n`,
            "--------------------------------------------------\n\n",
            `ESITO E CONSIDERAZIONI CLINICHE:\n`,
            `${text}\n\n`,
            "--------------------------------------------------\n",
            `Documento firmato digitalmente.`
        ], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Referto_${patient?.cognome || 'Paziente'}_${selectedExam?.tipo || 'Esame'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400">📋</span>
                            <h2 className="text-lg font-bold">Fascicolo Radiologico</h2>
                        </div>
                        <button onClick={() => setShowBookingModal(true)} className="px-4 py-2 bg-[#00D4BE]/20 text-[#00D4BE] border border-[#00D4BE]/50 hover:bg-[#00D4BE]/30 transition-colors rounded-lg text-xs font-bold uppercase tracking-wider">
                            + Prenota Esame
                        </button>
                    </div>

                    <div className="space-y-8 overflow-y-auto pr-2 max-h-[400px] scrollbar-thin">
                        {/* Upcoming / Pending Exams Section */}
                        {upcomingExams.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500/70">Prossimi Appuntamenti</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {upcomingExams.map((exam) => (
                                        <div key={exam.id} className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-sm font-bold text-amber-100">{exam.descrizione}</h4>
                                                    <div className="text-xs text-amber-400/80 mt-1">{new Date(exam.data).toLocaleString('it-IT')}</div>
                                                </div>
                                                <span className={`text-[9px] px-2 py-1 rounded font-black tracking-widest ${
                                                    exam.stato === 'IN_ATTESA' ? 'bg-slate-800 text-slate-300' : 
                                                    exam.stato === 'PROPOSTA_ALTERNA' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                }`}>
                                                    {exam.stato}
                                                </span>
                                            </div>
                                            {exam.stato === 'PROPOSTA_ALTERNA' && (
                                                <div className="mt-2 pt-2 border-t border-amber-500/20 flex gap-2">
                                                    <button onClick={() => handleAcceptProposal(exam.id, true)} className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/30">Accetta Nuova Data</button>
                                                    <button onClick={() => handleAcceptProposal(exam.id, false)} className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/30">Rifiuta</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Completed Exams */}
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
                                                "p-4 rounded-xl border transition-all cursor-pointer group",
                                                selectedExamId === exam.id 
                                                    ? "bg-cyan-500/10 border-cyan-500/40" 
                                                    : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
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
                                            {/* Launch Viewer Button */}
                                            {selectedExamId === exam.id && (
                                                <div className="mt-3 pt-3 border-t border-white/5 animate-fade-in">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setViewerExamId(exam.id); }}
                                                        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_4px_20px_rgba(0,212,190,0.3)] hover:shadow-[0_8px_30px_rgba(0,212,190,0.5)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                                                            <line x1="8" y1="21" x2="16" y2="21"/>
                                                            <line x1="12" y1="17" x2="12" y2="21"/>
                                                        </svg>
                                                        Apri Viewer DICOM
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ FULLSCREEN DICOM VIEWER MODAL ═══ */}
            {viewerExamId && selectedExam?.series && (
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in">
                    {/* Viewer Top Bar - Clean Close */}
                    <div className="absolute top-4 right-6 z-[100]">
                        <button
                            onClick={() => setViewerExamId(null)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase text-gray-300 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-all shadow-2xl"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Esci dalla Sessione Diagnostica
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                        <ImageViewer series={selectedExam.series} />
                    </div>
                </div>
            )}

            {/* Bottom Row: Viewer + Report (Diagnostic Suite) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                
                {/* DICOM Viewer Card */}
                <div className="lg:col-span-7 glass-card p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-2">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4BE]">DICOM VIEWER</span>
                         </div>
                         <div className="flex gap-2">
                            {selectedExamId && (
                                <button
                                    onClick={() => setViewerExamId(selectedExamId)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-bold uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 transition-all"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
                                    </svg>
                                    Viewer Completo
                                </button>
                            )}
                         </div>
                    </div>
                    <div className="flex-1 bg-black rounded-xl overflow-hidden relative group min-h-[400px]">
                        {selectedExam ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
                                {/* Preview DICOM card */}
                                <div className="w-full max-w-md text-center space-y-6">
                                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round">
                                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                                            <line x1="8" y1="21" x2="16" y2="21"/>
                                            <line x1="12" y1="17" x2="12" y2="21"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">{selectedExam.tipo} — {selectedExam.descrizione}</h3>
                                        <p className="text-xs text-gray-400">
                                            {new Date(selectedExam.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            {' · '}{selectedExam.struttura}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {selectedExam.series ? `${selectedExam.series.length} serie DICOM disponibili` : 'Caricamento dati...'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setViewerExamId(selectedExam.id)}
                                        className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(0,212,190,0.3)] hover:shadow-[0_12px_40px_rgba(0,212,190,0.5)] hover:-translate-y-1 active:scale-[0.98] transition-all"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <polygon points="5 3 19 12 5 21 5 3"/>
                                        </svg>
                                        Apri Viewer DICOM
                                    </button>
                                    <p className="text-[10px] text-gray-600">
                                        Il viewer Andromeda si aprirà con tutti gli strumenti diagnostici
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
                                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                                        <line x1="8" y1="21" x2="16" y2="21"/>
                                        <line x1="12" y1="17" x2="12" y2="21"/>
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <span className="text-sm text-gray-400 font-semibold">Seleziona un esame</span>
                                    <p className="text-xs text-gray-600 mt-1">Clicca su un esame nel fascicolo per visualizzarlo</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Report PDF Mockup */}
                <div className="lg:col-span-5 glass-card p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#00D4BE]">REFERTO PDF FIRMATO</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePrintReferto} className="px-4 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold uppercase transition-colors hover:bg-white/5 active:bg-white/10">🖨️ Stampa</button>
                            <button onClick={handleDownloadReferto} className="px-4 py-1.5 rounded-lg border border-[#00D4BE]/30 text-[9px] font-bold uppercase text-[#00D4BE] transition-colors hover:bg-[#00D4BE]/5">📥 Scarica</button>
                        </div>
                    </div>
                    
                    <div id="referto-content" className="flex-1 bg-white rounded-xl shadow-2xl p-8 text-slate-800 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
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
            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
                        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-white">Prenota Nuovo Esame</h3>
                            <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <form onSubmit={handleBookExam} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tipo Esame</label>
                                    <select required value={bookingForm.tipoEsame} onChange={e => setBookingForm({...bookingForm, tipoEsame: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-[#00D4BE] outline-none">
                                        <option value="RX">RX - Radiologia Tradizionale</option>
                                        <option value="RMN">RMN - Risonanza Magnetica</option>
                                        <option value="TC">TC - Tomografia Computerizzata</option>
                                        <option value="ECO">ECO - Ecografia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Data Desiderata</label>
                                    <input type="datetime-local" required value={bookingForm.dataDesiderata} onChange={e => setBookingForm({...bookingForm, dataDesiderata: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-[#00D4BE] outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descrizione (Es. RX Torace)</label>
                                <input type="text" required value={bookingForm.descrizioneEsame} onChange={e => setBookingForm({...bookingForm, descrizioneEsame: e.target.value})} placeholder="Specifica l'esame prescelto" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-[#00D4BE] outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Note per la Segreteria (Opzionale)</label>
                                <textarea value={bookingForm.note} onChange={e => setBookingForm({...bookingForm, note: e.target.value})} rows={3} placeholder="Eventuali esigenze o note per la segreteria" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-[#00D4BE] outline-none resize-none" />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowBookingModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors">Annulla</button>
                                <button type="submit" className="px-5 py-2.5 bg-[#00D4BE] hover:bg-[#00bda9] text-slate-900 rounded-lg text-sm font-black uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(0,212,190,0.4)]">
                                    Invia Richiesta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}