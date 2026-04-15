'use client';

import { useState, useEffect } from 'react';
import NeuralBackground from '@/components/NeuralBackground';

// Mock Data for Doctor Worklist
const examsList = [
    { id: 'S-7901', patient: 'Marco Bianchi', dob: '12/04/1982', date: '13/04/2026', time: '09:00', modality: 'RMN', bodyPart: 'Spalla Sinistra', status: 'DA_REFERTARE', facility: 'Osp. San Raffaele' },
    { id: 'S-7902', patient: 'Giulia Ferrari', dob: '23/08/1975', date: '13/04/2026', time: '09:45', modality: 'TC', bodyPart: 'Addome con MDC', status: 'DA_REFERTARE', facility: 'Polo Radiologico And.' },
    { id: 'S-7903', patient: 'Lorenzo Conti', dob: '15/05/1960', date: '13/04/2026', time: '10:15', modality: 'RX', bodyPart: 'Colonna Lombare', status: 'DA_REFERTARE', facility: 'Ospedale Centrale Sa.' },
    { id: 'S-7904', patient: 'Sofia Marino', dob: '05/11/1954', date: '13/04/2026', time: '11:00', modality: 'PET', bodyPart: 'Torace Completo', status: 'REFERTATO', facility: 'Clinica Villa Verde' },
    { id: 'S-7905', patient: 'Andrea Russo', dob: '19/02/1990', date: '13/04/2026', time: '11:30', modality: 'ECO', bodyPart: 'Addome Superiore', status: 'REFERTATO', facility: 'Osp. Gemelli' },
];

const modalityColor: Record<string, string> = {
  RMN: 'text-[#00D4BE] bg-[#00D4BE]/10 border-[#00D4BE]/30',
  TC:  'text-blue-400 bg-blue-400/10 border-blue-400/30',
  RX:  'text-slate-300 bg-slate-300/10 border-slate-300/30',
  PET: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  ECO: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

export default function DashboardMedico({ stats }: { stats: any }) {
    const [selectedTab, setSelectedTab] = useState<'DA_REFERTARE' | 'REFERTATO'>('DA_REFERTARE');
    const [selectedExamId, setSelectedExamId] = useState<string | null>('S-7901');
    const [searchQuery, setSearchQuery] = useState("");
    const [facilityFilter, setFacilityFilter] = useState("All Facilities");

    // Reporting States
    const [reportText, setReportText] = useState("");
    const [isDictating, setIsDictating] = useState(false);

    // Reset report text when exam changes for mock realism
    useEffect(() => {
        if (selectedTab === 'REFERTATO') {
            setReportText(`In studio l'esame RMN Spalla Sinistra.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`);
        } else {
            setReportText("");
        }
    }, [selectedExamId, selectedTab]);

    // Filtering logic
    const filteredExams = examsList.filter(e => {
        if (e.status !== selectedTab) return false;
        if (facilityFilter !== 'All Facilities' && e.facility !== facilityFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return e.patient.toLowerCase().includes(query) ||
                   e.id.toLowerCase().includes(query) ||
                   e.modality.toLowerCase().includes(query);
        }
        return true;
    });

    const selectedExamObj = examsList.find(e => e.id === selectedExamId);

    const toggleDictation = () => {
        setIsDictating(!isDictating);
        if (!isDictating && reportText === "") {
            // Fake dictation inserting words
            setReportText("Esame RM della spalla sinistra. Non si evidenziano lesioni della cuffia dei rotatori...");
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
                
                @keyframes float-panel-left {
                    0%, 100% { transform: perspective(2000px) rotateY(3deg) rotateX(1deg) translateY(0px); }
                    50% { transform: perspective(2000px) rotateY(3deg) rotateX(1deg) translateY(-8px); }
                }
                @keyframes float-panel-center {
                    0%, 100% { transform: perspective(2000px) rotateY(-1deg) rotateX(2deg) translateY(0px) translateZ(30px); }
                    50% { transform: perspective(2000px) rotateY(-1deg) rotateX(2deg) translateY(-12px) translateZ(30px); }
                }
                @keyframes float-panel-right {
                    0%, 100% { transform: perspective(2000px) rotateY(-4deg) rotateX(1deg) translateY(0px) translateZ(15px); }
                    50% { transform: perspective(2000px) rotateY(-4deg) rotateX(1deg) translateY(-8px) translateZ(15px); }
                }
                .panel-left-anim { animation: float-panel-left 8s ease-in-out infinite; }
                .panel-center-anim { animation: float-panel-center 9s ease-in-out infinite 0.5s; }
                .panel-right-anim { animation: float-panel-right 7s ease-in-out infinite 1s; }
            `}} />

            {/* LEFT PANEL: Worklist */}
            <div className="w-[300px] min-w-[300px] flex flex-col overflow-hidden relative z-10 panel-left-anim">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#00D4BE]/10">
                    <span className="text-white font-bold text-sm tracking-wide">Worklist Esami</span>
                    <span className="text-[10px] font-mono bg-[#00D4BE]/10 text-[#00D4BE] border border-[#00D4BE]/30 px-2 py-0.5 rounded-full">
                        {examsList.length.toString().padStart(7, '0')}
                    </span>
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
                    {filteredExams.map((exam) => {
                        const isSelected = selectedExamId === exam.id;
                        return (
                            <div
                                key={exam.id}
                                onClick={() => setSelectedExamId(exam.id)}
                                className={`p-3 flex gap-3 ${isSelected
                                    ? 'bg-[#00D4BE]/8 border-[#00D4BE]/60 shadow-[0_0_20px_rgba(0,212,190,0.08)] ring-1 ring-[#00D4BE]/20'
                                    : 'bg-[#0D1220]/60 border-white/5 hover:border-[#00D4BE]/25 hover:bg-[#00D4BE]/5'
                                    }`}
                            >
                                {/* Avatar Mock */}
                                <div className="mt-1 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src={"https://i.pravatar.cc/100?u=" + exam.id} alt="Avatar" className="w-full h-full object-cover opacity-80" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-white text-[13px]">{exam.patient}</span>
                                        <span className="text-[10px] text-slate-500 font-mono tracking-wider">{exam.id}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#00D4BE] mt-0.5">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${modalityColor[exam.modality] ?? ''}`}>{exam.modality}</span>
                                        <span className="text-slate-500 text-[10px]">|</span>
                                        <span className="text-slate-300 truncate">{exam.bodyPart}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                        <span>{exam.date} {exam.time}</span>
                                        <span className="mx-0.5">•</span>
                                        <span className="truncate">{exam.facility}</span>
                                    </div>
                                </div>
                                <div className="flex items-center text-slate-600">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CENTER PANEL: DICOM Viewer */}
            <div className="flex-1">

                {selectedExamObj ? (
                    <div key={`viewer-${selectedExamObj.id}`} className="absolute inset-0 flex flex-col">

                        {/* Top viewer controls logic mock */}
                        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 bg-[#060A12]/80">
                            <div className="p-1.5 rounded text-slate-500 hover:text-[#00D4BE] hover:bg-[#00D4BE]/10 transition-all text-xs">
                                <svg width="12" height="12" className="text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            </div>
                            <div className="p-1.5 rounded text-slate-500 hover:text-[#00D4BE] hover:bg-[#00D4BE]/10 transition-all text-xs">
                                <svg width="12" height="12" className="text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            </div>
                        </div>

                        {/* Viewer Canvas displaying a static MR image for realism */}
                        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">

                            {/* Medical Image Background Placeholder based on mock */}
                            {selectedExamObj.modality === 'RMN' || selectedExamObj.modality === 'TC' || selectedExamObj.modality === 'RX' ? (
                                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/MRI_of_the_human_shoulder.jpg/800px-MRI_of_the_human_shoulder.jpg')] bg-contain bg-center bg-no-repeat opacity-80 mix-blend-screen scale-110 grayscale" style={{ filter: 'contrast(1.2) brightness(0.9)' }}></div>
                            ) : (
                                <svg viewBox="0 0 200 200" className="w-[60%] h-[60%] text-slate-800/80 drop-shadow-[0_0_25px_rgba(255,255,255,0.06)] animate-[scale-in_0.5s_ease-out]">
                                    <circle cx="100" cy="100" r="70" fill="currentColor" opacity="0.3"></circle>
                                    <ellipse cx="100" cy="100" rx="40" ry="50" fill="currentColor" opacity="0.8"></ellipse>
                                </svg>
                            )}

                            {/* Crosshair teal */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00D4BE" strokeWidth="0.5" strokeOpacity="0.4"/>
                                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00D4BE" strokeWidth="0.5" strokeOpacity="0.4"/>
                            </svg>

                            {/* Viewer Overlays Top */}
                            <div className="absolute top-4 left-4 flex flex-col gap-0.5 text-[9px] font-mono text-slate-300">
                                <span>{selectedExamObj.patient.toUpperCase()}</span>
                                <span>PID: {selectedExamObj.id}</span>
                                <span>DOB: {selectedExamObj.dob}</span>
                                <span>{selectedExamObj.facility}</span>
                            </div>
                            <div className="absolute top-4 right-4 flex flex-col gap-0.5 text-[9px] font-mono text-slate-300 text-right">
                                <span className="text-[#00D4BE]">{selectedExamObj.modality}</span>
                                <span>{selectedExamObj.date}</span>
                                <span>Acq/Ser: 1/1</span>
                            </div>

                            {/* Viewer Overlays Bottom */}
                            <div className="absolute bottom-3 left-3 text-[#00D4BE]/70 text-[9px] font-mono leading-relaxed space-y-0.5">
                                <span>IM: 3/52</span>
                                <span>Se: 1</span>
                                <span>WL: 380</span>
                                <span>WW: 1800</span>
                            </div>

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-widest text-amber-400/80 bg-amber-400/5 border border-amber-400/20 px-2 py-0.5 rounded">
                                COMPRESSED WEB VIEW
                            </div>
                            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white">
                                Zoom: 1.2x
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-600 text-[10px] tracking-widest font-mono">
                        [ NO DICOM DATA ]
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: Medical Report */}
            <div className="w-[340px] min-w-[340px] flex flex-col bg-white border-l border-white/5 overflow-hidden">

                {selectedExamObj ? (
                    <div key={`report-${selectedExamObj.id}`} className="absolute inset-0 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-[#00D4BE]">
                            <span className="text-[#0A0E1A] font-bold text-sm tracking-wide">Medical Report</span>
                        </div>
                        {/* Sottotitolo esame */}
                        <div className="px-4 py-2 bg-[#00D4BE]/5 border-b border-[#00D4BE]/15">
                            <span className="text-[#00D4BE] text-[11px] font-bold tracking-widest uppercase">
                                {selectedExamObj.modality} — {selectedExamObj.bodyPart}
                            </span>
                        </div>

                        {/* Report Body */}
                        <div className="flex-1">
                            <textarea
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                placeholder="Start typing..."
                                className="flex-1 w-full resize-none border-none bg-transparent outline-none text-slate-700 text-[13px] leading-relaxed font-serif placeholder-slate-300 p-4"
                                readOnly={selectedTab === 'REFERTATO'}
                            ></textarea>
                        </div>

                        {/* Footer CTA */}
                        <div className="p-4 border-t border-slate-100 bg-white space-y-2">
                            {selectedTab === 'DA_REFERTARE' ? (
                                <>
                                    <button className="w-full py-3 bg-[#00D4BE] text-[#0A0E1A] font-bold text-xs tracking-widest uppercase rounded-xl hover:bg-[#00C4AE] active:scale-[0.98] transition-all duration-200 shadow-[0_0_20px_rgba(0,212,190,0.3)] hover:shadow-[0_0_30px_rgba(0,212,190,0.5)] flex items-center justify-center gap-2">
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
                    <div className="flex-1 bg-white flex items-center justify-center text-slate-300 text-xs text-center px-6 leading-relaxed">
                        Seleziona un esame dalla Worklist<br />per avviare la refertazione.
                    </div>
                )}
            </div>

        </div>
    );
}
