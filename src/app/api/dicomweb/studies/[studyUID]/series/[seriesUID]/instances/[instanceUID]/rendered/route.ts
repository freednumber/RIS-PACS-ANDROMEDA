/**
 * WADO-RS: Retrieve Rendered Instance
 * GET /api/dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}/rendered
 */

import { NextResponse } from 'next/server';
import { DICOM_STORE } from '@/lib/dicomweb';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ studyUID: string; seriesUID: string; instanceUID: string }> }
) {
    const { studyUID, seriesUID, instanceUID } = await params;

    // Find matching instance
    let imagePath: string | null = null;
    for (const study of DICOM_STORE) {
        if (study.studyInstanceUID !== studyUID) continue;
        for (const series of study.series) {
            if (series.seriesInstanceUID !== seriesUID) continue;
            const instance = series.instances.find(i => i.sopInstanceUID === instanceUID);
            if (instance) { imagePath = instance.imagePath; break; }
        }
        if (imagePath) break;
    }

    if (!imagePath) {
        return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    try {
        const fullPath = join(process.cwd(), 'public', imagePath);
        const imageBuffer = await readFile(fullPath);
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.byteLength.toString(),
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch {
        return NextResponse.redirect(new URL(imagePath, _request.url));
    }
}
