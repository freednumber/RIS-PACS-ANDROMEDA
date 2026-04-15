import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeStudy } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { studyId, tipo } = await req.json();

        if (!studyId || !tipo) {
            return NextResponse.json({ success: false, error: 'studyId e tipo sono obbligatori' }, { status: 400 });
        }

        const study = await prisma.study.findUnique({
            where: { id: studyId },
            include: {
                patient: true,
            },
        });

        if (!study) {
            return NextResponse.json({ success: false, error: 'Studio non trovato' }, { status: 404 });
        }

        // Calculate patient age
        const birthDate = new Date(study.patient.dataNascita);
        const today = new Date();
        const patientAge = today.getFullYear() - birthDate.getFullYear();

        const { contenuto, confidenza } = await analyzeStudy(
            {
                modalita: study.modalita,
                bodyPart: study.bodyPart,
                descrizione: study.descrizione,
                referto: study.referto,
                patientAge,
                patientSex: study.patient.sesso,
            },
            tipo
        );

        const analysis = await prisma.aIAnalysis.create({
            data: {
                studyId,
                userId: user.id,
                tipo,
                contenuto,
                confidenza,
                stato: 'COMPLETATO',
            },
        });

        return NextResponse.json({ success: true, data: analysis });
    } catch (error) {
        console.error('AI analyze error:', error);
        return NextResponse.json({ success: false, error: 'Errore durante l\'analisi AI' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studyId = searchParams.get('studyId');

        if (!studyId) {
            return NextResponse.json({ success: false, error: 'studyId è obbligatorio' }, { status: 400 });
        }

        const analyses = await prisma.aIAnalysis.findMany({
            where: { studyId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: analyses });
    } catch (error) {
        console.error('AI analyses fetch error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero delle analisi' }, { status: 500 });
    }
}
