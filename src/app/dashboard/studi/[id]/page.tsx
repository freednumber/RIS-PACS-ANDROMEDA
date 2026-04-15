'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDateTime, getStatoLabel, getStatoColor, getModalitaLabel } from '@/lib/utils';

interface StudyDetail {
    id: string;
    accessionNumber: string;
    studyInstanceUID: string;
    dataStudio: string;
    descrizione: string | null;
    modalita: string;
    bodyPart: string | null;
    sedeEsame: string | null;
    stato: string;
    priorita: string;
    referto: string | null;
    dataReferto: string | null;
    note: string | null;
    patient: {
        id: string; codiceFiscale: string; nome: string; cognome: string;
        dataNascita: string; sesso: string; telefono: string | null; email: string | null;
    };
    medicoRichiedente: { nome: string; cognome: string; specializzazione: string | null } | null;
    medicoRefertante: { nome: string; cognome: string; specializzazione: string | null } | null;
    series: Array<{
        id: string; descrizione: string | null; modalita: string | null;
        instances: Array<{ id: string; filePath: string; fileSize: number }>;
    }>;
    firme: Array<{ id: string; createdAt: string; firmaData: string; consenso: string }>;
    shareTokens: Array<{ id: string; token: string; scadenza: string; accessCount: number }>;
}

export default function StudioDetailPage() {
    const params = useParams();
    const [studio, setStudio] = useState<StudyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [referto, setReferto] = useState('');
    const [savingReferto, setSavingReferto] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        fetch(`/api/studi/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStudio(data.data);
                    setReferto(data.data.referto || '');
                }
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    const saveReferto = async () => {
        setSavingReferto(true);
        try {
            const res = await fetch(`/api/studi/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referto }),
            });
            const data = await res.json();
            if (data.success && studio) {
                setStudio({ ...studio, referto, stato: 'REFERTATO' });
            }
        } finally { setSavingReferto(false); }
    };

    const generateShareLink = async () => {
        setSharing(true);
        try {
            const res = await fetch('/api/condividi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyId: params.id, durata: 7 }),
            });
            const data = await res.json();
            if (data.success) {
                setShareUrl(data.data.shareUrl);
            }
        } finally { setSharing(false); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    }
    if (!studio) return <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>Studio non trovato</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/studi" className="hover:underline">Studi</Link>
                <span>→</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{getModalitaLabel(studio.modalita)}</span>
            </div>

            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{getModalitaLabel(studio.modalita)}</h1>
                            <span className={`badge ${getStatoColor(studio.stato)}`}>{getStatoLabel(studio.stato)}</span>
                            {studio.priorita === 'URGENTE' && (
                                <span className="badge bg-red-500/20 text-red-400 border-red-500/30">URGENTE</span>
                            )}
                        </div>
                        {studio.descrizione && <p style={{ color: 'var(--color-text-secondary)' }}>{studio.descrizione}</p>}
                        <div className="flex gap-6 mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>📅 {formatDateTime(studio.dataStudio)}</span>
                            {studio.sedeEsame && <span>🏥 {studio.sedeEsame}</span>}
                            {studio.bodyPart && <span>🦴 {studio.bodyPart}</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {studio.firme.length === 0 && (
                            <Link href={`/dashboard/firma/${studio.id}`} className="btn-primary text-sm">
                                ✍ Firma
                            </Link>
                        )}
                        <button onClick={generateShareLink} disabled={sharing} className="btn-secondary text-sm">
                            {sharing ? '...' : '🔗 Condividi'}
                        </button>
                    </div>
                </div>

                {shareUrl && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                        <p className="text-xs font-medium text-emerald-400 mb-1">Link di condivisione generato:</p>
                        <div className="flex items-center gap-2">
                            <input className="glass-input text-sm flex-1" value={shareUrl} readOnly />
                            <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="btn-secondary text-xs py-2 px-3">
                                Copia
                            </button>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Valido per 7 giorni, max 10 accessi</p>
                    </div>
                )}
            </div>

            {/* Patient Info */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Dati Paziente</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nome</p>
                        <p className="font-medium mt-0.5">
                            <Link href={`/dashboard/pazienti/${studio.patient.id}`} className="hover:underline">
                                {studio.patient.cognome} {studio.patient.nome}
                            </Link>
                        </p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Codice Fiscale</p>
                        <p className="font-mono mt-0.5">{studio.patient.codiceFiscale}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Sesso</p>
                        <p className="mt-0.5">{studio.patient.sesso === 'M' ? '♂ Maschio' : '♀ Femmina'}</p>
                    </div>
                    {studio.medicoRichiedente && (
                        <div>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Medico Richiedente</p>
                            <p className="mt-0.5">Dr. {studio.medicoRichiedente.cognome} {studio.medicoRichiedente.nome}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image count */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Immagini DICOM</h2>
                {studio.series.length > 0 ? (
                    <div className="space-y-3">
                        {studio.series.map((s, i) => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                <div>
                                    <p className="font-medium text-sm">Serie {i + 1}: {s.descrizione || s.modalita || 'Senza nome'}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        {s.instances.length} immagin{s.instances.length === 1 ? 'e' : 'i'}
                                    </p>
                                </div>
                                <span className="badge bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    {s.instances.length} file
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                        <p>Nessuna immagine caricata</p>
                        <Link href="/dashboard/upload" className="btn-primary mt-3 inline-flex text-sm">
                            Carica DICOM
                        </Link>
                    </div>
                )}
            </div>

            {/* Report */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Referto</h2>
                <textarea
                    className="glass-input min-h-[200px] resize-y"
                    placeholder="Scrivi il referto radiologico..."
                    value={referto}
                    onChange={(e) => setReferto(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                    {studio.medicoRefertante && (
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            Refertato da Dr. {studio.medicoRefertante.cognome} {studio.medicoRefertante.nome}
                            {studio.dataReferto && ` il ${formatDateTime(studio.dataReferto)}`}
                        </p>
                    )}
                    <button onClick={saveReferto} disabled={savingReferto} className="btn-primary text-sm">
                        {savingReferto ? 'Salvataggio...' : '💾 Salva Referto'}
                    </button>
                </div>
            </div>

            {/* Signatures */}
            {studio.firme.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold mb-3">Firme del Paziente</h2>
                    <div className="space-y-3">
                        {studio.firme.map(f => (
                            <div key={f.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                <img src={f.firmaData} alt="Firma" className="h-16 bg-white/90 rounded-lg px-3" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-400">✓ Consenso firmato</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        {formatDateTime(f.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
