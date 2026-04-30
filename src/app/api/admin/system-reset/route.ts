import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'dicom');

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    
    // Safety check: Only ADMIN can perform this action
    if (!user || user.ruolo !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Non autorizzato. Solo gli amministratori possono resettare il sistema.' }, { status: 403 });
    }

    try {
        console.warn(`[SYSTEM RESET] Triggered by ${user.nome} ${user.cognome} (${user.email})`);

        // 1. Physical File Deletion
        try {
            await rm(UPLOAD_DIR, { recursive: true, force: true });
            await mkdir(UPLOAD_DIR, { recursive: true });
            console.log('[SYSTEM RESET] DICOM files cleared');
        } catch (fileErr) {
            console.error('[SYSTEM RESET] Error clearing files:', fileErr);
        }

        // 2. Database Wipe (Ordered to respect relations)
        // We use transaction to ensure atomicity, although SQLite has limitations
        await prisma.$transaction([
            prisma.signature.deleteMany({}),
            prisma.shareToken.deleteMany({}),
            prisma.aIAnalysis.deleteMany({}),
            prisma.caseAnnotation.deleteMany({}),
            prisma.caseStudy.deleteMany({}),
            prisma.instance.deleteMany({}),
            prisma.series.deleteMany({}),
            prisma.study.deleteMany({}),
            prisma.prenotazione.deleteMany({}),
            prisma.patient.deleteMany({}),
        ]);

        console.log('[SYSTEM RESET] Clinical database records cleared');

        return NextResponse.json({ 
            success: true, 
            message: 'Sistema resettato correttamente. Tutti i dati clinici e i file DICOM sono stati rimossi.' 
        });

    } catch (error) {
        console.error('[SYSTEM RESET] Critical failure:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Errore critico durante il reset del sistema.' 
        }, { status: 500 });
    }
}
