'use client';

import { useEffect, useState, useCallback } from 'react';
import { getModalitaLabel } from '@/lib/utils';

interface Study {
    id: string;
    descrizione: string | null;
    modalita: string;
    patient: { nome: string; cognome: string };
}

export default function UploadPage() {
    const [studi, setStudi] = useState<Study[]>([]);
    const [selectedStudy, setSelectedStudy] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ count: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        fetch('/api/studi?limit=50')
            .then(res => res.json())
            .then(data => { if (data.success) setStudi(data.data); });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!selectedStudy || files.length === 0) return;

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('studyId', selectedStudy);
        files.forEach(f => formData.append('files', f));

        try {
            const res = await fetch('/api/dicom/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setResult({ count: data.data.count });
                setFiles([]);
                setProgress(100);
            }
        } catch {
            alert('Errore durante il caricamento');
        } finally {
            setUploading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold">Carica File DICOM</h1>
                <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Carica immagini diagnostiche associate a uno studio
                </p>
            </div>

            {/* Study Selection */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Seleziona Studio</h2>
                <select className="glass-input" value={selectedStudy} onChange={(e) => setSelectedStudy(e.target.value)}>
                    <option value="">Seleziona uno studio...</option>
                    {studi.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.patient.cognome} {s.patient.nome} — {getModalitaLabel(s.modalita)} {s.descrizione ? `(${s.descrizione})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Drop Zone */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">File DICOM</h2>
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
                        }`}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <svg className="mx-auto mb-4 opacity-40" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="font-medium">Trascina i file qui o clicca per selezionare</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Supporta file .dcm, .dicom e altri formati DICOM
                    </p>
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".dcm,.dicom,application/dicom"
                    />
                </div>

                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium">{files.length} file selezionat{files.length === 1 ? 'o' : 'i'}</p>
                        <div className="max-h-48 overflow-y-auto space-y-1.5">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg text-sm" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50">
                                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                            <polyline points="13 2 13 9 20 9" />
                                        </svg>
                                        <span className="truncate max-w-xs">{f.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatSize(f.size)}</span>
                                        <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Progress / Result */}
            {uploading && (
                <div className="glass-card p-6 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                        <p className="font-medium">Caricamento in corso...</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-lighter)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--gradient-primary)' }} />
                    </div>
                </div>
            )}

            {result && (
                <div className="glass-card p-6 bg-emerald-500/10 border-emerald-500/20 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-emerald-400">Upload completato!</p>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {result.count} file caricati con successo
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedStudy || files.length === 0}
                    className="btn-primary"
                >
                    📤 Carica {files.length > 0 ? `${files.length} File` : 'File'}
                </button>
            </div>
        </div>
    );
}
