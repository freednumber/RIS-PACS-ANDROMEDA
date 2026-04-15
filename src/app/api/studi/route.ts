import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const stato = searchParams.get('stato') || '';
    const modalita = searchParams.get('modalita') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (stato) where.stato = stato;
    if (modalita) where.modalita = modalita;
    if (search) {
        where.OR = [
            { descrizione: { contains: search } },
            { accessionNumber: { contains: search } },
            { patient: { nome: { contains: search } } },
            { patient: { cognome: { contains: search } } },
            { patient: { codiceFiscale: { contains: search } } },
        ];
    }

    const [studi, total] = await Promise.all([
        prisma.study.findMany({
            where,
            include: {
                patient: { select: { id: true, nome: true, cognome: true, codiceFiscale: true } },
                medicoRichiedente: { select: { id: true, nome: true, cognome: true } },
                medicoRefertante: { select: { id: true, nome: true, cognome: true } },
                _count: { select: { series: true, firme: true } },
            },
            orderBy: { dataStudio: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.study.count({ where }),
    ]);

    return NextResponse.json({
        success: true,
        data: studi,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
}

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { patientId, descrizione, modalita, bodyPart, sedeEsame, priorita, note } = body;

        if (!patientId || !modalita) {
            return NextResponse.json(
                { success: false, error: 'Paziente e modalità sono obbligatori' },
                { status: 400 }
            );
        }

        const studio = await prisma.study.create({
            data: {
                patientId,
                medicoRichiedenteId: user.id,
                descrizione,
                modalita,
                bodyPart,
                sedeEsame,
                priorita: priorita || 'NORMALE',
                note,
            },
            include: {
                patient: { select: { id: true, nome: true, cognome: true, codiceFiscale: true } },
                medicoRichiedente: { select: { id: true, nome: true, cognome: true } },
            },
        });

        return NextResponse.json({ success: true, data: studio }, { status: 201 });
    } catch (error) {
        console.error('Create study error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nella creazione dello studio' },
            { status: 500 }
        );
    }
}
