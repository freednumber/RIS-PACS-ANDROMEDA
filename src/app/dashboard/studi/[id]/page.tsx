'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDateTime, getStatoLabel, getStatoColor, getModalitaLabel } from '@/lib/utils';
import ImageViewer from '@/components/ImageViewer';
import MultiViewportWorkstation from '@/components/pacs/MultiViewportWorkstation';
// TODO: replace with real role check (e.g., from session)
const isAdmin = true; // placeholder

interface StudyDetail {
    id: string;
    accessionNumber: string;
    studyInstanceUID: string;
    dataStudio: string;
    descrizione: string | null;
    modalita: string;
    bodyPart: string | null;
    sedeEsame: string | null;
    stato: string;
    priorita: string;
    referto: string | null;
    dataReferto: string | null;
    note: string | null;
    patient: {
        id: string; codiceFiscale: string; nome: string; cognome: string;
        dataNascita: string; sesso: string; telefono: string | null; email: string | null;
    };
    medicoRichiedente: { nome: string; cognome: string; specializzazione: string | null } | null;
    medicoRefertante: { nome: string; cognome: string; specializzazione: string | null } | null;
    series: Array<{
        id: string; descrizione: string | null; modalita: string | null;
        instances: Array<{ id: string; filePath: string; fileSize: number }>;
    }>;
    firme: Array<{ id: string; createdAt: string; firmaData: string; consenso: string }>;
    shareTokens: Array<{ id: string; token: string; scadenza: string; accessCount: number }>;
}

export default function StudioDetailPage() {
    const params = useParams();
    const [studio, setStudio] = useState<StudyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [referto, setReferto] = useState('');
    const [savingReferto, setSavingReferto] = useState(false);
const [uploadProgress, setUploadProgress] = useState<Array<{fileName:string; percent:number}>>([]);
    const [shareUrl, setShareUrl] = useState('');
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        fetch(`/api/studi/${params.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStudio(data.data);
                    setReferto(data.data.referto || '');
                }
            })
            .finally(() => setLoading(false));
    }, [params.id]);

    const saveReferto = async () => {
        setSavingReferto(true);
        try {
            const res = await fetch(`/api/studi/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referto }),
            });
            const data = await res.json();
            if (data.success && studio) {
                setStudio({ ...studio, referto, stato: 'REFERTATO' });
            }
        } finally { setSavingReferto(false); }
    };

// Upload handlers
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files) uploadFiles(Array.from(files));
};

const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  const items = e.dataTransfer.items;
  if (!items) return;

  const files: File[] = [];
  
  const traverseEntry = async (entry: any) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => entry.file(resolve));
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise<any[]>((resolve) => reader.readEntries(resolve));
      for (const child of entries) {
        await traverseEntry(child);
      }
    }
  };

  const promises = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry();
    if (entry) promises.push(traverseEntry(entry));
  }
  
  await Promise.all(promises);
  if (files.length > 0) uploadFiles(files);
};

const uploadFiles = async (files: File[]) => {
  const progressArray = files.map(f => ({ fileName: f.name, percent: 0 }));
  setUploadProgress(progressArray);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studyId', params.id as string);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/dicom/upload');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(prev => {
          const newArr = [...prev];
          newArr[i] = { fileName: file.name, percent };
          return newArr;
        });
      }
    };
    await new Promise<void>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }
  // Refetch study data after uploads
  fetch(`/api/studi/${params.id}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) setStudio(data.data);
    });
};

    const generateShareLink = async () => {
        setSharing(true);
        try {
            const res = await fetch('/api/condividi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studyId: params.id, durata: 7 }),
            });
            const data = await res.json();
            if (data.success) {
                setShareUrl(data.data.shareUrl);
            }
        } finally { setSharing(false); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    }
    if (!studio) return <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>Studio non trovato</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href="/dashboard/studi" className="hover:underline">Studi</Link>
                <span>→</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{getModalitaLabel(studio.modalita)}</span>
            </div>

            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{getModalitaLabel(studio.modalita)}</h1>
                            <span className={`badge ${getStatoColor(studio.stato)}`}>{getStatoLabel(studio.stato)}</span>
                            {studio.priorita === 'URGENTE' && (
                                <span className="badge bg-red-500/20 text-red-400 border-red-500/30">URGENTE</span>
                            )}
                        </div>
                        {studio.descrizione && <p style={{ color: 'var(--color-text-secondary)' }}>{studio.descrizione}</p>}
                        <div className="flex gap-6 mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>📅 {formatDateTime(studio.dataStudio)}</span>
                            {studio.sedeEsame && <span>🏥 {studio.sedeEsame}</span>}
                            {studio.bodyPart && <span>🦴 {studio.bodyPart}</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {studio.firme.length === 0 && (
                            <Link href={`/dashboard/firma/${studio.id}`} className="btn-primary text-sm">
                                ✍ Firma
                            </Link>
                        )}
                        <button onClick={generateShareLink} disabled={sharing} className="btn-secondary text-sm">
                            {sharing ? '...' : '🔗 Condividi'}
                        </button>
                    </div>
                </div>

                {shareUrl && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-fade-in">
                        <p className="text-xs font-medium text-emerald-400 mb-1">Link di condivisione generato:</p>
                        <div className="flex items-center gap-2">
                            <input className="glass-input text-sm flex-1" value={shareUrl} readOnly />
                            <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="btn-secondary text-xs py-2 px-3">
                                Copia
                            </button>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Valido per 7 giorni, max 10 accessi</p>
                    </div>
                )}
            </div>

            {/* Patient Info */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Dati Paziente</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nome</p>
                        <p className="font-medium mt-0.5">
                            <Link href={`/dashboard/pazienti/${studio.patient.id}`} className="hover:underline">
                                {studio.patient.cognome} {studio.patient.nome}
                            </Link>
                        </p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Codice Fiscale</p>
                        <p className="font-mono mt-0.5">{studio.patient.codiceFiscale}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Sesso</p>
                        <p className="mt-0.5">{studio.patient.sesso === 'M' ? '♂ Maschio' : '♀ Femmina'}</p>
                    </div>
                    {studio.medicoRichiedente && (
                        <div>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Medico Richiedente</p>
                            <p className="mt-0.5">Dr. {studio.medicoRichiedente.cognome} {studio.medicoRichiedente.nome}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Clinical Image Viewer — Multi-Viewport PACS Workstation */}
            <div style={{ height: 780, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <MultiViewportWorkstation
                    series={studio.series}
                    patientName={`${studio.patient.cognome} ${studio.patient.nome}`}
                    studyDate={new Date(studio.dataStudio).toLocaleDateString('it-IT')}
                />
            </div>

            {/* Admin Upload Section */}
            {isAdmin && (
              <div className="glass-card p-6 mt-6">
                <h2 className="text-lg font-bold mb-3">Carica Immagini DICOM</h2>
                <div
                  className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100/10"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Trascina i file qui o clicca per selezionare
                  </p>
                  <div className="flex justify-center gap-3 mt-4">
                    <label htmlFor="fileInput" className="btn-secondary text-xs cursor-pointer">
                      📄 Seleziona File
                    </label>
                    <label className="btn-primary text-xs cursor-pointer">
                      📁 Carica Cartella
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
                {uploadProgress.map((p, i) => (
                  <div key={i} className="mt-2">
                    <span className="text-sm">{p.fileName}</span>
                    <div className="w-full bg-gray-300 rounded h-2 mt-1">
                      <div
                        className="bg-primary-500 h-2 rounded"
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Report */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Referto</h2>
                <textarea
                    className="glass-input min-h-[200px] resize-y"
                    placeholder="Scrivi il referto radiologico..."
                    value={referto}
                    onChange={(e) => setReferto(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                    {studio.medicoRefertante && (
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            Refertato da Dr. {studio.medicoRefertante.cognome} {studio.medicoRefertante.nome}
                            {studio.dataReferto && ` il ${formatDateTime(studio.dataReferto)}`}
                        </p>
                    )}
                    <button onClick={saveReferto} disabled={savingReferto} className="btn-primary text-sm">
                        {savingReferto ? 'Salvataggio...' : '💾 Salva Referto'}
                    </button>
                </div>
            </div>

            {/* Signatures */}
            {studio.firme.length > 0 && (
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold mb-3">Firme del Paziente</h2>
                    <div className="space-y-3">
                        {studio.firme.map(f => (
                            <div key={f.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                <img src={f.firmaData} alt="Firma" className="h-16 bg-white/90 rounded-lg px-3" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-400">✓ Consenso firmato</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        {formatDateTime(f.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
