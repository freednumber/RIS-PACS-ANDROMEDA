'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDateTime, getStatoLabel, getStatoColor, getModalitaLabel } from '@/lib/utils';

interface Study {
    id: string;
    accessionNumber: string;
    dataStudio: string;
    descrizione: string | null;
    modalita: string;
    bodyPart: string | null;
    sedeEsame: string | null;
    stato: string;
    priorita: string;
    patient: { id: string; nome: string; cognome: string; codiceFiscale: string };
    medicoRichiedente: { nome: string; cognome: string } | null;
    _count: { series: number; firme: number };
}

interface Patient { id: string; nome: string; cognome: string; codiceFiscale: string; }

export default function StudiPage() {
    const [studi, setStudi] = useState<Study[]>([]);
    const [search, setSearch] = useState('');
    const [stato, setStato] = useState('');
    const [modalita, setModalita] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [pazienti, setPazienti] = useState<Patient[]>([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        patientId: '', descrizione: '', modalita: 'CR', bodyPart: '',
        sedeEsame: '', priorita: 'NORMALE', note: '',
    });

    const loadStudi = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (stato) params.set('stato', stato);
        if (modalita) params.set('modalita', modalita);
        const res = await fetch(`/api/studi?${params}`);
        const data = await res.json();
        if (data.success) setStudi(data.data);
        setLoading(false);
    };

    const loadPazienti = async () => {
        const res = await fetch('/api/pazienti?limit=100');
        const data = await res.json();
        if (data.success) setPazienti(data.data);
    };

    useEffect(() => { loadStudi(); }, [search, stato, modalita]);

    const handleNewStudio = () => {
        setShowForm(true);
        loadPazienti();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/studi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                loadStudi();
            }
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Studi Radiologici</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>Gestisci gli studi e i referti</p>
                </div>
                <button onClick={handleNewStudio} className="btn-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nuovo Studio
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4">Crea Nuovo Studio Radiologico</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Paziente *</label>
                                <select className="glass-input" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required>
                                    <option value="">Seleziona paziente...</option>
                                    {pazienti.map(p => <option key={p.id} value={p.id}>{p.cognome} {p.nome} — {p.codiceFiscale}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Modalità *</label>
                                <select className="glass-input" value={form.modalita} onChange={(e) => setForm({ ...form, modalita: e.target.value })}>
                                    {['CR', 'CT', 'MR', 'US', 'XA', 'MG', 'NM', 'PT', 'DX', 'RF', 'OT'].map(m => <option key={m} value={m}>{getModalitaLabel(m)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Priorità</label>
                                <select className="glass-input" value={form.priorita} onChange={(e) => setForm({ ...form, priorita: e.target.value })}>
                                    <option value="NORMALE">Normale</option>
                                    <option value="URGENTE">Urgente</option>
                                    <option value="BASSA">Bassa</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Descrizione</label>
                                <input className="glass-input" placeholder="es. RX Torace in 2 proiezioni" value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Parte del Corpo</label>
                                <input className="glass-input" placeholder="es. TORACE" value={form.bodyPart} onChange={(e) => setForm({ ...form, bodyPart: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Sede Esame</label>
                                <input className="glass-input" placeholder="es. Ospedale S. Giovanni, Roma" value={form.sedeEsame} onChange={(e) => setForm({ ...form, sedeEsame: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvataggio...' : 'Crea Studio'}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annulla</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input className="glass-input pl-11" placeholder="Cerca studi..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="glass-input w-auto" value={stato} onChange={(e) => setStato(e.target.value)}>
                        <option value="">Tutti gli stati</option>
                        <option value="IN_CORSO">In Corso</option>
                        <option value="COMPLETATO">Completato</option>
                        <option value="REFERTATO">Refertato</option>
                        <option value="FIRMATO">Firmato</option>
                    </select>
                    <select className="glass-input w-auto" value={modalita} onChange={(e) => setModalita(e.target.value)}>
                        <option value="">Tutte le modalità</option>
                        {['CR', 'CT', 'MR', 'US', 'XA', 'MG'].map(m => <option key={m} value={m}>{getModalitaLabel(m)}</option>)}
                    </select>
                </div>
            </div>

            {/* Study List */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : studi.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium border-b" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                                    <th className="p-4">Paziente</th>
                                    <th className="p-4">Modalità</th>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Sede</th>
                                    <th className="p-4">Stato</th>
                                    <th className="p-4">Firma</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {studi.map((s) => (
                                    <tr key={s.id} className="table-row">
                                        <td className="p-4">
                                            <Link href={`/dashboard/pazienti/${s.patient.id}`} className="font-medium hover:underline">
                                                {s.patient.cognome} {s.patient.nome}
                                            </Link>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{s.patient.codiceFiscale}</p>
                                        </td>
                                        <td className="p-4 text-sm">{getModalitaLabel(s.modalita)}</td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDateTime(s.dataStudio)}</td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{s.sedeEsame || '—'}</td>
                                        <td className="p-4"><span className={`badge ${getStatoColor(s.stato)}`}>{getStatoLabel(s.stato)}</span></td>
                                        <td className="p-4">
                                            {s._count.firme > 0 ? (
                                                <span className="text-emerald-400 text-sm">✓ Firmato</span>
                                            ) : (
                                                <Link href={`/dashboard/firma/${s.id}`} className="text-amber-400 text-sm hover:underline">Da firmare</Link>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <Link href={`/dashboard/studi/${s.id}`} className="text-xs font-medium" style={{ color: 'var(--color-primary-light)' }}>
                                                Dettagli →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
                        <p className="font-medium">Nessuno studio trovato</p>
                    </div>
                )}
            </div>
        </div>
    );
}
