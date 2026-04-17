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

    const paziente = await prisma.patient.findUnique({
        where: { id },
        include: {
          studi: {
            include: {
              series: {
                take: 1,
                include: {
                  instances: {
                    take: 3,
                    select: { id: true }
                  }
                }
              }
            },
            orderBy: { dataStudio: 'desc' },
          },
          firme: {
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { studi: true, firme: true } },
        },

    });

    if (!paziente) {
        return NextResponse.json(
            { success: false, error: 'Paziente non trovato' },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, data: paziente });
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
        const paziente = await prisma.patient.update({
            where: { id },
            data: {
                ...body,
                dataNascita: body.dataNascita ? new Date(body.dataNascita) : undefined,
                codiceFiscale: body.codiceFiscale?.toUpperCase(),
            },
        });

        return NextResponse.json({ success: true, data: paziente });
    } catch (error) {
        console.error('Update patient error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nell\'aggiornamento del paziente' },
            { status: 500 }
        );
    }
}
