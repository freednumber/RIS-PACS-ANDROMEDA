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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = search
        ? {
            OR: [
                { nome: { contains: search } },
                { cognome: { contains: search } },
                { codiceFiscale: { contains: search } },
            ],
        }
        : {};

    const [pazienti, total] = await Promise.all([
        prisma.patient.findMany({
            where,
            include: {
                _count: { select: { studi: true, firme: true } },
            },
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.patient.count({ where }),
    ]);

    return NextResponse.json({
        success: true,
        data: pazienti,
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
        const {
            codiceFiscale, nome, cognome, dataNascita, sesso,
            luogoNascita, indirizzo, citta, cap, provincia,
            telefono, email, note,
        } = body;

        if (!codiceFiscale || !nome || !cognome || !dataNascita || !sesso) {
            return NextResponse.json(
                { success: false, error: 'Campi obbligatori mancanti' },
                { status: 400 }
            );
        }

        const existing = await prisma.patient.findUnique({ where: { codiceFiscale } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Paziente con questo codice fiscale già esistente' },
                { status: 400 }
            );
        }

        const paziente = await prisma.patient.create({
            data: {
                codiceFiscale: codiceFiscale.toUpperCase(),
                nome,
                cognome,
                dataNascita: new Date(dataNascita),
                sesso,
                luogoNascita,
                indirizzo,
                citta,
                cap,
                provincia,
                telefono,
                email,
                note,
            },
        });

        return NextResponse.json({ success: true, data: paziente }, { status: 201 });
    } catch (error) {
        console.error('Create patient error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nella creazione del paziente' },
            { status: 500 }
        );
    }
}
