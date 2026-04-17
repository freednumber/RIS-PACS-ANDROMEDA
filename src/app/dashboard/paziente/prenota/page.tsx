'use client';

import { useState } from 'react';
import Link from 'next/link';

const TIPI_ESAME = [
    { value: 'RM', label: 'Risonanza Magnetica (RM)', icon: '🧠' },
    { value: 'TC', label: 'Tomografia Computerizzata (TC)', icon: '🔬' },
    { value: 'RX', label: 'Radiografia (RX)', icon: '🫁' },
    { value: 'ECO', label: 'Ecografia', icon: '📡' },
    { value: 'MG', label: 'Mammografia', icon: '🩺' },
    { value: 'MOC', label: 'Densitometria Ossea (MOC)', icon: '🦴' },
];

const STRUTTURE = [
    { id: '1', nome: 'Centro Diagnostico Roma Nord', indirizzo: 'Via Salaria 120, Roma' },
    { id: '2', nome: 'Poliambulatorio San Marco', indirizzo: 'Corso Vittorio 45, Milano' },
    { id: '3', nome: 'Clinica Villa Serena', indirizzo: 'Via Aurelia 300, Roma' },
    { id: '4', nome: 'Istituto Radiologico Tiburtino', indirizzo: 'Via Tiburtina 890, Roma' },
    { id: '5', nome: 'Centro RM Parioli', indirizzo: 'Viale Parioli 55, Roma' },
];

export default function PrenotaEsamePage() {
    const [tipoEsame, setTipoEsame] = useState('');
    const [struttura, setStruttura] = useState('');
    const [data, setData] = useState('');
    const [note, setNote] = useState('');
    const [consenso, setConsenso] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [codice, setCodice] = useState('');
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tipoEsame || !struttura || !data || !consenso) {
            setError('Compila tutti i campi obbligatori e accetta il trattamento dati.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/prenotazioni', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipoEsame,
                    struttura,
                    dataDesiderata: new Date(data).toISOString(),
                    note: note || undefined,
                }),
            });

            const result = await res.json();
            if (result.success) {
                setCodice(result.data.codicePrenotazione || result.data.id.slice(0, 8).toUpperCase());
                setSuccess(true);
            } else {
                setError(result.error || 'Errore nella prenotazione');
            }
        } catch {
            setError('Errore di connessione. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        const strutturaInfo = STRUTTURE.find(s => s.nome === struttura);
        const tipoInfo = TIPI_ESAME.find(t => t.value === tipoEsame);
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                <div className="glass-card p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--gradient-accent)' }} />
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Prenotazione Inviata!</h1>
                    <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                        La tua richiesta è stata registrata con successo. Riceverai una conferma via email.
                    </p>

                    <div className="p-5 rounded-xl text-left space-y-3" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
                        <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Codice Prenotazione</span>
                            <span className="font-mono font-bold text-lg" style={{ color: 'var(--color-accent-light)' }}>
                                AND-{codice}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Esame</span>
                            <span className="text-sm font-medium">{tipoInfo?.icon} {tipoInfo?.label}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Struttura</span>
                            <span className="text-sm font-medium">{strutturaInfo?.nome}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Data</span>
                            <span className="text-sm font-medium">
                                {new Date(data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Stato</span>
                            <span className="badge bg-amber-500/20 text-amber-400 border-amber-500/30">In attesa di conferma</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 justify-center">
                        <Link href="/dashboard/paziente/appuntamenti" className="btn-primary text-sm">
                            I miei Appuntamenti
                        </Link>
                        <Link href="/dashboard/paziente" className="btn-secondary text-sm" style={{ textDecoration: 'none' }}>
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/paziente" className="hover:underline" style={{ color: 'var(--color-primary-light)' }}>
                    Dashboard
                </Link>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>Prenota Esame</span>
            </div>

            <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--gradient-primary)' }} />
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="18" /><line x1="10" y1="16" x2="14" y2="16" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Prenota Esame Privato</h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Compila il modulo per richiedere un appuntamento senza impegnativa SSN
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo Esame */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Tipo di Esame *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {TIPI_ESAME.map(tipo => (
                                <button
                                    key={tipo.value}
                                    type="button"
                                    onClick={() => setTipoEsame(tipo.value)}
                                    className={`p-4 rounded-xl text-left transition-all ${tipoEsame === tipo.value
                                        ? 'ring-2 ring-blue-500 scale-[1.02]'
                                        : 'hover:scale-[1.01]'}`}
                                    style={{
                                        background: tipoEsame === tipo.value
                                            ? 'rgba(59,130,246,0.15)'
                                            : 'rgba(30,41,59,0.5)',
                                        border: `1px solid ${tipoEsame === tipo.value ? 'rgba(59,130,246,0.4)' : 'rgba(148,163,184,0.08)'}`,
                                    }}
                                >
                                    <span className="text-2xl">{tipo.icon}</span>
                                    <p className="text-sm font-medium mt-2">{tipo.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Struttura */}
                    <div>
                        <label className="block text-sm font-medium mb-3">Struttura *</label>
                        <div className="space-y-2">
                            {STRUTTURE.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStruttura(s.nome)}
                                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${struttura === s.nome
                                        ? 'ring-2 ring-teal-500 scale-[1.01]'
                                        : 'hover:scale-[1.005]'}`}
                                    style={{
                                        background: struttura === s.nome
                                            ? 'rgba(13,148,136,0.15)'
                                            : 'rgba(30,41,59,0.5)',
                                        border: `1px solid ${struttura === s.nome ? 'rgba(13,148,136,0.4)' : 'rgba(148,163,184,0.08)'}`,
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: 'rgba(13,148,136,0.2)' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-accent-light)' }}>
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{s.nome}</p>
                                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.indirizzo}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Data Desiderata *</label>
                        <input
                            type="date"
                            value={data}
                            min={today}
                            onChange={e => setData(e.target.value)}
                            className="glass-input"
                            required
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Note Aggiuntive</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="glass-input"
                            rows={3}
                            placeholder="Inserisci eventuali informazioni utili..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Consenso */}
                    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
                        <input
                            type="checkbox"
                            id="consenso"
                            checked={consenso}
                            onChange={e => setConsenso(e.target.checked)}
                            className="mt-0.5 w-5 h-5 rounded accent-blue-500"
                        />
                        <label htmlFor="consenso" className="text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                            Acconsento al trattamento dei miei dati personali per finalità sanitarie, in conformità al Regolamento UE 2016/679 (GDPR) e alla normativa vigente in materia di protezione dei dati sanitari. *
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading || !tipoEsame || !struttura || !data || !consenso}
                            className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    Invio in corso...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                    Richiedi Appuntamento
                                </span>
                            )}
                        </button>
                        <Link href="/dashboard/paziente" className="text-sm hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                            Annulla
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
