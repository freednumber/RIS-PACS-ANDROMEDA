import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
        totalePazienti,
        totaleStudi,
        studiOggi,
        studiDaRefertare,
        studiDaFirmare,
        ultimiStudi,
    ] = await Promise.all([
        prisma.patient.count(),
        prisma.study.count(),
        prisma.study.count({
            where: {
                dataStudio: { gte: today, lt: tomorrow },
            },
        }),
        prisma.study.count({ where: { stato: 'COMPLETATO' } }),
        prisma.study.count({ where: { stato: 'REFERTATO' } }),
        prisma.study.findMany({
            take: 10,
            orderBy: { dataStudio: 'desc' },
            include: {
                patient: { select: { id: true, nome: true, cognome: true, codiceFiscale: true } },
                medicoRichiedente: { select: { id: true, nome: true, cognome: true } },
                medicoRefertante: { select: { id: true, nome: true, cognome: true } },
                _count: { select: { series: true, firme: true } },
            },
        }),
    ]);

    return NextResponse.json({
        success: true,
        data: {
            totalePazienti,
            totaleStudi,
            studiOggi,
            studiDaRefertare,
            studiDaFirmare,
            ultimiStudi,
        },
    });
}
