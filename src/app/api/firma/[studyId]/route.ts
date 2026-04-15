import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ studyId: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { studyId } = await params;

    try {
        const body = await request.json();
        const { firmaData, consenso } = body;

        if (!firmaData || !consenso) {
            return NextResponse.json(
                { success: false, error: 'Firma e consenso sono obbligatori' },
                { status: 400 }
            );
        }

        // Get the study to find the patient
        const studio = await prisma.study.findUnique({
            where: { id: studyId },
            select: { patientId: true },
        });

        if (!studio) {
            return NextResponse.json(
                { success: false, error: 'Studio non trovato' },
                { status: 404 }
            );
        }

        // Get client info
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0] || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        const firma = await prisma.signature.create({
            data: {
                patientId: studio.patientId,
                studyId,
                firmaData,
                consenso,
                ipAddress: ip,
                userAgent,
            },
        });

        // Update study status to FIRMATO
        await prisma.study.update({
            where: { id: studyId },
            data: { stato: 'FIRMATO' },
        });

        return NextResponse.json({ success: true, data: firma }, { status: 201 });
    } catch (error) {
        console.error('Signature error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nel salvataggio della firma' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ studyId: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    const { studyId } = await params;

    const firme = await prisma.signature.findMany({
        where: { studyId },
        include: {
            patient: { select: { nome: true, cognome: true, codiceFiscale: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: firme });
}
