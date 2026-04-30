'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate, formatDateTime, getStatoLabel, getStatoColor, getModalitaLabel, cn } from '@/lib/utils';
import ImageViewer from '@/components/ImageViewer';

interface PatientDetail {
    id: string;
    codiceFiscale: string;
    nome: string;
    cognome: string;
    dataNascita: string;
    sesso: string;
    telefono: string | null;
    email: string | null;
    studi: Array<{
        id: string;
        dataStudio: string;
        descrizione: string | null;
        modalita: string;
        sedeEsame: string | null;
        stato: string;
        priorita: string;
        referto: string | null;
        _count: { series: number; firme: number };
        series: Array<{
            instances: Array<{ id: string }>;
        }>;
    }>;
}

export default function MedicoPatientDetailPage() {
    const params = useParams();
    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [viewerExamId, setViewerExamId] = useState<string | null>(null);
    
    // Editor State
    const [refertoForm, setRefertoForm] = useState('');
    const [savingReferto, setSavingReferto] = useState(false);

    useEffect(() => {
        fetch(`/api/pazienti/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setPatient(data.data);
                    if (data.data.studi && data.data.studi.length > 0) {
                        setSelectedExamId(data.data.studi[0].id);
                        setRefertoForm(data.data.studi[0].referto || '');
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    const selectExam = (examId: string) => {
        setSelectedExamId(examId);
        const st = patient?.studi.find(s => s.id === examId);
        if (st) {
            setRefertoForm(st.referto || '');
        }
    };

    const handleSaveReferto = async () => {
        if (!selectedExamId) return;
        setSavingReferto(true);
        try {
            const res = await fetch(`/api/studi/${selectedExamId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referto: refertoForm }),
            });
            const data = await res.json();
            if (data.success) {
                setPatient(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        studi: prev.studi.map(s => 
                            s.id === selectedExamId ? { ...s, referto: refertoForm, stato: 'REFERTATO' } : s
                        )
                    };
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSavingReferto(false);
        }
    };

    const examsByStructure = useMemo(() => {
        const groups: Record<string, PatientDetail['studi']> = {};
        if (!patient) return groups;
        patient.studi.forEach(exam => {
            const sede = exam.sedeEsame || 'Struttura Non Specificata';
            if (!groups[sede]) groups[sede] = [];
            groups[sede].push(exam);
        });
        return groups;
    }, [patient]);

    const selectedExam = useMemo(() => {
        return patient?.studi.find(e => e.id === selectedExamId);
    }, [patient, selectedExamId]);


    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;
    }

    if (!patient) {
        return <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>Paziente non trovato</div>;
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in p-4">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Link href="/dashboard/pazienti" className="hover:text-white transition-colors">Lista Pazienti</Link>
                <span>/</span>
                <span className="text-white font-medium">{patient.cognome} {patient.nome}</span>
            </div>

            {/* Top Row: User + Fascicolo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Profile Card */}
                <div className="md:col-span-3 glass-card p-6 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        {patient.nome[0]}{patient.cognome[0]}
                    </div>
                    <h1 className="text-xl font-bold text-white mb-1">{patient.nome} {patient.cognome}</h1>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 mb-6 tracking-widest">{patient.codiceFiscale}</span>

                    <div className="w-full space-y-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 uppercase font-bold tracking-tighter">Nato il</span>
                            <span className="text-white font-medium">{patient.dataNascita ? new Date(patient.dataNascita).toLocaleDateString() : 'N/D'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 uppercase font-bold tracking-tighter">Sesso</span>
                            <span className="text-white font-medium">{patient.sesso === 'M' ? 'M' : 'F'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 uppercase font-bold tracking-tighter">Recapito</span>
                            <span className="text-white font-medium">{patient.telefono || 'N/D'}</span>
                        </div>
                    </div>

                    <div className="mt-8 w-full p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col items-center justify-center gap-2 group cursor-default hover:bg-blue-500/10 transition-all">
                        <span className="text-[10px] font-bold uppercase text-blue-400 tracking-widest">Esami nel Fascicolo</span>
                        <span className="text-2xl font-black text-blue-400 group-hover:scale-110 transition-transform">{patient.studi.length}</span>
                    </div>
                </div>

                {/* Fascicolo Radiologico (Exam Selection) */}
                <div className="md:col-span-9 glass-card p-6 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-blue-400">🗂️</span>
                        <h2 className="text-lg font-bold">Fascicolo Radiologico del Paziente</h2>
                        <span className="text-xs text-gray-400 ml-auto font-medium">Seleziona un esame per refertarlo</span>
                    </div>

                    <div className="space-y-8 overflow-y-auto pr-2 max-h-[400px] scrollbar-thin">
                        {Object.entries(examsByStructure).map(([structure, exams]) => (
                            <div key={structure} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-500/70">{structure}</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {exams.map((exam) => (
                                        <div 
                                            key={exam.id}
                                            onClick={() => selectExam(exam.id)}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between",
                                                selectedExamId === exam.id 
                                                    ? "bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                                                    : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-bold border border-white/5 shadow-inner shrink-0 text-white">
                                                        {exam.modalita}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold truncate max-w-[150px] md:max-w-[200px]" title={exam.descrizione || ''}>
                                                            {exam.descrizione || 'Esame Radiologico'}
                                                        </h4>
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            📅 {formatDateTime(exam.dataStudio)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                     <span className={cn(
                                                         "text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border",
                                                         exam.stato === 'REFERTATO' ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5" :
                                                         exam.stato === 'FIRMATO' ? "text-teal-400 border-teal-400/30 bg-teal-400/5" :
                                                         "text-orange-400 border-orange-400/30 bg-orange-400/5"
                                                     )}>
                                                         {exam.stato}
                                                     </span>
                                                </div>
                                            </div>
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
                            Esci dal Viewer
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                        <ImageViewer series={selectedExam.series} />
                    </div>
                </div>
            )}

            {/* Bottom Row: Diagnostic Suite (DICOM Launcher + Report Editor) */}
            {selectedExamId && selectedExam && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] animate-fade-in">
                    
                    {/* Viewer Launcher Pane */}
                    <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-center items-center relative overflow-hidden group border-blue-500/20">
                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"/>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full"/>
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform duration-500">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight mb-2">Diagnostic Viewer</h3>
                            <p className="text-sm text-gray-400 mb-8 max-w-[250px]">Lancia il visualizzatore DICOM professionale per esaminare lo studio radiologico in alta risoluzione.</p>
                            
                            <button
                                onClick={() => setViewerExamId(selectedExamId)}
                                className="w-full max-w-[280px] flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[12px] font-black uppercase tracking-widest shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.6)] hover:-translate-y-1 active:scale-[0.98] transition-all"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                                Avvia Sessione 
                            </button>
                        </div>
                    </div>

                    {/* Report Editor Pane */}
                    <div className="lg:col-span-7 glass-card p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                     <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                                     Redazione Referto
                                 </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveReferto}
                                    disabled={savingReferto}
                                    className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {savingReferto ? 'Salvataggio...' : '💾 Salva Referto'}
                                </button>
                            </div>
                        </div>

                        {/* Editor Header Info */}
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-4 flex divide-x divide-white/10 text-sm">
                            <div className="px-4 first:pl-0 flex-1">
                                <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Esame</p>
                                <p className="font-semibold text-white truncate">{selectedExam.descrizione || selectedExam.modalita}</p>
                            </div>
                            <div className="px-4 flex-1">
                                <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Data Esecuzione</p>
                                <p className="font-semibold text-white">{formatDate(selectedExam.dataStudio)}</p>
                            </div>
                            <div className="px-4 last:pr-0 flex-1">
                                <p className="text-[9px] uppercase font-bold text-gray-500 mb-1">Stato Referto</p>
                                <p className={cn("font-semibold", selectedExam.stato === 'REFERTATO' ? 'text-emerald-400' : 'text-orange-400')}>
                                    {selectedExam.stato}
                                </p>
                            </div>
                        </div>

                        {/* Textarea Workspace */}
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-blue-500/5 rounded-xl border border-blue-500/20 group-hover:border-blue-500/40 transition-colors pointer-events-none z-0" />
                            <textarea
                                className="relative z-10 w-full h-full min-h-[300px] bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 p-6 resize-none font-serif text-base leading-relaxed scrollbar-thin overflow-y-auto"
                                placeholder="Inizia a digitare il referto clinico qui... L'autosave non è ancora attivo, ricordati di utilizzare il pulsante Salva in alto a destra."
                                value={refertoForm}
                                onChange={(e) => setRefertoForm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
