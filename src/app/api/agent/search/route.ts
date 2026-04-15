import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callGemini } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ success: false, error: 'La query è obbligatoria' }, { status: 400 });
        }

        // Use AI to extract structured search criteria from natural language
        const extractionPrompt = `Estrai criteri di ricerca strutturati dalla seguente query in linguaggio naturale.
Rispondi SOLO con un JSON valido (senza markdown, senza \`\`\`), con questi campi opzionali:
- modalita: codice DICOM (CR, CT, MR, US, XA, MG, NM, PT, DX, RF, OT) o null
- bodyPart: parte del corpo in inglese uppercase (CHEST, HEAD, ABDOMEN, SPINE, KNEE, etc.) o null
- stato: stato studio (IN_CORSO, COMPLETATO, REFERTATO, FIRMATO) o null
- priorita: priorità (URGENTE, NORMALE, BASSA) o null
- keywords: array di parole chiave rilevanti per la ricerca nei campi testo
- patientName: nome paziente se menzionato, o null

Query: "${query}"`;

        const aiResponse = await callGemini(extractionPrompt);

        let searchCriteria;
        try {
            // Try to parse AI response as JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            searchCriteria = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
            searchCriteria = {};
        }

        // Build Prisma where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (searchCriteria.modalita) {
            where.modalita = searchCriteria.modalita;
        }
        if (searchCriteria.bodyPart) {
            where.bodyPart = { contains: searchCriteria.bodyPart };
        }
        if (searchCriteria.stato) {
            where.stato = searchCriteria.stato;
        }
        if (searchCriteria.priorita) {
            where.priorita = searchCriteria.priorita;
        }
        if (searchCriteria.patientName) {
            where.patient = {
                OR: [
                    { nome: { contains: searchCriteria.patientName } },
                    { cognome: { contains: searchCriteria.patientName } },
                ],
            };
        }
        if (searchCriteria.keywords?.length > 0) {
            where.OR = searchCriteria.keywords.flatMap((kw: string) => [
                { descrizione: { contains: kw } },
                { referto: { contains: kw } },
                { note: { contains: kw } },
            ]);
        }

        const studies = await prisma.study.findMany({
            where,
            include: {
                patient: {
                    select: { id: true, nome: true, cognome: true, codiceFiscale: true },
                },
                medicoRichiedente: {
                    select: { id: true, nome: true, cognome: true },
                },
                medicoRefertante: {
                    select: { id: true, nome: true, cognome: true },
                },
                _count: { select: { series: true, firme: true } },
            },
            orderBy: { dataStudio: 'desc' },
            take: 50,
        });

        return NextResponse.json({
            success: true,
            data: {
                query,
                criteria: searchCriteria,
                results: studies,
                totalResults: studies.length,
            },
        });
    } catch (error) {
        console.error('AI search error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella ricerca' }, { status: 500 });
    }
}
