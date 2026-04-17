import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
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
        const { stato, dataDesiderata } = body;

        const updateData: Record<string, unknown> = {};

        if (stato) {
            updateData.stato = stato;
        }

        if (dataDesiderata) {
            updateData.dataDesiderata = new Date(dataDesiderata);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: 'Nessun campo da aggiornare' },
                { status: 400 }
            );
        }

        const prenotazione = await prisma.prenotazione.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: prenotazione });
    } catch (error) {
        console.error('Update prenotazione error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nell\'aggiornamento della prenotazione' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const prenotazione = await prisma.prenotazione.findUnique({
            where: { id },
        });

        if (!prenotazione) {
            return NextResponse.json(
                { success: false, error: 'Prenotazione non trovata' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: prenotazione });
    } catch (error) {
        console.error('Get prenotazione error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nel recupero della prenotazione' },
            { status: 500 }
        );
    }
}
