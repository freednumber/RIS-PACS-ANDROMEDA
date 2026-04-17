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
    const [scanning, setScanning] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Array<{ fileName: string; percent: number }>>([]);
    const [result, setResult] = useState<{ count: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        fetch('/api/studi?limit=50')
            .then(res => res.json())
            .then(data => { if (data.success) setStudi(data.data); });
    }, []);

    const traverseEntry = async (entry: any): Promise<File[]> => {
        if (entry.isFile) {
            const file = await new Promise<File>((resolve) => entry.file(resolve));
            // Only add DICOM files or files without extension (often DICOM)
            if (file.name.toLowerCase().endsWith('.dcm') || file.name.toLowerCase().endsWith('.dicom') || !file.name.includes('.')) {
                return [file];
            }
            return [];
        } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries = await new Promise<any[]>((resolve) => {
                const results: any[] = [];
                const readBatch = () => {
                    reader.readEntries((batch: any[]) => {
                        if (batch.length === 0) resolve(results);
                        else {
                            results.push(...batch);
                            readBatch();
                        }
                    });
                };
                readBatch();
            });
            const results = await Promise.all(entries.map(e => traverseEntry(e)));
            return results.flat();
        }
        return [];
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        setScanning(true);
        const items = e.dataTransfer.items;
        if (!items) return;

        const allFiles: File[] = [];
        const promises = [];
        for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (entry) promises.push(traverseEntry(entry));
        }

        const scanResults = await Promise.all(promises);
        const flattened = scanResults.flat();
        setFiles(prev => [...prev, ...flattened]);
        setScanning(false);
    };

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
        const progressArray = files.map(f => ({ fileName: f.name, percent: 0 }));
        setUploadProgress(progressArray);

        let successCount = 0;

        // Process in batches of 5 to avoid overloading the server/browser
        const batchSize = 5;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map((file, batchIdx) => {
                const globalIdx = i + batchIdx;
                const formData = new FormData();
                formData.append('studyId', selectedStudy);
                formData.append('files', file);

                return new Promise<void>((resolve) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/dicom/upload');
                    
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(prev => {
                                const newArr = [...prev];
                                newArr[globalIdx] = { ...newArr[globalIdx], percent };
                                return newArr;
                            });
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) successCount++;
                        resolve();
                    };
                    xhr.onerror = () => resolve();
                    xhr.send(formData);
                });
            });

            await Promise.all(batchPromises);
        }

        setResult({ count: successCount });
        setFiles([]);
        setUploading(false);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <div>
                <h1 className="text-3xl font-bold">Carica Immagini Diagnostiche</h1>
                <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Carica cartelle o file DICOM su Andromeda Enterprise
                </p>
            </div>

            {/* Study Selection */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                    Seleziona Destinazione
                </h2>
                <select className="glass-input" value={selectedStudy} onChange={(e) => setSelectedStudy(e.target.value)}>
                    <option value="">Seleziona lo studio a cui associare le immagini...</option>
                    {studi.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.patient.cognome} {s.patient.nome} — {getModalitaLabel(s.modalita)} {s.descrizione ? `(${s.descrizione})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Drop Zone */}
            <div className={`glass-card p-6 border-2 border-dashed transition-all ${dragOver ? 'border-primary-500 bg-primary-500/5 scale-[1.01]' : 'border-gray-700/50'}`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs">2</span>
                    Sorgente Immagini
                </h2>
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    className="p-10 text-center cursor-pointer group"
                >
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4 group-hover:bg-primary-500/10 transition-colors">
                        <svg className="opacity-40" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <p className="font-semibold text-lg">Trascina qui i file o l'intera cartella</p>
                    <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                        Andromeda eseguirà una scansione ricorsiva per trovare file .dcm e classificarli per sequenza clinica.
                    </p>
                    
                    <div className="flex justify-center gap-4 mt-8">
                        <label className="btn-secondary text-sm cursor-pointer shadow-sm">
                            📄 Seleziona File
                            <input
                                id="file-input"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                                accept=".dcm,.dicom,application/dicom"
                            />
                        </label>
                        <label className="btn-primary text-sm cursor-pointer shadow-md">
                            📁 Carica Cartella Intera
                            <input
                                type="file"
                                multiple
                                // @ts-ignore
                                webkitdirectory=""
                                directory=""
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </label>
                    </div>
                </div>

                {scanning && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/10 text-blue-300 flex items-center gap-3 animate-pulse">
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        <span className="text-sm font-medium">Scansione ricorsiva in corso... Attendere...</span>
                    </div>
                )}

                {files.length > 0 && !uploading && (
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                                {files.length} DICOM rilevati
                            </h3>
                            <button onClick={() => setFiles([])} className="text-xs text-red-400 hover:underline">Rimuovi tutti</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                            {files.map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg text-xs bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30">
                                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                            <polyline points="13 2 13 9 20 9" />
                                        </svg>
                                        <span className="truncate" title={f.name}>{f.name}</span>
                                    </div>
                                    <span className="text-[10px] opacity-40 font-mono shrink-0">{formatSize(f.size)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="glass-card p-6 animate-fade-in shadow-xl border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                            <p className="font-bold text-lg">Inviando dati ad Andromeda...</p>
                        </div>
                        <span className="text-sm font-mono text-blue-400">
                            {Math.round((uploadProgress.reduce((acc, p) => acc + p.percent, 0) / uploadProgress.length))}%
                        </span>
                    </div>
                    
                    {/* Overall Progress Bar */}
                    <div className="h-2 rounded-full overflow-hidden bg-gray-800 mb-6">
                        <div 
                            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500" 
                            style={{ width: `${(uploadProgress.reduce((acc, p) => acc + p.percent, 0) / uploadProgress.length)}%` }} 
                        />
                    </div>

                    {/* Detailed Progress */}
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {uploadProgress.slice(-5).map((p, i) => (
                            <div key={i} className="text-[10px] flex justify-between items-center opacity-60">
                                <span className="truncate max-w-[80%]">{p.fileName}</span>
                                <span>{p.percent}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {result && (
                <div className="glass-card p-6 bg-emerald-500/10 border-emerald-500/30 animate-fade-in shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-emerald-400">Elaborazione Completata</p>
                            <p className="text-sm opacity-70">
                                Abbiamo importato con successo <span className="font-bold text-white px-2 py-0.5 rounded bg-white/10">{result.count} serie di immagini</span>.
                            </p>
                        </div>
                        <button onClick={() => setResult(null)} className="ml-auto p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4">
                <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedStudy || files.length === 0}
                    className="btn-primary px-10 py-4 text-lg font-bold shadow-xl disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    🚀 {uploading ? 'Archiviando...' : `Archivia ${files.length} Immagini`}
                </button>
            </div>
        </div>
    );
}


