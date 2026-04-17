import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        // Find the patient linked to this user email
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { codiceFiscale: user.email.toUpperCase() },
                ],
            },
        });

        if (!patient) {
            // Return mock data if no patient found (for demo purposes)
            return NextResponse.json({
                success: true,
                data: {
                    upcoming: [
                        {
                            id: 'mock-1',
                            tipo: 'MR',
                            descrizione: 'RM Cranio',
                            data: '2026-04-20T10:30:00.000Z',
                            struttura: 'Centro RM Parioli',
                            stato: 'CONFERMATO',
                            medico: 'Dr. Bianchi',
                        },
                        {
                            id: 'mock-2',
                            tipo: 'CR',
                            descrizione: 'RX Torace',
                            data: '2026-04-28T14:00:00.000Z',
                            struttura: 'Centro Diagnostico Roma Nord',
                            stato: 'IN_ATTESA',
                            medico: 'Dr.ssa Verdi',
                        },
                    ],
                    completed: [
                        {
                            id: 'mock-3',
                            tipo: 'CT',
                            descrizione: 'TC Addome',
                            data: '2026-03-10T09:00:00.000Z',
                            struttura: 'Clinica Villa Serena',
                            stato: 'COMPLETATO',
                            refertoDisponibile: true,
                            medico: 'Dr. Neri',
                        },
                    ],
                },
            });
        }

        const now = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        // Get upcoming exams from studies
        const upcomingStudies = await prisma.study.findMany({
            where: {
                patientId: patient.id,
                dataStudio: { gte: now, lte: thirtyDaysLater },
                stato: { in: ['IN_CORSO', 'COMPLETATO'] },
            },
            include: {
                medicoRefertante: { select: { nome: true, cognome: true } },
            },
            orderBy: { dataStudio: 'asc' },
        });

        // Get upcoming exams from prenotazioni
        const upcomingPrenotazioni = await prisma.prenotazione.findMany({
            where: {
                pazienteId: patient.id,
                dataDesiderata: { gte: now },
                stato: { in: ['IN_ATTESA', 'CONFERMATO'] },
            },
            orderBy: { dataDesiderata: 'asc' },
        });

        // Get completed exams (last 3)
        const completedStudies = await prisma.study.findMany({
            where: {
                patientId: patient.id,
                stato: { in: ['REFERTATO', 'FIRMATO', 'COMPLETATO'] },
            },
            include: {
                medicoRefertante: { select: { nome: true, cognome: true } },
            },
            orderBy: { dataStudio: 'desc' },
            take: 3,
        });

        const upcoming = [
            ...upcomingStudies.map(s => ({
                id: s.id,
                tipo: s.modalita,
                descrizione: s.descrizione || `${s.modalita} ${s.bodyPart || ''}`.trim(),
                data: s.dataStudio.toISOString(),
                struttura: s.sedeEsame || 'N/D',
                stato: 'CONFERMATO',
                medico: s.medicoRefertante ? `Dr. ${s.medicoRefertante.cognome}` : undefined,
            })),
            ...upcomingPrenotazioni.map(p => ({
                id: p.id,
                tipo: p.tipoEsame,
                descrizione: p.descrizioneEsame || p.tipoEsame,
                data: p.dataDesiderata.toISOString(),
                struttura: p.struttura,
                stato: p.stato,
                medico: undefined,
            })),
        ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

        const completed = completedStudies.map(s => ({
            id: s.id,
            tipo: s.modalita,
            descrizione: s.descrizione || `${s.modalita} ${s.bodyPart || ''}`.trim(),
            data: s.dataStudio.toISOString(),
            struttura: s.sedeEsame || 'N/D',
            stato: s.stato,
            refertoDisponibile: !!s.referto,
            medico: s.medicoRefertante ? `Dr. ${s.medicoRefertante.cognome}` : undefined,
        }));

        return NextResponse.json({ success: true, data: { upcoming, completed } });
    } catch (error) {
        console.error('Patient exams error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero degli esami' }, { status: 500 });
    }
}
