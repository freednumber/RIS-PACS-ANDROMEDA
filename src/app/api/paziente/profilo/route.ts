import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        // Find patient by user email
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { codiceFiscale: user.email.toUpperCase() },
                ],
            },
        });

        if (!patient) {
            // Return mock profile for demo
            return NextResponse.json({
                success: true,
                data: {
                    id: 'mock',
                    nome: user.nome,
                    cognome: user.cognome,
                    codiceFiscale: 'RSSMRA80A01H501Z',
                    dataNascita: '1980-01-01T00:00:00.000Z',
                    sesso: 'M',
                    email: user.email,
                    telefono: '+39 333 1234567',
                    indirizzo: null,
                    citta: null,
                    cap: null,
                    provincia: null,
                },
            });
        }

        return NextResponse.json({ success: true, data: patient });
    } catch (error) {
        console.error('Get patient profile error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero del profilo' }, { status: 500 });
    }
}
