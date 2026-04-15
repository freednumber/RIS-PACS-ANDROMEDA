'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SignaturePad from 'signature_pad';

interface StudyInfo {
    id: string;
    descrizione: string | null;
    modalita: string;
    dataStudio: string;
    patient: { nome: string; cognome: string; codiceFiscale: string };
}

export default function FirmaPage() {
    const params = useParams();
    const router = useRouter();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignaturePad | null>(null);
    const [studio, setStudio] = useState<StudyInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [consensoAccettato, setConsensoAccettato] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch(`/api/studi/${params.studyId}`)
            .then(res => res.json())
            .then(data => { if (data.success) setStudio(data.data); })
            .finally(() => setLoading(false));
    }, [params.studyId]);

    useEffect(() => {
        if (canvasRef.current && !signaturePadRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth * 2;
            canvas.height = canvas.offsetHeight * 2;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(2, 2);

            signaturePadRef.current = new SignaturePad(canvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)',
                minWidth: 1,
                maxWidth: 3,
            });
        }
    }, [studio]);

    const clearSignature = () => {
        signaturePadRef.current?.clear();
    };

    const handleSubmit = async () => {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
            alert('Per favore, firma prima di procedere.');
            return;
        }
        if (!consensoAccettato) {
            alert('Devi accettare il consenso informato.');
            return;
        }

        setSaving(true);
        try {
            const firmaData = signaturePadRef.current.toDataURL('image/png');
            const res = await fetch(`/api/firma/${params.studyId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firmaData,
                    consenso: getConsensoText(studio!.modalita),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => router.push(`/dashboard/studi/${params.studyId}`), 2000);
            }
        } finally { setSaving(false); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    }
    if (!studio) return <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>Studio non trovato</div>;

    if (saved) {
        return (
            <div className="flex items-center justify-center h-96 animate-fade-in">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-400">Firma Registrata</h2>
                    <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Il consenso è stato salvato con successo. Reindirizzamento...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Link href={`/dashboard/studi/${studio.id}`} className="hover:underline">Studio</Link>
                <span>→</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>Firma Consenso</span>
            </div>

            {/* Study Info */}
            <div className="glass-card p-6">
                <h1 className="text-2xl font-bold mb-4">Firma Consenso Informato</h1>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Paziente</p>
                        <p className="font-medium mt-0.5">{studio.patient.cognome} {studio.patient.nome}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Codice Fiscale</p>
                        <p className="font-mono mt-0.5">{studio.patient.codiceFiscale}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Esame</p>
                        <p className="mt-0.5">{studio.descrizione || studio.modalita}</p>
                    </div>
                </div>
            </div>

            {/* Consent Text */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold mb-3">Consenso Informato {studio.modalita && `(${studio.modalita})`}</h2>
                <div className="p-4 rounded-lg text-sm leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line"
                    style={{ background: 'rgba(15, 23, 42, 0.5)', color: 'var(--color-text-secondary)' }}>
                    {getConsensoText(studio.modalita)}
                </div>
                <label className="flex items-center gap-3 mt-4 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={consensoAccettato}
                        onChange={(e) => setConsensoAccettato(e.target.checked)}
                        className="w-5 h-5 accent-blue-500"
                    />
                    <span className="text-sm font-medium">
                        Ho letto e accetto il consenso informato
                    </span>
                </label>
            </div>

            {/* Signature Pad */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Firma del Paziente</h2>
                    <button onClick={clearSignature} className="btn-secondary text-xs py-1.5 px-3">
                        Cancella
                    </button>
                </div>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                    <canvas
                        ref={canvasRef}
                        className="w-full bg-white cursor-crosshair"
                        style={{ height: '200px', touchAction: 'none' }}
                    />
                </div>
                <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    Firma nell&apos;area bianca con il mouse o il dito (touchscreen)
                </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
                <Link href={`/dashboard/studi/${studio.id}`} className="btn-secondary">
                    Annulla
                </Link>
                <button
                    onClick={handleSubmit}
                    disabled={saving || !consensoAccettato}
                    className="btn-primary"
                >
                    {saving ? 'Salvataggio...' : '✍ Conferma e Salva Firma'}
                </button>
            </div>
        </div>
    );
}

const getConsensoText = (modalita: string) => {
    const base = `Il/La sottoscritto/a, in qualità di paziente, dichiara di:
1. Essere stato/a informato/a in modo chiaro e comprensibile riguardo alla natura, le finalità, le modalità e i possibili rischi dell'indagine diagnostica a cui si sottopone.
2. Aver avuto la possibilità di porre domande e ricevere risposte esaurienti.
3. Acconsentire al trattamento dei propri dati personali e sanitari, incluse le immagini diagnostiche, in conformità al Regolamento UE 2016/679 (GDPR).
4. Autorizzare la conservazione delle immagini diagnostiche nel sistema Andromeda e la loro eventuale condivisione con altri professionisti sanitari.`;

    if (modalita === 'MR' || modalita === 'RM') {
        return base + `\n\n[ DICHIARAZIONE SPECIFICA: RISONANZA MAGNETICA (RM) ]
5. Dichiara di NON essere portatore di pacemaker cardiaco, neurostimolatori, clip aneurismatiche ferromagnetici, o altri frammenti metallici nel corpo che costituiscono controindicazione assoluta all'esame RM.
6. Dichiara di aver rimosso gioielli, orologi, carte di credito, monete e ogni altro oggetto metallico prima di entrare in sala.`;
    }
    if (modalita === 'CT' || modalita === 'TC') {
        return base + `\n\n[ DICHIARAZIONE SPECIFICA: TOMOGRAFIA COMPUTERIZZATA (TC) ]
5. Dichiara di essere a conoscenza dell'impiego di radiazioni ionizzanti necessarie all'esecuzione dell'esame TC.
6. (Se paziente di sesso femminile in età fertile) Dichiara di NON essere in stato di gravidanza o di averne informato in precedenza il Medico Radiologo.`;
    }
    if (modalita === 'CR' || modalita === 'DX' || modalita === 'RX') {
        return base + `\n\n[ DICHIARAZIONE SPECIFICA: RADIOLOGIA TRADIZIONALE (RX) ]
5. Dichiara di essere a conoscenza dell'impiego di radiazioni ionizzanti necessarie all'esecuzione dell'indagine.
6. (Se paziente di sesso femminile in età fertile) Dichiara di NON essere in stato di gravidanza.`;
    }

    return base + `\n\n5. La presente autorizzazione può essere revocata in qualsiasi momento mediante comunicazione scritta.`;
};
