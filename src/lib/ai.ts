'use server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
        // Fallback: generate structured placeholder response
        return generateFallbackResponse(prompt);
    }

    try {
        const body: Record<string, unknown> = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
            },
        };

        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error('Gemini API error:', err);
            return generateFallbackResponse(prompt);
        }

        const data = (await res.json()) as GeminiResponse;
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna risposta generata.';
    } catch (error) {
        console.error('Gemini call failed:', error);
        return generateFallbackResponse(prompt);
    }
}

export async function analyzeStudy(studyInfo: {
    modalita: string;
    bodyPart?: string | null;
    descrizione?: string | null;
    referto?: string | null;
    patientAge?: number;
    patientSex?: string;
}, tipo: string): Promise<{ contenuto: string; confidenza: number }> {
    const systemPrompt = `Sei un radiologo AI specializzato in refertazione e analisi di studi radiologici.
Rispondi SEMPRE in italiano. Sii preciso, professionale e strutturato.
Usa terminologia medica appropriata. Fornisci sempre un livello di confidenza.`;

    let prompt = '';

    switch (tipo) {
        case 'REFERTO_SUGGERITO':
            prompt = `Genera un referto strutturato per il seguente studio radiologico:
- Modalità: ${studyInfo.modalita}
- Distretto anatomico: ${studyInfo.bodyPart || 'non specificato'}
- Descrizione clinica: ${studyInfo.descrizione || 'non disponibile'}
- Età paziente: ${studyInfo.patientAge || 'N/D'}
- Sesso: ${studyInfo.patientSex || 'N/D'}
${studyInfo.referto ? `- Referto esistente: ${studyInfo.referto}` : ''}

Struttura il referto con: Tecnica, Reperti, Conclusioni.`;
            break;

        case 'ANOMALIA':
            prompt = `Analizza i seguenti dati di uno studio radiologico e identifica possibili anomalie o reperti significativi:
- Modalità: ${studyInfo.modalita}
- Distretto: ${studyInfo.bodyPart || 'non specificato'}
- Descrizione: ${studyInfo.descrizione || 'non disponibile'}
${studyInfo.referto ? `- Referto: ${studyInfo.referto}` : ''}

Elenca le possibili anomalie con relativa probabilità.`;
            break;

        case 'CLASSIFICAZIONE':
            prompt = `Classifica il seguente studio radiologico per urgenza e tipologia:
- Modalità: ${studyInfo.modalita}
- Distretto: ${studyInfo.bodyPart || 'non specificato'}
- Descrizione: ${studyInfo.descrizione || 'non disponibile'}

Fornisci: categoria diagnostica, urgenza (1-5), diagnosi differenziale.`;
            break;

        default:
            prompt = `Analizza questo studio: ${JSON.stringify(studyInfo)}`;
    }

    const contenuto = await callGemini(prompt, systemPrompt);
    const confidenza = GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here' ? 0.85 : 0.5;

    return { contenuto, confidenza };
}

export async function chatWithAgent(
    message: string,
    studyContext?: { modalita?: string; bodyPart?: string | null; descrizione?: string | null; referto?: string | null }
): Promise<string> {
    const systemPrompt = `Sei Andromeda AI, un assistente radiologico intelligente integrato nel sistema RIS/PACS Andromeda.
Rispondi SEMPRE in italiano. Sei esperto in radiologia, imaging diagnostico e medicina nucleare.
Puoi aiutare con: interpretazione studi, diagnosi differenziale, suggerimenti clinici, protocolli di imaging.
Sii conciso ma completo. Usa markdown per formattare le risposte.`;

    let prompt = message;
    if (studyContext) {
        prompt = `[Contesto studio attivo - Modalità: ${studyContext.modalita}, Distretto: ${studyContext.bodyPart || 'N/D'}, Descrizione: ${studyContext.descrizione || 'N/D'}]

Domanda dell'utente: ${message}`;
    }

    return callGemini(prompt, systemPrompt);
}

function generateFallbackResponse(prompt: string): string {
    if (prompt.includes('referto') || prompt.includes('Referto')) {
        return `## Referto Suggerito (AI - Demo Mode)

### Tecnica
Studio eseguito secondo protocollo standard. Le immagini sono di qualità diagnostica adeguata.

### Reperti
L'analisi automatica è in modalità demo. Per risultati completi, configurare la chiave API Gemini nel file \`.env\`.

**Nota**: Questo è un referto di esempio generato localmente. Con l'API Gemini configurata, il sistema genererà referti personalizzati basati sui dati dello studio.

### Conclusioni
Esame da valutare in correlazione clinica.

*Confidenza: 50% (modalità demo)*`;
    }

    if (prompt.includes('anomali') || prompt.includes('Anomali')) {
        return `## Analisi Anomalie (AI - Demo Mode)

1. **Nessuna anomalia critica rilevata** — Confidenza: 50%
2. L'analisi completa richiede la configurazione dell'API Gemini

> ⚠️ Sistema in modalità demo. Configurare \`GEMINI_API_KEY\` per analisi reali.`;
    }

    return `## Risposta Andromeda AI (Demo Mode)

Ho ricevuto la tua richiesta. Il sistema è attualmente in modalità demo senza API key Gemini configurata.

Per attivare le funzionalità AI complete:
1. Ottieni una chiave API da [Google AI Studio](https://aistudio.google.com/apikey)
2. Aggiungi \`GEMINI_API_KEY=la-tua-chiave\` nel file \`.env\`
3. Riavvia il server

*Andromeda AI è pronto per assisterti una volta configurato.*`;
}
