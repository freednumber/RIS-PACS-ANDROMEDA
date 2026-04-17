'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PatientProfile {
    id: string;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    dataNascita: string;
    sesso: string;
    email: string | null;
    telefono: string | null;
    indirizzo: string | null;
    citta: string | null;
    cap: string | null;
    provincia: string | null;
}

export default function ProfiloPazientePage() {
    const [profile, setProfile] = useState<PatientProfile | null>(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        nome: '', cognome: '', email: '', telefono: '',
        indirizzo: '', citta: '', cap: '', provincia: '',
    });

    useEffect(() => {
        fetch('/api/paziente/profilo')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data) {
                    setProfile(data.data);
                    setFormData({
                        nome: data.data.nome || '',
                        cognome: data.data.cognome || '',
                        email: data.data.email || '',
                        telefono: data.data.telefono || '',
                        indirizzo: data.data.indirizzo || '',
                        citta: data.data.citta || '',
                        cap: data.data.cap || '',
                        provincia: data.data.provincia || '',
                    });
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch(`/api/pazienti/${profile.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setProfile({ ...profile, ...formData });
                setEditing(false);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="glass-card p-12 text-center animate-fade-in">
                <h2 className="text-xl font-bold mb-2">Profilo non trovato</h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Non è stato possibile trovare il tuo profilo paziente.
                </p>
                <Link href="/dashboard/paziente" className="btn-primary mt-6 inline-block">
                    Torna alla Dashboard
                </Link>
            </div>
        );
    }

    const fields: { key: keyof typeof formData; label: string; readOnly?: boolean; type?: string }[] = [
        { key: 'nome', label: 'Nome' },
        { key: 'cognome', label: 'Cognome' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'telefono', label: 'Telefono', type: 'tel' },
        { key: 'indirizzo', label: 'Indirizzo' },
        { key: 'citta', label: 'Città' },
        { key: 'cap', label: 'CAP' },
        { key: 'provincia', label: 'Provincia' },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/paziente" className="hover:underline" style={{ color: 'var(--color-primary-light)' }}>
                    Dashboard
                </Link>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>Profilo</span>
            </div>

            {/* Success Toast */}
            {success && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 animate-fade-in">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                    Profilo aggiornato con successo
                </div>
            )}

            {/* Profile Card */}
            <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--gradient-primary)' }} />

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                            {profile.nome[0]}{profile.cognome[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{profile.nome} {profile.cognome}</h1>
                            <p className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                                {profile.codiceFiscale}
                            </p>
                        </div>
                    </div>
                    {!editing ? (
                        <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            Modifica
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => {
                                setEditing(false);
                                setFormData({
                                    nome: profile.nome || '', cognome: profile.cognome || '',
                                    email: profile.email || '', telefono: profile.telefono || '',
                                    indirizzo: profile.indirizzo || '', citta: profile.citta || '',
                                    cap: profile.cap || '', provincia: profile.provincia || '',
                                });
                            }} className="btn-secondary text-sm">Annulla</button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                                {saving ? 'Salvataggio...' : 'Salva'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Codice Fiscale</label>
                        <p className="font-mono font-semibold mt-1">{profile.codiceFiscale}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Data di Nascita</label>
                        <p className="font-semibold mt-1">
                            {new Date(profile.dataNascita).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
                        <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Sesso</label>
                        <p className="font-semibold mt-1">{profile.sesso === 'M' ? 'Maschio' : 'Femmina'}</p>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(field => (
                        <div key={field.key}>
                            <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                {field.label}
                            </label>
                            {editing ? (
                                <input
                                    type={field.type || 'text'}
                                    value={formData[field.key]}
                                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    className="glass-input"
                                />
                            ) : (
                                <p className="font-medium py-3 px-4 rounded-xl" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
                                    {formData[field.key] || '—'}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
