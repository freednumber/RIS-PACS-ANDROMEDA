'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Patient {
    id: string;
    codiceFiscale: string;
    nome: string;
    cognome: string;
    dataNascita: string;
    sesso: string;
    telefono: string | null;
    email: string | null;
    _count: { studi: number; firme: number };
}

export default function PazientiPage() {
    const [pazienti, setPazienti] = useState<Patient[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        codiceFiscale: '', nome: '', cognome: '', dataNascita: '',
        sesso: 'M', luogoNascita: '', indirizzo: '', citta: '',
        cap: '', provincia: '', telefono: '', email: '', note: '',
    });

    const loadPazienti = async () => {
        setLoading(true);
        const res = await fetch(`/api/pazienti?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data.success) setPazienti(data.data);
        setLoading(false);
    };

    useEffect(() => { loadPazienti(); }, [search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/pazienti', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                setForm({
                    codiceFiscale: '', nome: '', cognome: '', dataNascita: '',
                    sesso: 'M', luogoNascita: '', indirizzo: '', citta: '',
                    cap: '', provincia: '', telefono: '', email: '', note: ''
                });
                loadPazienti();
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Pazienti</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Gestisci l&apos;anagrafica pazienti
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setShowForm(true);
                            // Simula la lettura elettronica della tessera sanitaria dalla smart card
                            setTimeout(() => {
                                setForm(prev => ({
                                    ...prev,
                                    codiceFiscale: 'VRDMRC70A01H501Z',
                                    nome: 'Marco',
                                    cognome: 'Verdi',
                                    dataNascita: '1970-01-01',
                                    sesso: 'M'
                                }));
                            }, 1000);
                        }}
                        className="py-2.5 px-4 bg-teal-600/20 text-teal-300 font-bold border border-teal-500/30 rounded-xl flex items-center gap-2 hover:bg-teal-600/30 transition shadow-lg shadow-teal-500/10"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M7 15h4M7 19h10M15 15h2" /></svg>
                        Leggi Tessera (TS-CNS)
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Manuale
                    </button>
                </div>
            </div>

            {/* New Patient Form */}
            {showForm && (
                <div className="glass-card p-6 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4">Registra Nuovo Paziente</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Codice Fiscale *</label>
                                <input className="glass-input" placeholder="RSSMRA80A01H501X" value={form.codiceFiscale}
                                    onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })} required maxLength={16} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Nome *</label>
                                <input className="glass-input" placeholder="Mario" value={form.nome}
                                    onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Cognome *</label>
                                <input className="glass-input" placeholder="Rossi" value={form.cognome}
                                    onChange={(e) => setForm({ ...form, cognome: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Data di Nascita *</label>
                                <input type="date" className="glass-input" value={form.dataNascita}
                                    onChange={(e) => setForm({ ...form, dataNascita: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Sesso *</label>
                                <select className="glass-input" value={form.sesso}
                                    onChange={(e) => setForm({ ...form, sesso: e.target.value })}>
                                    <option value="M">Maschio</option>
                                    <option value="F">Femmina</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Telefono</label>
                                <input className="glass-input" placeholder="+39 333 1234567" value={form.telefono}
                                    onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                                <input type="email" className="glass-input" placeholder="mario@email.it" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Città</label>
                                <input className="glass-input" placeholder="Roma" value={form.citta}
                                    onChange={(e) => setForm({ ...form, citta: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Provincia</label>
                                <input className="glass-input" placeholder="RM" value={form.provincia}
                                    onChange={(e) => setForm({ ...form, provincia: e.target.value })} maxLength={2} />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="btn-primary">
                                {saving ? 'Salvataggio...' : 'Salva Paziente'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="glass-card p-4">
                <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        className="glass-input pl-11"
                        placeholder="Cerca per nome, cognome o codice fiscale..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Patient List */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                ) : pazienti.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium border-b" style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
                                    <th className="p-4">Paziente</th>
                                    <th className="p-4">Codice Fiscale</th>
                                    <th className="p-4">Data Nascita</th>
                                    <th className="p-4">Sesso</th>
                                    <th className="p-4">Studi</th>
                                    <th className="p-4">Contatto</th>
                                    <th className="p-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pazienti.map((p) => (
                                    <tr key={p.id} className="table-row">
                                        <td className="p-4">
                                            <Link href={`/dashboard/pazienti/${p.id}`} className="font-medium hover:underline">
                                                {p.cognome} {p.nome}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                            {p.codiceFiscale}
                                        </td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {formatDate(p.dataNascita)}
                                        </td>
                                        <td className="p-4 text-sm">{p.sesso === 'M' ? '♂ M' : '♀ F'}</td>
                                        <td className="p-4">
                                            <span className="badge bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                {p._count.studi} studi
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {p.telefono || p.email || '—'}
                                        </td>
                                        <td className="p-4">
                                            <Link
                                                href={`/dashboard/pazienti/${p.id}`}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg"
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
                    <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
                        <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                        </svg>
                        <p className="font-medium">Nessun paziente trovato</p>
                        <p className="text-sm mt-1">Registra il primo paziente per iniziare</p>
                    </div>
                )}
            </div>
        </div>
    );
}
