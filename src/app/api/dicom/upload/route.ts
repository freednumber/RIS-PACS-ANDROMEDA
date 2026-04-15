import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'dicom');

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const studyId = formData.get('studyId') as string;
        const files = formData.getAll('files') as File[];

        if (!studyId || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Studio ID e file sono obbligatori' },
                { status: 400 }
            );
        }

        // Check study exists
        const studio = await prisma.study.findUnique({
            where: { id: studyId },
            include: { series: true },
        });

        if (!studio) {
            return NextResponse.json(
                { success: false, error: 'Studio non trovato' },
                { status: 404 }
            );
        }

        // Create or get default series
        let series = studio.series[0];
        if (!series) {
            series = await prisma.series.create({
                data: {
                    studyId,
                    descrizione: 'Serie Principale',
                    modalita: studio.modalita,
                },
            });
        }

        // Create upload directory
        const studyDir = join(UPLOAD_DIR, studyId);
        await mkdir(studyDir, { recursive: true });

        const instances = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = Buffer.from(await file.arrayBuffer());
            const fileId = uuidv4();
            const filePath = join(studyDir, `${fileId}.dcm`);

            await writeFile(filePath, buffer);

            const instance = await prisma.instance.create({
                data: {
                    seriesId: series.id,
                    instanceNumber: i + 1,
                    filePath: filePath,
                    fileSize: buffer.length,
                },
            });

            instances.push(instance);
        }

        // Update study status
        if (studio.stato === 'IN_CORSO') {
            await prisma.study.update({
                where: { id: studyId },
                data: { stato: 'COMPLETATO' },
            });
        }

        return NextResponse.json({
            success: true,
            data: { instances, count: instances.length },
        }, { status: 201 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nel caricamento dei file' },
            { status: 500 }
        );
    }
}
