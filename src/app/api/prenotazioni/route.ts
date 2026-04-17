import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        // Find the patient linked to this user
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { codiceFiscale: user.email.toUpperCase() },
                ],
            },
        });

        if (!patient) {
            return NextResponse.json({ success: true, data: [] });
        }

        const prenotazioni = await prisma.prenotazione.findMany({
            where: { pazienteId: patient.id },
            orderBy: { dataDesiderata: 'desc' },
        });

        return NextResponse.json({ success: true, data: prenotazioni });
    } catch (error) {
        console.error('List prenotazioni error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero delle prenotazioni' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { tipoEsame, struttura, dataDesiderata, note } = body;

        if (!tipoEsame || !struttura || !dataDesiderata) {
            return NextResponse.json(
                { success: false, error: 'Campi obbligatori mancanti (tipoEsame, struttura, dataDesiderata)' },
                { status: 400 }
            );
        }

        // Find patient
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { codiceFiscale: user.email.toUpperCase() },
                ],
            },
        });

        const pazienteId = patient?.id || user.id;

        // Generate booking code
        const codicePrenotazione = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Map exam type descriptions
        const descrizioniEsame: Record<string, string> = {
            'RM': 'Risonanza Magnetica',
            'TC': 'Tomografia Computerizzata',
            'RX': 'Radiografia',
            'ECO': 'Ecografia',
            'MG': 'Mammografia',
            'MOC': 'Densitometria Ossea (MOC)',
        };

        const prenotazione = await prisma.prenotazione.create({
            data: {
                pazienteId,
                tipoEsame,
                descrizioneEsame: descrizioniEsame[tipoEsame] || tipoEsame,
                struttura,
                dataDesiderata: new Date(dataDesiderata),
                stato: 'IN_ATTESA',
                note: note || null,
                codicePrenotazione,
            },
        });

        return NextResponse.json({ success: true, data: prenotazione }, { status: 201 });
    } catch (error) {
        console.error('Create prenotazione error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nella creazione della prenotazione' },
            { status: 500 }
        );
    }
}
