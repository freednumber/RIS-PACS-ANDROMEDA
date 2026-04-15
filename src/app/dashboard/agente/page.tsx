'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, AIAnalysisResult } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AgentPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: '👋 Ciao! Sono **Andromeda AI**, il tuo assistente radiologico intelligente.\n\nPosso aiutarti con:\n- 🔍 **Ricerca semantica** di studi radiologici\n- 📝 **Analisi e suggerimenti** diagnostici\n- 🧠 **Diagnosi differenziale** e consulenza\n- 📊 **Classificazione** automatica degli studi\n\nCosa posso fare per te?',
            timestamp: new Date().toISOString(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyses, setAnalyses] = useState<AIAnalysisResult[]>([]);
    const [searchResults, setSearchResults] = useState<unknown[]>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'analyses' | 'search'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content }),
            });

            const data = await res.json();
            if (data.success) {
                setMessages((prev) => [...prev, data.data]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: '⚠️ Mi dispiace, si è verificato un errore. Riprova tra poco.',
                        timestamp: new Date().toISOString(),
                    },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: '⚠️ Errore di connessione. Verifica che il server sia attivo.',
                    timestamp: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/agent/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.data.results || []);
            }
        } catch {
            console.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6 animate-fade-in">
            {/* Left Panel - Chat */}
            <div className="flex-1 flex flex-col glass-card overflow-hidden">
                {/* Tab Bar */}
                <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
                    {(['chat', 'search', 'analyses'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === tab
                                ? 'border-b-2 text-white'
                                : 'text-gray-400 hover:text-gray-300'
                                }`}
                            style={activeTab === tab ? { borderColor: 'var(--color-primary-light)' } : {}}
                        >
                            {tab === 'chat' && '💬 Chat AI'}
                            {tab === 'search' && '🔍 Ricerca Semantica'}
                            {tab === 'analyses' && '🧠 Analisi'}
                        </button>
                    ))}
                </div>

                {activeTab === 'chat' && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'chat-bubble-user'
                                            : 'chat-bubble-assistant'
                                            }`}
                                    >
                                        <div
                                            className="text-sm leading-relaxed whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{
                                                __html: msg.content
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\n/g, '<br />')
                                                    .replace(/- (.*?)(<br|$)/g, '• $1$2'),
                                            }}
                                        />
                                        <p className="text-xs mt-1 opacity-50">
                                            {formatDateTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="chat-bubble-assistant rounded-2xl px-4 py-3">
                                        <div className="flex gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                            <div className="flex gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="glass-input flex-1"
                                    placeholder="Chiedimi qualsiasi cosa sulla radiologia..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    disabled={loading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="btn-primary px-5"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'search' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-6">
                            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                                Cerca con linguaggio naturale: es. &quot;frattura femore paziente pediatrico&quot; o &quot;TAC torace urgente&quot;
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    className="glass-input flex-1"
                                    placeholder="Descrivi cosa stai cercando..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch((e.target as HTMLInputElement).value);
                                        }
                                    }}
                                />
                                <button className="btn-primary px-5" onClick={() => {
                                    const input = document.querySelector('.glass-input[placeholder*="Descrivi"]') as HTMLInputElement;
                                    if (input) handleSearch(input.value);
                                }}>
                                    🔍 Cerca
                                </button>
                            </div>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                    {searchResults.length} risultati trovati
                                </h3>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {searchResults.map((study: any) => (
                                    <a
                                        key={study.id}
                                        href={`/dashboard/studi/${study.id}`}
                                        className="block glass-card p-4 hover:border-blue-500/30 transition-all"
                                        style={{ borderRadius: '12px' }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {study.patient?.cognome} {study.patient?.nome}
                                                </p>
                                                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {study.modalita} • {study.bodyPart || 'N/D'} • {study.stato}
                                                </p>
                                            </div>
                                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                                {formatDateTime(study.dataStudio)}
                                            </span>
                                        </div>
                                        {study.descrizione && (
                                            <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                                                {study.descrizione}
                                            </p>
                                        )}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20" style={{ color: 'var(--color-text-secondary)' }}>
                                <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <p>Inserisci una query per iniziare la ricerca</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analyses' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        {analyses.length > 0 ? (
                            <div className="space-y-4">
                                {analyses.map((a) => (
                                    <div key={a.id} className="glass-card p-4" style={{ borderRadius: '12px' }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="badge bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                {a.tipo}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                                Confidenza: {Math.round(a.confidenza * 100)}%
                                            </span>
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap">{a.contenuto}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20" style={{ color: 'var(--color-text-secondary)' }}>
                                <svg className="mx-auto mb-4 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                                <p className="font-medium">Nessuna analisi disponibile</p>
                                <p className="text-sm mt-1">Le analisi AI appariranno qui quando esegui un&apos;analisi su uno studio</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Panel - Quick Actions & Status */}
            <div className="w-80 space-y-4 flex-shrink-0">
                {/* AI Status */}
                <div className="glass-card p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14"
                            style={{
                                background: 'var(--gradient-primary)',
                                WebkitMaskImage: 'url(/andromeda-logo.png)',
                                WebkitMaskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskImage: 'url(/andromeda-logo.png)',
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center'
                            }} />
                        <div>
                            <h3 className="font-bold text-sm">Andromeda AI</h3>
                            <div className="flex items-center gap-2">
                                <div className="pulse-dot" />
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Operativo</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <div className="flex justify-between">
                            <span>Modello</span>
                            <span className="text-white">Gemini 2.5 Flash</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Analisi oggi</span>
                            <span className="text-white">{analyses.length}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-5">
                    <h3 className="font-bold text-sm mb-4">Azioni Rapide</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                setActiveTab('chat');
                                setInput('Quali studi urgenti sono ancora da refertare?');
                                inputRef.current?.focus();
                            }}
                            className="w-full text-left p-3 rounded-xl text-sm transition-all hover:bg-blue-500/10"
                            style={{ background: 'rgba(30, 41, 59, 0.5)' }}
                        >
                            🚨 Studi urgenti da refertare
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('chat');
                                setInput('Mostrami una panoramica degli studi di oggi');
                                inputRef.current?.focus();
                            }}
                            className="w-full text-left p-3 rounded-xl text-sm transition-all hover:bg-blue-500/10"
                            style={{ background: 'rgba(30, 41, 59, 0.5)' }}
                        >
                            📊 Panoramica giornaliera
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('chat');
                                setInput('Quali sono i protocolli consigliati per una TC torace con mezzo di contrasto?');
                                inputRef.current?.focus();
                            }}
                            className="w-full text-left p-3 rounded-xl text-sm transition-all hover:bg-blue-500/10"
                            style={{ background: 'rgba(30, 41, 59, 0.5)' }}
                        >
                            📋 Protocolli imaging
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('search');
                            }}
                            className="w-full text-left p-3 rounded-xl text-sm transition-all hover:bg-blue-500/10"
                            style={{ background: 'rgba(30, 41, 59, 0.5)' }}
                        >
                            🔍 Ricerca studi avanzata
                        </button>
                    </div>
                </div>

                {/* AI Info */}
                <div className="glass-card p-5">
                    <h3 className="font-bold text-sm mb-3">Informazioni</h3>
                    <div className="text-xs space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                        <p>L&apos;agente AI può analizzare studi, suggerire referti e aiutarti con diagnosi differenziali.</p>
                        <p>Per analizzare uno studio specifico, usa il pulsante <strong className="text-white">&quot;Analisi AI&quot;</strong> nella pagina dettaglio studio.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
