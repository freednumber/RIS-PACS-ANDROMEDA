import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;

    const shareToken = await prisma.shareToken.findUnique({
        where: { token },
        include: {
            study: {
                include: {
                    patient: { select: { nome: true, cognome: true, dataNascita: true, sesso: true } },
                    medicoRichiedente: { select: { nome: true, cognome: true, specializzazione: true } },
                    medicoRefertante: { select: { nome: true, cognome: true, specializzazione: true } },
                    series: {
                        include: {
                            instances: { orderBy: { instanceNumber: 'asc' } },
                        },
                        orderBy: { seriesNumber: 'asc' },
                    },
                    firme: {
                        select: { createdAt: true },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            },
        },
    });

    if (!shareToken) {
        return NextResponse.json(
            { success: false, error: 'Link non valido' },
            { status: 404 }
        );
    }

    if (!shareToken.attivo) {
        return NextResponse.json(
            { success: false, error: 'Link disattivato' },
            { status: 403 }
        );
    }

    if (new Date() > shareToken.scadenza) {
        return NextResponse.json(
            { success: false, error: 'Link scaduto' },
            { status: 403 }
        );
    }

    if (shareToken.accessCount >= shareToken.maxAccess) {
        return NextResponse.json(
            { success: false, error: 'Numero massimo di accessi raggiunto' },
            { status: 403 }
        );
    }

    // Increment access count
    await prisma.shareToken.update({
        where: { token },
        data: { accessCount: { increment: 1 } },
    });

    return NextResponse.json({
        success: true,
        data: shareToken.study,
    });
}
