'use client';

import { useEffect, useState } from 'react';
import type { FederatedNodeInfo } from '@/types';
import { formatDateTime } from '@/lib/utils';

const COUNTRY_FLAGS: Record<string, string> = {
    IT: '🇮🇹', DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', GB: '🇬🇧', US: '🇺🇸',
    CH: '🇨🇭', AT: '🇦🇹', BE: '🇧🇪', NL: '🇳🇱', PT: '🇵🇹', GR: '🇬🇷',
    PL: '🇵🇱', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', IE: '🇮🇪',
    JP: '🇯🇵', BR: '🇧🇷', CA: '🇨🇦', AU: '🇦🇺', IN: '🇮🇳', CN: '🇨🇳',
};

const COUNTRY_NAMES: Record<string, string> = {
    IT: 'Italia', DE: 'Germania', FR: 'Francia', ES: 'Spagna', GB: 'Regno Unito',
    US: 'Stati Uniti', CH: 'Svizzera', AT: 'Austria', BE: 'Belgio', NL: 'Paesi Bassi',
    PT: 'Portogallo', GR: 'Grecia', PL: 'Polonia', SE: 'Svezia', NO: 'Norvegia',
    DK: 'Danimarca', FI: 'Finlandia', IE: 'Irlanda', JP: 'Giappone', BR: 'Brasile',
    CA: 'Canada', AU: 'Australia', IN: 'India', CN: 'Cina',
};

export default function FederazionePage() {
    const [nodes, setNodes] = useState<FederatedNodeInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nome: '', endpoint: '', paese: 'IT' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNodes();
    }, []);

    const fetchNodes = async () => {
        try {
            const res = await fetch('/api/federation/nodes');
            const data = await res.json();
            if (data.success) setNodes(data.data);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNode = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/federation/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setNodes((prev) => [data.data, ...prev]);
                setForm({ nome: '', endpoint: '', paese: 'IT' });
                setShowForm(false);
            } else {
                setError(data.error || 'Errore');
            }
        } catch {
            setError('Errore di connessione');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNode = async (id: string) => {
        if (!confirm('Rimuovere questo nodo dalla federazione?')) return;
        try {
            await fetch(`/api/federation/nodes?id=${id}`, { method: 'DELETE' });
            setNodes((prev) => prev.filter((n) => n.id !== id));
        } catch {
            console.error('Delete failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Rete Federata</h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Connetti istanze Andromeda di altre strutture per condividere studi e conoscenza
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Aggiungi Nodo
                </button>
            </div>

            {/* Network Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card stat-card p-5">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Nodi Connessi</p>
                    <p className="text-2xl font-bold mt-1">{nodes.length}</p>
                </div>
                <div className="glass-card stat-card p-5">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Nodi Attivi</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-400">{nodes.filter(n => n.attivo).length}</p>
                </div>
                <div className="glass-card stat-card p-5">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Paesi</p>
                    <p className="text-2xl font-bold mt-1">{new Set(nodes.map(n => n.paese)).size}</p>
                </div>
                <div className="glass-card stat-card p-5">
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Stato Rete</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="pulse-dot" />
                        <span className="text-sm font-semibold text-emerald-400">Online</span>
                    </div>
                </div>
            </div>

            {/* Add Node Form */}
            {showForm && (
                <div className="glass-card p-6 animate-fade-in">
                    <h2 className="text-lg font-bold mb-4">Registra Nuovo Nodo</h2>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleAddNode} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Nome Struttura
                            </label>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Ospedale San Raffaele - Milano"
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Endpoint API
                            </label>
                            <input
                                type="url"
                                className="glass-input"
                                placeholder="https://ris.ospedale.it/api/federation"
                                value={form.endpoint}
                                onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                Paese
                            </label>
                            <select
                                className="glass-input"
                                value={form.paese}
                                onChange={(e) => setForm({ ...form, paese: e.target.value })}
                            >
                                {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                                    <option key={code} value={code}>
                                        {COUNTRY_FLAGS[code]} {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-3 flex gap-3 justify-end">
                            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                Annulla
                            </button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Registrazione...' : '🌐 Registra Nodo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Nodes Grid */}
            {nodes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nodes.map((node, i) => (
                        <div
                            key={node.id}
                            className={`federation-node-card glass-card p-5 animate-fade-in stagger-${(i % 5) + 1}`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{COUNTRY_FLAGS[node.paese] || '🌍'}</span>
                                    <div>
                                        <h3 className="font-bold text-sm">{node.nome}</h3>
                                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                            {COUNTRY_NAMES[node.paese] || node.paese}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: node.attivo ? 'var(--color-success)' : 'var(--color-danger)' }}
                                    />
                                    <span className="text-xs" style={{ color: node.attivo ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                        {node.attivo ? 'Attivo' : 'Offline'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                <div className="flex justify-between">
                                    <span>Endpoint</span>
                                    <span className="text-white truncate max-w-[180px]">{node.endpoint}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Ultimo Sync</span>
                                    <span className="text-white">
                                        {node.ultimoSync ? formatDateTime(node.ultimoSync) : 'Mai'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Registrato</span>
                                    <span className="text-white">{formatDateTime(node.createdAt)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <button className="btn-secondary flex-1 py-2 text-xs">
                                    🔄 Sincronizza
                                </button>
                                <button
                                    onClick={() => handleDeleteNode(node.id)}
                                    className="px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                    style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    <svg className="mx-auto mb-4 opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <h3 className="font-bold text-lg text-white mb-2">Nessun nodo federato</h3>
                    <p className="text-sm mb-4">Registra il primo nodo per iniziare a connettere strutture sanitarie</p>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        🌐 Aggiungi il Primo Nodo
                    </button>
                </div>
            )}
        </div>
    );
}
