import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { studyId, email, descrizione, durata } = body;

        if (!studyId) {
            return NextResponse.json(
                { success: false, error: 'ID studio obbligatorio' },
                { status: 400 }
            );
        }

        // Set expiration (default 7 days)
        const scadenza = new Date();
        scadenza.setDate(scadenza.getDate() + (durata || 7));

        const shareToken = await prisma.shareToken.create({
            data: {
                studyId,
                email,
                descrizione: descrizione || 'Condivisione studio radiologico',
                scadenza,
            },
        });

        const shareUrl = `${request.nextUrl.origin}/condividi/${shareToken.token}`;

        return NextResponse.json({
            success: true,
            data: {
                ...shareToken,
                shareUrl,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Share error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nella creazione del link di condivisione' },
            { status: 500 }
        );
    }
}
