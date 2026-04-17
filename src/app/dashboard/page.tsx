'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateTime, getStatoLabel, getStatoColor, getModalitaLabel } from '@/lib/utils';
import type { DashboardStats, Ruolo } from '@/types';

import DashboardSegreteria from '@/components/dashboard/DashboardSegreteria';
import DashboardMedico from '@/components/dashboard/DashboardMedico';
import DashboardTSRM from '@/components/dashboard/DashboardTSRM';
import DashboardPaziente from '@/components/dashboard/DashboardPaziente';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [userRole, setUserRole] = useState<Ruolo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard').then((res) => res.json()),
            fetch('/api/auth/me').then((res) => res.json())
        ])
            .then(([dashboardData, authData]) => {
                if (dashboardData.success) setStats(dashboardData.data);
                if (authData.success && authData.data) setUserRole(authData.data.ruolo);
            })
            .finally(() => setLoading(false));
    }, []);

    const router = useRouter();

    useEffect(() => {
        if (userRole === 'PAZIENTE') {
            router.replace('/dashboard/paziente');
        }
    }, [userRole, router]);

    if (loading || userRole === 'PAZIENTE') {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (userRole === 'SEGRETERIA') return <DashboardSegreteria stats={stats} />;
    if (userRole === 'MEDICO') return <DashboardMedico stats={stats} />;
    if (userRole === 'TECNICO') return <DashboardTSRM stats={stats} />;

    // Original dashboard as fallback for ADMIN
    const statCards = [
        {
            label: 'Pazienti Totali',
            value: stats?.totalePazienti ?? 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            color: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Studi Totali',
            value: stats?.totaleStudi ?? 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <path d="M7 2v20" />
                    <path d="M17 2v20" />
                    <path d="M2 12h20" />
                </svg>
            ),
            color: 'from-purple-500 to-purple-600',
        },
        {
            label: 'Studi Oggi',
            value: stats?.studiOggi ?? 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            color: 'from-teal-500 to-teal-600',
        },
        {
            label: 'Da Refertare',
            value: stats?.studiDaRefertare ?? 0,
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            ),
            color: 'from-amber-500 to-orange-500',
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Dashboard Direzionale</h1>
                <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Panoramica del sistema radiologico e dei flussi
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => (
                    <div key={card.label}
                        className={`glass-card stat-card p-6 animate-fade-in stagger-${i + 1}`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    {card.label}
                                </p>
                                <p className="text-3xl font-bold mt-2">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center opacity-80`}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/pazienti?new=true" className="glass-card p-5 flex items-center gap-4 group cursor-pointer border-t-2 border-emerald-500/50">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Nuovo Paziente</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Registra un nuovo paziente</p>
                    </div>
                </Link>

                <Link href="/dashboard/studi?new=true" className="glass-card p-5 flex items-center gap-4 group cursor-pointer border-t-2 border-indigo-500/50">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Nuovo Studio</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Crea uno studio radiologico</p>
                    </div>
                </Link>

                <Link href="/dashboard/upload" className="glass-card p-5 flex items-center gap-4 group cursor-pointer border-t-2 border-pink-500/50">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Carica DICOM</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Upload immagini diagnostiche</p>
                    </div>
                </Link>
            </div>

            {/* Recent Studies */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Studi Recenti nel Sistema</h2>
                    <Link href="/dashboard/studi" className="text-sm font-medium hover:underline" style={{ color: 'var(--color-primary-light)' }}>
                        Vedi tutti →
                    </Link>
                </div>

                {stats?.ultimiStudi && stats.ultimiStudi.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    <th className="pb-3 pr-4">Paziente</th>
                                    <th className="pb-3 pr-4">Modalità</th>
                                    <th className="pb-3 pr-4">Data</th>
                                    <th className="pb-3 pr-4">Sede</th>
                                    <th className="pb-3 pr-4">Stato</th>
                                    <th className="pb-3">Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.ultimiStudi.map((studio: any) => (
                                    <tr key={studio.id} className="table-row">
                                        <td className="py-3 pr-4">
                                            <Link href={`/dashboard/pazienti/${studio.patient.id}`} className="hover:underline font-medium">
                                                {studio.patient.cognome} {studio.patient.nome}
                                            </Link>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                                {studio.patient.codiceFiscale}
                                            </p>
                                        </td>
                                        <td className="py-3 pr-4 text-sm">
                                            {getModalitaLabel(studio.modalita)}
                                        </td>
                                        <td className="py-3 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {formatDateTime(studio.dataStudio)}
                                        </td>
                                        <td className="py-3 pr-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {studio.sedeEsame || '—'}
                                        </td>
                                        <td className="py-3 pr-4">
                                            <span className={`badge ${getStatoColor(studio.stato)}`}>
                                                {getStatoLabel(studio.stato)}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <Link
                                                href={`/dashboard/studi/${studio.id}`}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                                                style={{ color: 'var(--color-primary-light)' }}
                                            >
                                                Dettagli →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                        <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="2" />
                            <path d="M7 2v20" />
                            <path d="M17 2v20" />
                            <path d="M2 12h20" />
                        </svg>
                        <p className="font-medium">Nessuno studio registrato</p>
                        <p className="text-sm mt-1">Inizia creando un nuovo paziente e il suo primo studio</p>
                    </div>
                )}
            </div>
        </div>
    );
}
