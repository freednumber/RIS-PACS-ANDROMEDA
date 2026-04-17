import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import dicomParser from 'dicom-parser';

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

        // Create upload directory
        const studyDir = join(UPLOAD_DIR, studyId);
        await mkdir(studyDir, { recursive: true });

        const instances = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = Buffer.from(await file.arrayBuffer());
            
            // Extract Metadata for Intelligent Classification
            let seriesInstanceUID = `gen-series-${uuidv4()}`;
            let seriesDescription = 'Serie Principale';
            let sopInstanceUID = uuidv4();
            let instanceNumber = i + 1;
            
            try {
                const byteArray = new Uint8Array(buffer);
                const dataSet = dicomParser.parseDicom(byteArray);
                
                // Get UIDs and Metadata
                seriesInstanceUID = dataSet.string('x0020000e') || seriesInstanceUID;
                seriesDescription = dataSet.string('x0008103e') || seriesDescription;
                sopInstanceUID = dataSet.string('x00080018') || sopInstanceUID;
                instanceNumber = dataSet.intString('x00200013') || (i + 1);
            } catch (e) {
                console.warn('Could not parse DICOM metadata, using default identifier');
            }

            // PREVENT DUPLICATES: Check if SOPInstanceUID already exists
            const existingInstance = await prisma.instance.findUnique({
                where: { sopInstanceUID }
            });

            if (existingInstance) {
                console.info(`Skipping duplicate image: ${sopInstanceUID}`);
                continue;
            }

            // Find or Create Series dynamically by UID
            let series = await prisma.series.findUnique({
                where: { seriesInstanceUID }
            });

            if (!series) {
                series = await prisma.series.create({
                    data: {
                        studyId,
                        seriesInstanceUID,
                        descrizione: seriesDescription,
                        modalita: studio.modalita,
                    }
                });
            }

            const fileId = uuidv4();
            const filePath = join(studyDir, `${fileId}.dcm`);

            await writeFile(filePath, buffer);

            const instance = await prisma.instance.create({
                data: {
                    seriesId: series.id,
                    sopInstanceUID,
                    instanceNumber,
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
