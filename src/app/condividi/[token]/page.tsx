'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatDateTime, getModalitaLabel } from '@/lib/utils';

interface SharedStudy {
    id: string;
    dataStudio: string;
    descrizione: string | null;
    modalita: string;
    bodyPart: string | null;
    sedeEsame: string | null;
    stato: string;
    referto: string | null;
    dataReferto: string | null;
    patient: { nome: string; cognome: string; dataNascita: string; sesso: string };
    medicoRichiedente: { nome: string; cognome: string; specializzazione: string | null } | null;
    medicoRefertante: { nome: string; cognome: string; specializzazione: string | null } | null;
    series: Array<{
        id: string; descrizione: string | null;
        instances: Array<{ id: string; fileSize: number }>;
    }>;
    firme: Array<{ createdAt: string }>;
}

export default function SharedViewPage() {
    const params = useParams();
    const [studio, setStudio] = useState<SharedStudy | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/condividi/${params.token}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setStudio(data.data);
                else setError(data.error || 'Errore nel caricamento');
            })
            .catch(() => setError('Errore di connessione'))
            .finally(() => setLoading(false));
    }, [params.token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 text-center max-w-md animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-red-400">{error}</h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Il link potrebbe essere scaduto, disattivato o aver raggiunto il limite di accessi.
                    </p>
                </div>
            </div>
        );
    }

    if (!studio) return null;

    const totalImages = studio.series.reduce((acc, s) => acc + s.instances.length, 0);

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Andromeda</h1>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Visualizzazione Studio Condiviso</p>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                        <p className="text-blue-400 font-medium">🔒 Accesso in sola lettura</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                            Questo link è stato condiviso per la consultazione dello studio radiologico
                        </p>
                    </div>
                </div>

                {/* Patient & Study Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-3">Dati Paziente</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Nome</span>
                                <span className="font-medium">{studio.patient.cognome} {studio.patient.nome}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Sesso</span>
                                <span>{studio.patient.sesso === 'M' ? '♂ Maschio' : '♀ Femmina'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-3">Dettagli Esame</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Modalità</span>
                                <span className="font-medium">{getModalitaLabel(studio.modalita)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Data</span>
                                <span>{formatDateTime(studio.dataStudio)}</span>
                            </div>
                            {studio.sedeEsame && (
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Sede</span>
                                    <span>{studio.sedeEsame}</span>
                                </div>
                            )}
                            {studio.bodyPart && (
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Distretto</span>
                                    <span>{studio.bodyPart}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>Immagini</span>
                                <span>{totalImages}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Medici */}
                {(studio.medicoRichiedente || studio.medicoRefertante) && (
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-3">Medici</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {studio.medicoRichiedente && (
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Medico Richiedente</p>
                                    <p className="font-medium mt-0.5">
                                        Dr. {studio.medicoRichiedente.cognome} {studio.medicoRichiedente.nome}
                                        {studio.medicoRichiedente.specializzazione && ` (${studio.medicoRichiedente.specializzazione})`}
                                    </p>
                                </div>
                            )}
                            {studio.medicoRefertante && (
                                <div>
                                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Medico Refertante</p>
                                    <p className="font-medium mt-0.5">
                                        Dr. {studio.medicoRefertante.cognome} {studio.medicoRefertante.nome}
                                        {studio.medicoRefertante.specializzazione && ` (${studio.medicoRefertante.specializzazione})`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Report */}
                {studio.referto && (
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-3">Referto</h2>
                        <div className="p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                            {studio.referto}
                        </div>
                        {studio.dataReferto && studio.medicoRefertante && (
                            <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                                Refertato da Dr. {studio.medicoRefertante.cognome} il {formatDateTime(studio.dataReferto)}
                            </p>
                        )}
                    </div>
                )}

                {/* Signature Status */}
                {studio.firme.length > 0 && (
                    <div className="glass-card p-4 bg-emerald-500/5 border-emerald-500/20">
                        <div className="flex items-center gap-3">
                            <div className="pulse-dot" />
                            <p className="text-sm font-medium text-emerald-400">
                                ✓ Consenso del paziente firmato il {formatDateTime(studio.firme[0].createdAt)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs py-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <p>Andromeda — Sistema Radiologico Integrato</p>
                    <p className="mt-1">Questo contenuto è riservato e protetto dalla normativa sulla privacy (GDPR)</p>
                </div>
            </div>
        </div>
    );
}
