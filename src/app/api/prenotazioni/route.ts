import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Create a new Prenotazione (Patient creates an appointment request)
export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.ruolo !== 'PAZIENTE') {
        return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }

    try {
        const body = await request.json();
        
        // Find patient record
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { codiceFiscale: user.email.toUpperCase() },
                ],
            },
        });

        if (!patient) {
            return NextResponse.json({ success: false, error: 'Profilo paziente non trovato' }, { status: 404 });
        }

        const prenotazione = await prisma.prenotazione.create({
            data: {
                pazienteId: patient.id,
                tipoEsame: body.tipoEsame,
                descrizioneEsame: body.descrizioneEsame,
                struttura: body.struttura || 'Andromeda General Hospital',
                dataDesiderata: new Date(body.dataDesiderata),
                stato: 'IN_ATTESA',
                note: body.note || null,
                codicePrenotazione: `AND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            }
        });

        return NextResponse.json({ success: true, data: prenotazione });
    } catch (error) {
        console.error('Create prenotazione error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella creazione della prenotazione' }, { status: 500 });
    }
}

// Get all Prenotazioni (Segreteria sees requests)
export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user || (user.ruolo !== 'SEGRETERIA' && user.ruolo !== 'ADMIN')) {
        return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }

    try {
        const prenotazioni = await prisma.prenotazione.findMany({
            where: {
                // Focus on pending and proposed, others are in history
                stato: { in: ['IN_ATTESA', 'PROPOSTA_ALTERNA', 'CONFERMATO'] }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Fetch patient info for each prenotazione
        const withPatientInfo = await Promise.all(
            prenotazioni.map(async (p) => {
                const pat = await prisma.patient.findUnique({ where: { id: p.pazienteId }, select: { nome: true, cognome: true, codiceFiscale: true } });
                return { ...p, paziente: pat };
            })
        );

        return NextResponse.json({ success: true, data: withPatientInfo });
    } catch (error) {
         console.error('Fetch prenotazioni error:', error);
         return NextResponse.json({ success: false, error: 'Errore nel recupero delle prenotazioni' }, { status: 500 });
    }
}
