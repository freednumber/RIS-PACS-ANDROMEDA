'use client';

import { useState } from 'react';

// Mock Data for the Weekly Calendar
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const hoursOfDay = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 to 18:00

const mockAppointments = [
    { id: 1, day: 'Mon', startHour: 9, startMin: 0, durationMin: 60, title: 'RM Ginocchio', patient: 'Rossi M.', type: 'RM' },
    { id: 2, day: 'Mon', startHour: 11, startMin: 30, durationMin: 45, title: 'TC Torace', patient: 'Bianchi L.', type: 'TC' },
    { id: 3, day: 'Tue', startHour: 8, startMin: 30, durationMin: 30, title: 'RX Torace', patient: 'Verdi L.', type: 'RX' },
    { id: 4, day: 'Wed', startHour: 14, startMin: 0, durationMin: 90, title: 'RM Encefalo', patient: 'Neri A.', type: 'RM' },
    { id: 5, day: 'Fri', startHour: 10, startMin: 0, durationMin: 60, title: 'Eco Addome', patient: 'Gialli B.', type: 'ECO' },
    { id: 6, day: 'Thu', startHour: 15, startMin: 30, durationMin: 45, title: 'TC Addome', patient: 'Moro C.', type: 'TC' },
];

export default function DashboardSegreteria({ stats }: { stats: any }) {
    const [isBookingPanelOpen, setIsBookingPanelOpen] = useState(false);

    // Helpers for calculating CSS absolute positions
    const getTopOffset = (hour: number, minute: number) => {
        return ((hour - 8) * 80) + ((minute / 60) * 80); // 80px per hour
    };

    const getHeight = (durationMin: number) => {
        return (durationMin / 60) * 80;
    };

    return (
        <div className="h-[calc(100vh-90px)] w-full flex flex-col bg-slate-50 font-sans text-slate-800 animate-[fade-in_0.4s_ease-out] relative">

            {/* Header / Week Navigation */}
            <div className="h-[80px] shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Booking Calendar</h1>
                    <p className="text-slate-500 text-sm font-semibold mt-1">Week of April 12, 2026</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-sm font-bold text-teal-600">Week</button>
                        <button className="px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700">Day</button>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <button className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid Area */}
            <div className="flex-1 overflow-auto flex bg-slate-50 p-6 relative">

                {/* Time Axis (Left) */}
                <div className="w-[60px] shrink-0 relative mt-12 pr-4 z-10 border-r border-slate-200 bg-slate-50">
                    {hoursOfDay.map((hour) => (
                        <div key={hour} className="h-[80px] relative">
                            <span className="absolute -top-3 right-4 text-xs font-bold text-slate-400">
                                {hour.toString().padStart(2, '0')}:00
                            </span>
                        </div>
                    ))}
                </div>

                {/* Days Columns */}
                <div className="flex-1 min-w-[800px] flex gap-4 pl-4 pb-12">
                    {daysOfWeek.map((day, dayIndex) => {
                        const dayEvents = mockAppointments.filter(app => app.day === day);

                        return (
                            <div key={day} className="flex-1 flex flex-col">
                                {/* Day Header */}
                                <div className="h-[48px] shrink-0 mb-4 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm z-20 sticky top-0">
                                    <span className="text-xs uppercase tracking-widest font-bold text-slate-400">{day}</span>
                                    <span className="text-lg font-black text-slate-700">{13 + dayIndex}</span>
                                </div>

                                {/* Day Grid Timeline Container */}
                                <div className="flex-1 relative border-x border-slate-200/50 bg-white/50 rounded-xl overflow-hidden min-h-[880px]">

                                    {/* Horizontal Hour Lines */}
                                    {hoursOfDay.map((hour) => (
                                        <div key={hour} className="absolute w-full h-px bg-slate-200/60" style={{ top: `${getTopOffset(hour, 0)}px` }} />
                                    ))}
                                    {hoursOfDay.map((hour) => (
                                        <div key={`half-${hour}`} className="absolute w-full h-px bg-slate-100 border-t border-dashed border-slate-200/60" style={{ top: `${getTopOffset(hour, 30)}px` }} />
                                    ))}

                                    {/* Events */}
                                    {dayEvents.map((evt) => {
                                        // Colors mapping based on modality
                                        const colorTheme =
                                            evt.type === 'RM' ? 'bg-teal-100 border-teal-300 text-teal-800 shadow-teal-500/10 hover:bg-teal-200' :
                                                evt.type === 'TC' ? 'bg-indigo-100 border-indigo-300 text-indigo-800 shadow-indigo-500/10 hover:bg-indigo-200' :
                                                    evt.type === 'RX' ? 'bg-rose-100 border-rose-300 text-rose-800 shadow-rose-500/10 hover:bg-rose-200' :
                                                        'bg-amber-100 border-amber-300 text-amber-800 shadow-amber-500/10 hover:bg-amber-200';

                                        return (
                                            <div
                                                key={evt.id}
                                                className={`absolute left-1 right-1 rounded-xl p-2.5 border-l-[4px] shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-md ${colorTheme}`}
                                                style={{
                                                    top: `${getTopOffset(evt.startHour, evt.startMin)}px`,
                                                    height: `${getHeight(evt.durationMin)}px`
                                                }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="font-extrabold text-[13px] leading-none mb-1">{evt.patient}</div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                                        {evt.startHour.toString().padStart(2, '0')}:{evt.startMin.toString().padStart(2, '0')}
                                                    </div>
                                                </div>
                                                <div className="text-[11px] font-medium opacity-80 truncate">{evt.title}</div>
                                                {/* Drag handle graphic */}
                                                <div className="absolute top-1/2 -translate-y-1/2 left-[2px] w-1 h-3 border-l border-r border-black/10 flex gap-[1px]"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FAB: Floating Action Button */}
            <button
                onClick={() => setIsBookingPanelOpen(true)}
                className="absolute bottom-8 right-8 bg-teal-600 hover:bg-teal-500 text-white rounded-full h-16 px-6 flex items-center justify-center shadow-[0_8px_30px_rgba(13,148,136,0.4)] hover:shadow-[0_12px_40px_rgba(13,148,136,0.6)] hover:-translate-y-1 transition-all duration-300 gap-3 z-30 group"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span className="font-extrabold tracking-widest uppercase text-sm">New Booking</span>
            </button>

            {/* SLIDE-OVER PANEL (Booking Form) */}
            {/* Overlay backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${isBookingPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsBookingPanelOpen(false)}
            />

            {/* Panel */}
            <div className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isBookingPanelOpen ? 'translate-x-0' : 'translate-x-[480px]'}`}>

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-black text-teal-600 flex items-center gap-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Schedule Exam
                    </h2>
                    <button
                        onClick={() => setIsBookingPanelOpen(false)}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">

                    {/* Method 1: Scan TS */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Fast Data Entry</label>
                        <button className="w-full h-32 border-2 border-dashed border-teal-300 bg-teal-50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-teal-100/50 hover:border-teal-400 transition-colors group">
                            <div className="p-3 bg-white rounded-full shadow-sm text-teal-500 group-hover:scale-110 transition-transform">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" className="stroke-teal-500" /></svg>
                            </div>
                            <span className="font-bold text-teal-700 text-sm">Scan Tessera Sanitaria</span>
                        </button>
                    </div>

                    <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest gap-4">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        OR MANUAL ENTRY
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Method 2: Manual Form */}
                    <form className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Codice Fiscale</label>
                            <div className="relative">
                                <svg className="absolute left-4 top-3.5 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                <input type="text" placeholder="RSSMRA80A01H501Z" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Date</label>
                                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Time</label>
                                <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Modality</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option>RM - Risonanza Magnetica</option>
                                <option>TC - Tomografia Computerizzata</option>
                                <option>RX - Radiografia Standard</option>
                                <option>ECO - Ecografia</option>
                            </select>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                    <button className="w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-xl text-white font-extrabold text-sm tracking-widest uppercase transition-all shadow-[0_4px_15px_rgba(13,148,136,0.3)]">
                        Confirm Appointment
                    </button>
                </div>

            </div>

        </div>
    );
}
