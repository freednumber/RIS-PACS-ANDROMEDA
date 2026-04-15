import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chatWithAgent } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { message, studyId } = await req.json();

        if (!message) {
            return NextResponse.json({ success: false, error: 'Il messaggio è obbligatorio' }, { status: 400 });
        }

        let studyContext;
        if (studyId) {
            const study = await prisma.study.findUnique({
                where: { id: studyId },
                select: {
                    modalita: true,
                    bodyPart: true,
                    descrizione: true,
                    referto: true,
                },
            });

            if (study) {
                studyContext = study;
            }
        }

        const response = await chatWithAgent(message, studyContext || undefined);

        return NextResponse.json({
            success: true,
            data: {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Agent chat error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella comunicazione con l\'agente' }, { status: 500 });
    }
}
