import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { id } = await params;

        const caseStudy = await prisma.caseStudy.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, nome: true, cognome: true } },
                study: {
                    select: {
                        id: true,
                        modalita: true,
                        bodyPart: true,
                        descrizione: true,
                        referto: true,
                        stato: true,
                        dataStudio: true,
                        patient: { select: { nome: true, cognome: true, sesso: true } },
                    },
                },
                annotazioni: {
                    include: {
                        user: { select: { id: true, nome: true, cognome: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!caseStudy) {
            return NextResponse.json({ success: false, error: 'Caso non trovato' }, { status: 404 });
        }

        // Increment view count
        await prisma.caseStudy.update({
            where: { id },
            data: { visualizzazioni: { increment: 1 } },
        });

        return NextResponse.json({
            success: true,
            data: { ...caseStudy, tags: caseStudy.tags ? JSON.parse(caseStudy.tags) : [] },
        });
    } catch (error) {
        console.error('Case fetch error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero del caso' }, { status: 500 });
    }
}

// Add annotation to a case study
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { id } = await params;
        const { contenuto, tipo } = await req.json();

        if (!contenuto) {
            return NextResponse.json({ success: false, error: 'Il contenuto è obbligatorio' }, { status: 400 });
        }

        // Verify case exists
        const caseStudy = await prisma.caseStudy.findUnique({ where: { id } });
        if (!caseStudy) {
            return NextResponse.json({ success: false, error: 'Caso non trovato' }, { status: 404 });
        }

        const annotation = await prisma.caseAnnotation.create({
            data: {
                caseStudyId: id,
                userId: user.id,
                contenuto,
                tipo: tipo || 'COMMENTO',
            },
            include: {
                user: { select: { id: true, nome: true, cognome: true } },
            },
        });

        return NextResponse.json({
            success: true,
            data: annotation,
            message: 'Annotazione aggiunta',
        });
    } catch (error) {
        console.error('Annotation create error:', error);
        return NextResponse.json({ success: false, error: 'Errore nell\'aggiunta dell\'annotazione' }, { status: 500 });
    }
}
