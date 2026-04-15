'use client';

import { useState } from 'react';

// Mock Patient Data
const patientInfo = {
    name: "Alessandro Rossi",
    dob: "12/04/1982",
    fiscalCode: "RSSLND82D12H501Y",
    gender: "M",
    bloodType: "A+",
    phone: "+39 345 1234567"
};

// Mock grouped exams by facility
const examsList = [
    {
        facility: "Ospedale Centrale San Marco",
        exams: [
            { id: "ex-1", date: "2026-03-15", time: "09:30", modality: "RMN", bodyPart: "Ginocchio Destro", status: "Refertato" },
            { id: "ex-2", date: "2025-11-20", time: "14:15", modality: "RX", bodyPart: "Torace", status: "Refertato" }
        ]
    },
    {
        facility: "Polo Radiologico Andromeda",
        exams: [
            { id: "ex-3", date: "2026-04-10", time: "11:00", modality: "TC", bodyPart: "Cervicale", status: "Refertato" },
            { id: "ex-4", date: "2024-05-02", time: "16:45", modality: "ECO", bodyPart: "Addome Completo", status: "Refertato" }
        ]
    }
];

export default function DashboardPaziente({ stats }: { stats: any }) {
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    let selectedExamObj = null;
    let selectedFacility = "";
    for (const group of examsList) {
        const exam = group.exams.find(e => e.id === selectedExamId);
        if (exam) {
            selectedExamObj = exam;
            selectedFacility = group.facility;
            break;
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 rounded-[2rem] min-h-[85vh] text-slate-800 animate-[fade-up_0.6s_ease-out_both]">

            {/* Left Sidebar: Patient Info */}
            <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 bg-white shadow-sm border border-slate-200 rounded-[2rem] p-6 flex flex-col h-full sticky top-6">
                <div className="flex flex-col items-center mb-8 mt-2">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-[0_8px_20px_rgba(0,128,128,0.3)] flex items-center justify-center mb-5">
                        <span className="text-3xl font-extrabold text-white tracking-widest">AR</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{patientInfo.name}</h2>
                    <p className="text-xs font-mono font-bold text-slate-500 mt-1.5 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">{patientInfo.fiscalCode}</p>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 shadow-inner">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Dati Anagrafici</p>
                        <div className="flex justify-between items-center text-sm mb-2.5">
                            <span className="text-slate-500 font-medium">Nato il</span>
                            <span className="font-bold">{patientInfo.dob}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mb-2.5">
                            <span className="text-slate-500 font-medium">Sesso</span>
                            <span className="font-bold text-slate-600">{patientInfo.gender}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Recapito</span>
                            <span className="font-bold text-slate-600">{patientInfo.phone}</span>
                        </div>
                    </div>

                    <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100/50 text-teal-900 group transition-all hover:bg-teal-50 hover:shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                            <svg className="w-5 h-5 text-teal-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Gruppo Sanguigno</p>
                        </div>
                        <p className="text-3xl font-extrabold text-[#008080] drop-shadow-sm">{patientInfo.bloodType}</p>
                    </div>
                </div>
            </div>

            {/* Right Main Area */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Section: Exam List grouping */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-[2rem] p-6 lg:p-8 mb-6">
                    <h3 className="text-2xl font-extrabold text-slate-800 mb-8 tracking-tight flex items-center gap-3">
                        <svg className="w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        Fascicolo Radiologico
                    </h3>

                    <div className="space-y-8">
                        {examsList.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-4">
                                {/* Facility Badge / Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-teal-500 shrink-0 shadow-[0_0_8px_rgba(0,128,128,0.5)]"></div>
                                    <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">{group.facility}</h4>
                                    <div className="h-px bg-slate-100 flex-1 ml-2"></div>
                                </div>

                                {/* Group Exams */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {group.exams.map((exam) => {
                                        const isSelected = selectedExamId === exam.id;
                                        return (
                                            <div
                                                key={exam.id}
                                                onClick={() => setSelectedExamId(isSelected ? null : exam.id)}
                                                className={`p-5 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${isSelected
                                                        ? 'bg-teal-50/50 border-teal-500 shadow-[0_8px_20px_rgba(0,128,128,0.12)] -translate-y-1'
                                                        : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-md hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2.5 py-1 rounded bg-slate-800 text-white text-[10px] font-black tracking-widest uppercase transition-colors ${isSelected ? 'bg-teal-600' : 'group-hover:bg-slate-700'}`}>
                                                        {exam.modality}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                                                        {exam.date} · {exam.time}
                                                    </span>
                                                </div>
                                                <h5 className="font-extrabold text-slate-800 text-lg leading-tight mb-3">
                                                    {exam.bodyPart}
                                                </h5>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${exam.status === 'Refertato' ? 'text-teal-600 bg-teal-50 border-teal-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                                                        }`}>
                                                        {exam.status}
                                                    </span>
                                                    <div className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${isSelected ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600'}`}>
                                                        <svg className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section: Split Viewer */}
                <div
                    className={`transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform origin-top ${selectedExamId
                            ? 'opacity-100 translate-y-0 scale-y-100 h-auto'
                            : 'opacity-0 translate-y-8 scale-y-95 h-0 overflow-hidden pointer-events-none'
                        }`}
                >
                    {selectedExamObj && (
                        <div className="flex flex-col xl:flex-row gap-6 h-[600px] mb-8">

                            {/* Left: Compressed DICOM Viewer */}
                            <div className="flex-1 bg-black rounded-[2rem] shadow-xl overflow-hidden flex flex-col border border-slate-800">
                                {/* Viewer Toolbar */}
                                <div className="p-3 border-b border-slate-800 bg-[#0a111a] flex justify-between items-center text-slate-400 shrink-0">
                                    <span className="text-teal-400 font-extrabold text-[10px] uppercase tracking-widest pl-2">
                                        DICOM Preview (Compressed)
                                    </span>
                                    <div className="flex gap-1.5">
                                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Zoom In"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg></button>
                                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Zoom Out"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg></button>
                                        <div className="w-px h-4 bg-slate-700 my-auto mx-1"></div>
                                        <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white" title="Pan"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="19 9 22 12 19 15" /><polyline points="9 19 12 22 15 19" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg></button>
                                    </div>
                                </div>

                                {/* Viewer Canvas Area */}
                                <div className="flex-1 relative bg-[#010408] overflow-hidden flex items-center justify-center group cursor-move">
                                    {/* Mock Generic Chest SVG Placeholder */}
                                    <svg viewBox="0 0 200 200" className="w-[70%] h-[70%] text-slate-800 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-transform duration-700 group-hover:scale-[1.03]">
                                        <path fill="currentColor" opacity="0.4" d="M100 20C70 20 50 40 45 70C40 100 35 150 20 180H60C70 140 80 120 90 100V130H110V100C120 120 130 140 140 180H180C165 150 160 100 155 70C150 40 130 20 100 20Z"></path>
                                        <path fill="currentColor" opacity="0.2" d="M100 50C85 50 75 70 70 100C65 130 65 160 65 160H85V110H115V160H135C135 160 135 130 130 100C125 70 115 50 100 50Z"></path>
                                        <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.3" d="M70 70 Q100 80 130 70" />
                                        <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.3" d="M65 85 Q100 95 135 85" />
                                        <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.3" d="M62 100 Q100 110 138 100" />
                                        <path stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.3" d="M60 115 Q100 125 140 115" />
                                    </svg>

                                    {/* DICOM Metadata Overlays */}
                                    <div className="absolute top-4 left-4 flex flex-col gap-1 text-[10px] font-mono text-teal-400 text-shadow-md">
                                        <span className="font-bold">{patientInfo.name}</span>
                                        <span>DOB: {patientInfo.dob}</span>
                                        <span>{selectedExamObj.id.toUpperCase()}</span>
                                    </div>
                                    <div className="absolute top-4 right-4 flex flex-col gap-1 text-[10px] font-mono text-teal-400 text-shadow-md text-right">
                                        <span className="font-bold">{selectedFacility.toUpperCase()}</span>
                                        <span>{selectedExamObj.date}</span>
                                        <span>{selectedExamObj.modality} - {selectedExamObj.bodyPart}</span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 flex flex-col gap-1 text-[10px] font-mono text-teal-400 text-shadow-md">
                                        <span>ZOOM: 100%</span>
                                        <span>W: 2000 L: 500</span>
                                    </div>
                                </div>

                                {/* Full Res Request Button */}
                                <div className="p-5 border-t border-slate-800 bg-[#061014] flex justify-center shrink-0">
                                    <button className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-white font-extrabold text-xs tracking-wider transition-all duration-300 shadow-[0_4px_15px_rgba(0,128,128,0.4)] hover:shadow-[0_8px_25px_rgba(0,128,128,0.6)] hover:-translate-y-0.5 active:translate-y-0 group">
                                        <svg className="w-5 h-5 shrink-0 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        REQUEST ORIGINAL FULL-RESOLUTION DICOM
                                    </button>
                                </div>
                            </div>

                            {/* Right: PDF Viewer Placeholder */}
                            <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                {/* PDF Toolbar */}
                                <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                                    <span className="text-slate-800 font-extrabold text-[10px] uppercase tracking-widest pl-2">
                                        Referto PDF Firmato
                                    </span>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 hover:bg-slate-200 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider text-slate-500 border border-slate-300 flex items-center gap-1.5 shadow-sm bg-white"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg> Stampa</button>
                                        <button className="px-3 py-1.5 hover:bg-teal-50 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider text-teal-600 border border-teal-200 flex items-center gap-1.5 shadow-sm bg-white"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Scarica</button>
                                    </div>
                                </div>

                                {/* PDF Content Mock */}
                                <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-slate-100/50 flex justify-center items-start">
                                    <div className="bg-white p-8 sm:p-10 border border-slate-200 w-full max-w-[600px] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col gap-6">
                                        <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
                                            <div>
                                                <h1 className="text-2xl font-black text-slate-800 uppercase leading-none tracking-tight mb-2">Referto Ufficiale</h1>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedFacility}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-teal-50 border border-teal-200/50 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                                <svg viewBox="0 0 24 24" className="w-7 h-7 text-teal-600" fill="currentColor"><path d="M3 3h8v8H3zM5 5v4h4V5z" /><path d="M13 3h8v8h-8zM15 5v4h4V5z" /><path d="M3 13h8v8H3zM5 15v4h4v-4z" /><path d="M13 13h2v2h-2z" /><path d="M15 15h2v2h-2z" /><path d="M13 17h2v2h-2z" /><path d="M17 13h2v2h-2z" /><path d="M17 17h4v4h-4z" /><path d="M19 13h2v2h-2z" /></svg>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Paziente</p>
                                                <p className="font-extrabold text-slate-800 text-sm mt-0.5">{patientInfo.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Esame</p>
                                                <p className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedExamObj.modality} - {selectedExamObj.bodyPart}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Data Esame</p>
                                                <p className="font-bold text-slate-700">{selectedExamObj.date}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Refertato Il</p>
                                                <p className="font-bold text-slate-700">{selectedExamObj.date}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex-1">
                                            <p className="text-slate-800 text-[11px] font-black uppercase tracking-widest mb-4">Esito e Considerazioni Cliniche</p>
                                            <div className="space-y-4 text-sm text-slate-700 leading-relaxed font-serif">
                                                <div className="w-full h-3 bg-slate-100 rounded animate-pulse"></div>
                                                <div className="w-full h-3 bg-slate-100 rounded animate-pulse"></div>
                                                <div className="w-5/6 h-3 bg-slate-100 rounded animate-pulse"></div>
                                                <div className="w-full h-3 bg-slate-100 rounded animate-pulse mt-8"></div>
                                                <div className="w-2/3 h-3 bg-slate-100 rounded animate-pulse"></div>
                                                <div className="w-full h-3 bg-slate-100 rounded animate-pulse mt-8"></div>
                                                <div className="w-1/2 h-3 bg-slate-100 rounded animate-pulse"></div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-200 text-right">
                                            <div className="inline-block text-center sign-container py-2 px-6">
                                                <p className="font-['Brush_Script_MT',cursive] italic text-3xl text-slate-800 border-b border-dashed border-slate-300 pb-1 mb-2 transform -rotate-2">Dr. Marco Verdi</p>
                                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Firma Digitale Verificata</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
