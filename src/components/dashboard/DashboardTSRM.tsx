'use client';

import { useState } from 'react';

// Mock Data for Live TSRM Queue
const liveQueue = [
    { id: 'L-01', patient: 'Mario Rossi', modality: 'TC Cranio Urgente', exam: 'TC', urgency: 'Urgent', room: 'Sala TC 1', time: 'ORA', status: 'WAITING' },
    { id: 'L-02', patient: 'Anna Bianchi', modality: 'RX Torace', exam: 'RX', urgency: 'Medium', room: 'Sala RX 2', time: '+10 min', status: 'WAITING' },
    { id: 'L-03', patient: 'Giuseppe Verdi', modality: 'RX Bacino', exam: 'RX', urgency: 'Medium', room: 'Sala RX 2', time: '+15 min', status: 'WAITING' },
    { id: 'L-04', patient: 'Lucia Neri', modality: 'RMN Ginocchio', exam: 'RMN', urgency: 'Low', room: 'Sala RMN 1', time: '+35 min', status: 'WAITING' },
];

export default function DashboardTSRM({ stats }: { stats: any }) {
    const [selectedExamId, setSelectedExamId] = useState<string>('L-01');
    const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3>(1); // 1: Acquired, 2: Tech Signed, 3: Doc Signed

    const activeExam = liveQueue.find(e => e.id === selectedExamId) || liveQueue[0];

    const handleSign = () => {
        if (workflowStep === 1) {
            setWorkflowStep(2);
            // In a real app we would fire an API call here.
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col bg-slate-950 font-sans text-slate-200 animate-[fade-in_0.4s_ease-out]">

            {/* CSS for hiding scrollbars on queue */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scroll::-webkit-scrollbar { height: 4px; }
                .hide-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            `}} />

            {/* TOP SECTION: Live Queue */}
            <div className="h-[120px] shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-4 overflow-x-auto hide-scroll gap-4 relative z-10 shadow-lg">
                <div className="flex flex-col justify-center h-full pr-4 border-r border-slate-700/50 mr-2 shrink-0">
                    <h2 className="text-xl font-black text-teal-500 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
                        LIVE QUEUE
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">SALA DIAGNOSTICA ONLINE</p>
                </div>

                {liveQueue.map((item) => {
                    const isSelected = selectedExamId === item.id;
                    const isUrgent = item.urgency === 'Urgent';

                    return (
                        <div
                            key={item.id}
                            onClick={() => { setSelectedExamId(item.id); setWorkflowStep(1); }}
                            className={`shrink-0 w-[240px] h-[80%] rounded-xl p-3 border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col justify-between
                                ${isSelected
                                    ? 'bg-slate-800/80 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                                    : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}
                            `}
                        >
                            {/* Urgency Line Indicator */}
                            <div className={`absolute top-0 left-0 w-full h-[4px] ${item.urgency === 'Urgent' ? 'bg-rose-500' :
                                    item.urgency === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />

                            {/* Urgent Pulse Background */}
                            {isUrgent && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl animate-pulse mix-blend-screen pointer-events-none" />
                            )}

                            <div className="flex justify-between items-start">
                                <div className="font-bold text-sm tracking-wide text-white truncate max-w-[140px] drop-shadow-sm">{item.patient}</div>
                                <div className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm ${item.urgency === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                        item.urgency === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                    {item.time}
                                </div>
                            </div>

                            <div className="mt-1 flex flex-col gap-0.5">
                                <div className="text-[11px] font-bold text-teal-400 truncate">{item.modality}</div>
                                <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                                    <span>{item.room}</span>
                                    <span className="font-mono">{item.id}</span>
                                </div>
                            </div>

                            {/* Urgent Active Pulse Ring */}
                            {isUrgent && !isSelected && (
                                <div className="absolute inset-0 border-2 border-rose-500/50 rounded-xl animate-pulse pointer-events-none" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CENTER SECTION: Acquisition Workspace */}
            <div className="flex-1 bg-[#020617] relative flex items-center justify-center overflow-hidden">
                {/* Simulated Grid Background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMGwxOSAxOU0xOSAxTDEgMTkiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none" />

                {/* Main Machine/Viewer Hologram */}
                <div className="absolute w-[800px] h-[800px] bg-teal-900/10 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite] pointer-events-none" />

                <div className="z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        {/* Dynamic SVG graphic based on exam type */}
                        <svg className="w-56 h-56 text-slate-800 drop-shadow-[0_0_30px_rgba(20,184,166,0.15)] animate-[scale-in_0.4s_ease-out]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            {activeExam.exam === 'TC' || activeExam.exam === 'RMN' ? (
                                <>
                                    <ellipse cx="12" cy="12" rx="10" ry="10" className="stroke-teal-900/50" />
                                    <circle cx="12" cy="12" r="6" className="stroke-teal-700/50" />
                                    <path d="M12 2v20M2 12h20" className="stroke-teal-600/30" strokeDasharray="2 2" />
                                    {/* Scanning line */}
                                    <line x1="2" y1="12" x2="22" y2="12" className="stroke-teal-400 animate-[pulse_2s_infinite]" />
                                </>
                            ) : (
                                <>
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" className="stroke-teal-900/50" />
                                    <line x1="3" y1="9" x2="21" y2="9" className="stroke-teal-700/50" />
                                    <line x1="9" y1="21" x2="9" y2="9" className="stroke-teal-700/50" />
                                    <circle cx="15" cy="15" r="3" className="stroke-teal-500/50" />
                                    <path d="M15 15l2 2" className="stroke-teal-400" />
                                </>
                            )}
                        </svg>

                        {/* Target Crosshairs overlay */}
                        <div className="absolute inset-0 flex items-center justify-center animate-[spin_60s_linear_infinite] pointer-events-none opacity-50">
                            <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
                                <circle cx="120" cy="120" r="110" stroke="rgba(20,184,166,0.2)" strokeWidth="1" strokeDasharray="4 8" />
                            </svg>
                        </div>
                    </div>

                    <div className="text-center font-mono p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
                        <div className="text-teal-400 text-lg font-black tracking-[0.2em] uppercase blur-[0.3px]">{activeExam.patient}</div>
                        <div className="text-slate-400 text-xs font-bold tracking-widest mt-1">Acquisition Window: {activeExam.modality}</div>
                        {activeExam.urgency === 'Urgent' && (
                            <div className="text-rose-500 font-bold text-[10px] tracking-widest uppercase mt-2 animate-pulse flex items-center justify-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                Priority Override Active
                            </div>
                        )}
                    </div>
                </div>

                {/* Info HUD */}
                <div className="absolute top-4 left-4 text-[#008080] font-mono text-[10px] font-bold pointer-events-none shadow-sm flex flex-col gap-1">
                    <span>MODE: ACQUISITION</span>
                    <span>ROOM: {activeExam.room}</span>
                    <span>NET : ENCRYPTED</span>
                </div>
            </div>

            {/* BOTTOM SECTION: Workflow & Signature */}
            <div className="h-[140px] shrink-0 bg-[#0f172a] border-t-2 border-slate-800 flex items-center justify-between px-8 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">

                {/* 3-Step Pipeline UI */}
                <div className="flex-1 max-w-[600px]">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Exam Workflow Phase</h3>

                    <div className="relative flex items-center justify-between w-full">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full" />

                        {/* Progress Bar Active */}
                        <div className="absolute top-1/2 left-0 h-1 bg-teal-500 -translate-y-1/2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: workflowStep === 1 ? '0%' : workflowStep === 2 ? '50%' : '100%' }}
                        />

                        {/* Step 1: Acquired */}
                        <div className="relative flex flex-col items-center gap-2 group z-10 w-[80px]">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0f172a] transition-colors
                                ${workflowStep >= 1 ? 'border-teal-500 text-teal-400' : 'border-slate-700 text-slate-600'}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors
                                ${workflowStep >= 1 ? 'text-teal-400' : 'text-slate-500'}`}>Acquired</span>
                        </div>

                        {/* Step 2: Tech Signed */}
                        <div className="relative flex flex-col items-center gap-2 group z-10 w-[80px]">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0f172a] transition-all duration-500
                                ${workflowStep >= 2 ? 'border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'border-slate-700 text-slate-600 bg-slate-900'}`}>
                                {workflowStep >= 2
                                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    : <span className="text-xs font-black">2</span>
                                }
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors duration-500
                                ${workflowStep >= 2 ? 'text-teal-400' : 'text-slate-500'}`}>Tech Signed</span>
                        </div>

                        {/* Step 3: Doctor Signed */}
                        <div className="relative flex flex-col items-center gap-2 group z-10 w-[80px]">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#0f172a] transition-all duration-500
                                ${workflowStep >= 3 ? 'border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'border-slate-700 text-slate-600 bg-slate-900'}`}>
                                {workflowStep >= 3
                                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    : <span className="text-xs font-black">3</span>
                                }
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors duration-500
                                ${workflowStep >= 3 ? 'text-teal-400' : 'text-slate-500'}`}>Doc Signed</span>
                        </div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="flex items-center gap-6">
                    {/* Tooltip / Info */}
                    <div className="group relative flex items-center justify-center rounded-full bg-slate-800 w-8 h-8 cursor-help border border-slate-700 hover:bg-slate-700 transition-colors">
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>

                        {/* Tooltip box */}
                        <div className="absolute bottom-full right-0 mb-3 w-[280px] bg-slate-800 border border-slate-600 text-slate-300 text-[11px] leading-relaxed p-3 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50">
                            <span className="block text-amber-400 font-bold mb-1 uppercase tracking-wider">Visibility Policy</span>
                            Images will only be visible to doctors <b>AFTER</b> your signature. Reports & images will be released to Secretaries/Patients only AFTER the Doctor signs.
                            {/* Triangle caret */}
                            <div className="absolute top-full right-2 w-3 h-3 bg-slate-800 border-b border-r border-slate-600 rotate-45 -translate-y-1.5" />
                        </div>
                    </div>

                    {/* Signature Button */}
                    <button
                        onClick={handleSign}
                        disabled={workflowStep > 1}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-extrabold text-[14px] tracking-[0.15em] uppercase transition-all duration-500 border-2
                            ${workflowStep === 1
                                ? 'bg-teal-600 text-white border-teal-500 hover:bg-teal-500 hover:scale-105 shadow-[0_0_20px_rgba(20,184,166,0.4)]'
                                : 'bg-slate-800 text-teal-500 border-slate-700 cursor-not-allowed opacity-80'}`}
                    >
                        {workflowStep === 1 ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                DIGITALLY SIGN EXAM
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                EXAM SIGNED
                            </>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
