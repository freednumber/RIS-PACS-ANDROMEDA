'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate, formatDateTime, getStatoLabel, getStatoColor, getModalitaLabel } from '@/lib/utils';

interface PatientDetail {
    id: string;
    codiceFiscale: string;
    nome: string;
    cognome: string;
    dataNascita: string;
    sesso: string;
    luogoNascita: string | null;
    indirizzo: string | null;
    citta: string | null;
    cap: string | null;
    provincia: string | null;
    telefono: string | null;
    email: string | null;
    note: string | null;
    studi: Array<{
        id: string;
        dataStudio: string;
        descrizione: string | null;
        modalita: string;
        bodyPart: string | null;
        sedeEsame: string | null;
        stato: string;
        priorita: string;
        referto: string | null;
        medicoRichiedente: { nome: string; cognome: string } | null;
        medicoRefertante: { nome: string; cognome: string } | null;
        _count: { series: number; firme: number };
        series: Array<{
            instances: Array<{ id: string }>;
        }>;
    }>;
    firme: Array<{ id: string; createdAt: string; studyId: string }>;
    _count: { studi: number; firme: number };
}

export default function PatientDetailPage() {
    const params = useParams();
    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/pazienti/${params.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setPatient(data.data);
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!patient) {
        return <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>Paziente non trovato</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/pazienti" className="hover:underline">Pazienti</Link>
                <span>→</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {patient.cognome} {patient.nome}
                </span>
            </div>

            {/* Patient Header */}
            <div className="glass-card p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                            {patient.nome[0]}{patient.cognome[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{patient.cognome} {patient.nome}</h1>
                            <p className="font-mono text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                CF: {patient.codiceFiscale}
                            </p>
                            <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>📅 {formatDate(patient.dataNascita)}</span>
                                <span>{patient.sesso === 'M' ? '♂ Maschio' : '♀ Femmina'}</span>
                                {patient.citta && <span>📍 {patient.citta} {patient.provincia ? `(${patient.provincia})` : ''}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="badge bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {patient._count.studi} Studi
                        </span>
                        <span className="badge bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            {patient._count.firme} Firme
                        </span>
                    </div>
                </div>

                {/* Contact Info */}
                {(patient.telefono || patient.email) && (
                    <div className="flex gap-6 mt-4 pt-4 border-t text-sm" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        {patient.telefono && <span>📞 {patient.telefono}</span>}
                        {patient.email && <span>✉️ {patient.email}</span>}
                    </div>
                )}
            </div>

            {/* Studies Timeline */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-4">Storico Esami Radiologici</h2>

                {patient.studi.length > 0 ? (
                    <div className="space-y-4">
                        {patient.studi.map((studio, i) => (
                            <div key={studio.id} className={`relative pl-8 pb-4 animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
                                {/* Timeline line */}
                                {i < patient.studi.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-0 w-px" style={{ background: 'var(--color-border)' }} />
                                )}
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                                    style={{
                                        borderColor: studio.stato === 'FIRMATO' ? '#10b981' : studio.stato === 'REFERTATO' ? '#a855f7' : '#3b82f6',
                                        background: 'var(--color-surface)',
                                    }}>
                                    <div className="w-2 h-2 rounded-full"
                                        style={{ background: studio.stato === 'FIRMATO' ? '#10b981' : studio.stato === 'REFERTATO' ? '#a855f7' : '#3b82f6' }} />
                                </div>

                                <div className="glass-card p-4" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">{getModalitaLabel(studio.modalita)}</span>
                                                <span className={`badge ${getStatoColor(studio.stato)}`}>
                                                    {getStatoLabel(studio.stato)}
                                                </span>
                                                {studio.priorita === 'URGENTE' && (
                                                    <span className="badge bg-red-500/20 text-red-400 border-red-500/30">URGENTE</span>
                                                )}
                                            </div>
                                            {studio.descrizione && (
                                                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {studio.descrizione}
                                                </p>
                                            )}
                                            <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                                <span>📅 {formatDateTime(studio.dataStudio)}</span>
                                                {studio.sedeEsame && <span>🏥 {studio.sedeEsame}</span>}
                                                {studio.bodyPart && <span>🦴 {studio.bodyPart}</span>}
                                            </div>
                                            {studio.medicoRichiedente && (
                                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                    Richiedente: Dr. {studio.medicoRichiedente.cognome} {studio.medicoRichiedente.nome}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/dashboard/studi/${studio.id}`}
                                                className="btn-secondary text-xs py-2 px-3"
                                            >
                                                Dettagli
                                            </Link>
                                            {studio._count.firme === 0 && (
                                                <Link
                                                    href={`/dashboard/firma/${studio.id}`}
                                                    className="btn-primary text-xs py-2 px-3"
                                                >
                                                    Firma
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* Thumbnails grid */}
                                    {studio.series?.[0]?.instances?.length > 0 && (
                                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                            {studio.series[0].instances.map((instance) => (
                                                <Link 
                                                    key={instance.id} 
                                                    href={`/dashboard/studi/${studio.id}`}
                                                    className="relative group flex-shrink-0"
                                                >
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 glass-card group-hover:border-blue-500/50 transition-colors">
                                                        <img 
                                                            src={`/api/images/${instance.id}`} 
                                                            alt="Thumbnail" 
                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                </Link>
                                            ))}
                                            {studio._count.series > 1 && (
                                                <div className="w-20 h-20 rounded-lg flex flex-col items-center justify-center text-[10px] uppercase font-bold text-blue-400 border border-blue-500/20 bg-blue-500/5">
                                                    <span>+{studio._count.series - 1}</span>
                                                    <span>Serie</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Report preview */}
                                    {studio.referto && (
                                        <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Referto:</p>
                                            <p className="line-clamp-2">{studio.referto}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                        <p>Nessun esame registrato per questo paziente</p>
                        <Link href="/dashboard/studi?new=true" className="btn-primary mt-4 inline-flex">
                            Crea Primo Studio
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
