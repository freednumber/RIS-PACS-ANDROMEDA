import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const categoria = searchParams.get('categoria');
        const difficolta = searchParams.get('difficolta');
        const search = searchParams.get('search');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { pubblicato: true };

        if (categoria) where.categoria = categoria;
        if (difficolta) where.difficolta = difficolta;
        if (search) {
            where.OR = [
                { titolo: { contains: search } },
                { descrizione: { contains: search } },
            ];
        }

        const cases = await prisma.caseStudy.findMany({
            where,
            include: {
                user: { select: { id: true, nome: true, cognome: true } },
                study: {
                    select: {
                        id: true,
                        modalita: true,
                        bodyPart: true,
                        patient: { select: { nome: true, cognome: true } },
                    },
                },
                _count: { select: { annotazioni: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        // Parse tags from JSON string
        const casesWithParsedTags = cases.map((c) => ({
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : [],
        }));

        return NextResponse.json({ success: true, data: casesWithParsedTags });
    } catch (error) {
        console.error('Cases fetch error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero dei casi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { studyId, titolo, descrizione, categoria, difficolta, tags, pubblicato } = await req.json();

        if (!studyId || !titolo || !descrizione || !categoria) {
            return NextResponse.json({ success: false, error: 'Campi obbligatori: studyId, titolo, descrizione, categoria' }, { status: 400 });
        }

        // Verify study exists
        const study = await prisma.study.findUnique({ where: { id: studyId } });
        if (!study) {
            return NextResponse.json({ success: false, error: 'Studio non trovato' }, { status: 404 });
        }

        const caseStudy = await prisma.caseStudy.create({
            data: {
                studyId,
                userId: user.id,
                titolo,
                descrizione,
                categoria,
                difficolta: difficolta || 'INTERMEDIO',
                tags: tags ? JSON.stringify(tags) : null,
                pubblicato: pubblicato ?? false,
            },
            include: {
                user: { select: { id: true, nome: true, cognome: true } },
                study: {
                    select: {
                        id: true,
                        modalita: true,
                        bodyPart: true,
                        patient: { select: { nome: true, cognome: true } },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: { ...caseStudy, tags: caseStudy.tags ? JSON.parse(caseStudy.tags) : [] },
            message: 'Caso studio creato con successo',
        });
    } catch (error) {
        console.error('Case create error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella creazione del caso' }, { status: 500 });
    }
}
