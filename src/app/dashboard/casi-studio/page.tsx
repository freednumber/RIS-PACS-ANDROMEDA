'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CaseStudyInfo } from '@/types';
import { formatDateTime, getModalitaLabel } from '@/lib/utils';

const CATEGORIES = [
    { value: '', label: 'Tutte' },
    { value: 'NEUROLOGIA', label: '🧠 Neurologia' },
    { value: 'ORTOPEDIA', label: '🦴 Ortopedia' },
    { value: 'CARDIOLOGIA', label: '❤️ Cardiologia' },
    { value: 'PNEUMOLOGIA', label: '🫁 Pneumologia' },
    { value: 'ADDOME', label: '🏥 Addome' },
    { value: 'UROLOGIA', label: '🩺 Urologia' },
    { value: 'ONCOLOGIA', label: '🔬 Oncologia' },
    { value: 'PEDIATRIA', label: '👶 Pediatria' },
    { value: 'EMERGENZA', label: '🚨 Emergenza' },
    { value: 'ALTRO', label: '📋 Altro' },
];

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
    BASE: { label: 'Base', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    INTERMEDIO: { label: 'Intermedio', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    AVANZATO: { label: 'Avanzato', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function CasiStudioPage() {
    const [cases, setCases] = useState<CaseStudyInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoria, setCategoria] = useState('');
    const [difficolta, setDifficolta] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCases();
    }, [categoria, difficolta]);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoria) params.set('categoria', categoria);
            if (difficolta) params.set('difficolta', difficolta);
            if (search) params.set('search', search);

            const res = await fetch(`/api/cases?${params}`);
            const data = await res.json();
            if (data.success) setCases(data.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCases();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Casi Studio</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Libreria di casi clinici per formazione e consultazione
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <form onSubmit={handleSearchSubmit} className="md:col-span-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="glass-input flex-1"
                                placeholder="Cerca casi studio..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="btn-primary px-4">🔍</button>
                        </div>
                    </form>
                    <select
                        className="glass-input"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <select
                        className="glass-input"
                        value={difficolta}
                        onChange={(e) => setDifficolta(e.target.value)}
                    >
                        <option value="">Tutte le difficoltà</option>
                        <option value="BASE">🟢 Base</option>
                        <option value="INTERMEDIO">🟡 Intermedio</option>
                        <option value="AVANZATO">🔴 Avanzato</option>
                    </select>
                </div>
            </div>

            {/* Cases Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : cases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cases.map((caso, i) => (
                        <Link
                            key={caso.id}
                            href={`/dashboard/studi/${caso.studyId}`}
                            className={`case-card glass-card p-5 block animate-fade-in stagger-${(i % 5) + 1}`}
                        >
                            {/* Category & Difficulty */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="badge bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                    {CATEGORIES.find(c => c.value === caso.categoria)?.label || caso.categoria}
                                </span>
                                <span className={`badge text-xs ${DIFFICULTY_CONFIG[caso.difficolta]?.color || ''}`}>
                                    {DIFFICULTY_CONFIG[caso.difficolta]?.label || caso.difficolta}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-sm mb-2 line-clamp-2">{caso.titolo}</h3>

                            {/* Description */}
                            <p className="text-xs leading-relaxed line-clamp-3 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                                {caso.descrizione}
                            </p>

                            {/* Metadata */}
                            <div className="space-y-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="2" width="20" height="20" rx="2" />
                                        <path d="M7 2v20" />
                                        <path d="M17 2v20" />
                                        <path d="M2 12h20" />
                                    </svg>
                                    {getModalitaLabel(caso.study.modalita)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Dr. {caso.user.cognome} {caso.user.nome}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    <span className="flex items-center gap-1">
                                        👁️ {caso.visualizzazioni}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        💬 {caso._count.annotazioni}
                                    </span>
                                </div>
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    {formatDateTime(caso.createdAt)}
                                </span>
                            </div>

                            {/* Tags */}
                            {caso.tags && caso.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {caso.tags.slice(0, 3).map((tag, j) => (
                                        <span
                                            key={j}
                                            className="px-2 py-0.5 rounded-full text-xs"
                                            style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary-light)' }}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <svg className="mx-auto mb-4 opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <h3 className="font-bold text-lg text-white mb-2">Nessun caso studio trovato</h3>
                    <p className="text-sm mb-4">
                        {search || categoria || difficolta
                            ? 'Prova a modificare i filtri di ricerca'
                            : 'Pubblica il primo caso studio dalla pagina dettaglio di uno studio'}
                    </p>
                </div>
            )}
        </div>
    );
}
