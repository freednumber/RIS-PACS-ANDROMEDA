'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Prenotazione {
    id: string;
    tipoEsame: string;
    descrizioneEsame?: string;
    struttura: string;
    dataDesiderata: string;
    stato: string;
    note?: string;
    codicePrenotazione?: string;
    createdAt: string;
}

const FILTRI = [
    { value: 'TUTTI', label: 'Tutti' },
    { value: 'IN_ATTESA', label: 'In attesa' },
    { value: 'CONFERMATO', label: 'Confermati' },
    { value: 'COMPLETATO', label: 'Completati' },
    { value: 'ANNULLATO', label: 'Annullati' },
];

export default function AppuntamentiPage() {
    const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('TUTTI');
    const [editModal, setEditModal] = useState<Prenotazione | null>(null);
    const [newDate, setNewDate] = useState('');
    const [cancelDialog, setCancelDialog] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPrenotazioni = async () => {
        try {
            const res = await fetch('/api/prenotazioni');
            const data = await res.json();
            if (data.success) {
                setPrenotazioni(data.data || []);
            }
        } catch (err) {
            console.error('Fetch prenotazioni error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPrenotazioni(); }, []);

    const handleCancel = async (id: string) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/prenotazioni/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stato: 'ANNULLATO' }),
            });
            const data = await res.json();
            if (data.success) {
                setPrenotazioni(prev => prev.map(p => p.id === id ? { ...p, stato: 'ANNULLATO' } : p));
            }
        } catch (err) {
            console.error('Cancel error:', err);
        } finally {
            setActionLoading(false);
            setCancelDialog(null);
        }
    };

    const handleEdit = async () => {
        if (!editModal || !newDate) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/prenotazioni/${editModal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataDesiderata: new Date(newDate).toISOString() }),
            });
            const data = await res.json();
            if (data.success) {
                setPrenotazioni(prev =>
                    prev.map(p => p.id === editModal.id ? { ...p, dataDesiderata: new Date(newDate).toISOString() } : p)
                );
            }
        } catch (err) {
            console.error('Edit error:', err);
        } finally {
            setActionLoading(false);
            setEditModal(null);
            setNewDate('');
        }
    };

    const filtered = filtro === 'TUTTI' ? prenotazioni : prenotazioni.filter(p => p.stato === filtro);

    const getStatoBadge = (stato: string) => {
        switch (stato) {
            case 'IN_ATTESA': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'CONFERMATO': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'COMPLETATO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'ANNULLATO': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const formatStato = (stato: string) => {
        const labels: Record<string, string> = {
            'IN_ATTESA': 'In attesa', 'CONFERMATO': 'Confermato',
            'COMPLETATO': 'Completato', 'ANNULLATO': 'Annullato',
        };
        return labels[stato] || stato;
    };

    const getExamIcon = (tipo: string) => {
        switch (tipo) {
            case 'RM': case 'MR': return '🧠';
            case 'TC': case 'CT': return '🔬';
            case 'RX': case 'CR': return '🫁';
            case 'ECO': case 'US': return '📡';
            case 'MG': return '🩺';
            case 'MOC': return '🦴';
            default: return '📋';
        }
    };

    const today = new Date().toISOString().split('T')[0];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/paziente" className="hover:underline" style={{ color: 'var(--color-primary-light)' }}>
                    Dashboard
                </Link>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>Appuntamenti</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">I miei Appuntamenti</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Gestisci le tue prenotazioni
                    </p>
                </div>
                <Link href="/dashboard/paziente/prenota" className="btn-primary text-sm w-fit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Nuova Prenotazione
                </Link>
            </div>

            {/* Filtri */}
            <div className="flex flex-wrap gap-2">
                {FILTRI.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFiltro(f.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filtro === f.value
                            ? 'ring-2 ring-blue-500'
                            : 'hover:bg-white/5'}`}
                        style={{
                            background: filtro === f.value ? 'rgba(59,130,246,0.15)' : 'rgba(30,41,59,0.5)',
                            border: `1px solid ${filtro === f.value ? 'rgba(59,130,246,0.4)' : 'rgba(148,163,184,0.08)'}`,
                        }}
                    >
                        {f.label}
                        {f.value !== 'TUTTI' && (
                            <span className="ml-2 text-xs opacity-60">
                                ({prenotazioni.filter(p => p.stato === f.value).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Lista */}
            {filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map((p, i) => (
                        <div
                            key={p.id}
                            className={`glass-card p-5 animate-fade-in stagger-${Math.min(i + 1, 5)}`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                                        style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)' }}>
                                        {getExamIcon(p.tipoEsame)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-sm">{p.descrizioneEsame || p.tipoEsame}</h3>
                                            <span className={`badge ${getStatoBadge(p.stato)}`}>{formatStato(p.stato)}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                {new Date(p.dataDesiderata).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </span>
                                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                {p.struttura}
                                            </span>
                                            {p.codicePrenotazione && (
                                                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(13,148,136,0.15)', color: 'var(--color-accent-light)' }}>
                                                    AND-{p.codicePrenotazione}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {p.stato === 'IN_ATTESA' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => { setEditModal(p); setNewDate(p.dataDesiderata.split('T')[0]); }}
                                            className="btn-secondary text-xs px-3 py-2"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            Modifica
                                        </button>
                                        <button
                                            onClick={() => setCancelDialog(p.id)}
                                            className="text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                                Annulla
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <svg className="mx-auto mb-4 opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <h2 className="text-xl font-bold mb-2">Nessun appuntamento</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                        Non hai ancora prenotato nessun esame. Inizia adesso!
                    </p>
                    <Link href="/dashboard/paziente/prenota" className="btn-primary">
                        Prenota il tuo primo esame
                    </Link>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Modifica Data Appuntamento</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                            Seleziona la nuova data per l&apos;esame <strong>{editModal.tipoEsame}</strong> presso <strong>{editModal.struttura}</strong>.
                        </p>
                        <input
                            type="date"
                            value={newDate}
                            min={today}
                            onChange={e => setNewDate(e.target.value)}
                            className="glass-input mb-6"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setEditModal(null); setNewDate(''); }} className="btn-secondary text-sm">
                                Annulla
                            </button>
                            <button onClick={handleEdit} disabled={actionLoading} className="btn-primary text-sm">
                                {actionLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Dialog */}
            {cancelDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold">Annullare Appuntamento?</h3>
                        </div>
                        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                            Sei sicuro di voler annullare questa prenotazione? L&apos;operazione non è reversibile.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setCancelDialog(null)} className="btn-secondary text-sm">
                                Indietro
                            </button>
                            <button
                                onClick={() => handleCancel(cancelDialog)}
                                disabled={actionLoading}
                                className="text-sm px-4 py-2.5 rounded-xl font-semibold transition-colors"
                                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                                {actionLoading ? 'Annullamento...' : 'Sì, Annulla'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
