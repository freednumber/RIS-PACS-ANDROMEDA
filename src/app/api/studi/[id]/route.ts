import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { id } = await params;

    const studio = await prisma.study.findUnique({
        where: { id },
        include: {
            patient: true,
            medicoRichiedente: { select: { id: true, nome: true, cognome: true, specializzazione: true } },
            medicoRefertante: { select: { id: true, nome: true, cognome: true, specializzazione: true } },
            series: {
                include: {
                    instances: {
                        orderBy: { instanceNumber: 'asc' },
                    },
                },
                orderBy: { seriesNumber: 'asc' },
            },
            firme: {
                orderBy: { createdAt: 'desc' },
            },
            shareTokens: {
                where: { attivo: true },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!studio) {
        return NextResponse.json(
            { success: false, error: 'Studio non trovato' },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, data: studio });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await request.json();

        const updateData: Record<string, unknown> = {};
        if (body.descrizione !== undefined) updateData.descrizione = body.descrizione;
        if (body.stato !== undefined) updateData.stato = body.stato;
        if (body.referto !== undefined) {
            updateData.referto = body.referto;
            updateData.medicoRefertanteId = user.id;
            updateData.dataReferto = new Date();
            if (body.stato === undefined) updateData.stato = 'REFERTATO';
        }
        if (body.note !== undefined) updateData.note = body.note;
        if (body.sedeEsame !== undefined) updateData.sedeEsame = body.sedeEsame;
        if (body.bodyPart !== undefined) updateData.bodyPart = body.bodyPart;

        const studio = await prisma.study.update({
            where: { id },
            data: updateData,
            include: {
                patient: { select: { id: true, nome: true, cognome: true } },
            },
        });

        return NextResponse.json({ success: true, data: studio });
    } catch (error) {
        console.error('Update study error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nell\'aggiornamento dello studio' },
            { status: 500 }
        );
    }
}
