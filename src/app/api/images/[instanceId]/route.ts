import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readFile, access } from 'fs/promises';
import { join, extname } from 'path';

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.dcm': 'application/dicom',
    '.dicom': 'application/dicom',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ instanceId: string }> }
) {
    const { instanceId } = await params;

    try {
        const instance = await prisma.instance.findUnique({
            where: { id: instanceId },
        });

        if (!instance) {
            return NextResponse.json(
                { success: false, error: 'Immagine non trovata' },
                { status: 404 }
            );
        }

        // Resolve file path - handle both absolute and relative paths
        let absolutePath = instance.filePath;
        if (!absolutePath.startsWith('/')) {
            // Relative path: could be /uploads/... stored from the public dir
            // or uploads/dicom/... stored from process.cwd()
            if (absolutePath.startsWith('uploads/') || absolutePath.startsWith('uploads\\')) {
                absolutePath = join(process.cwd(), absolutePath);
            } else {
                // Path like /uploads/studyId/filename → serve from public
                absolutePath = join(process.cwd(), 'public', absolutePath);
            }
        }

        // Check if file exists
        try {
            await access(absolutePath);
        } catch {
            return NextResponse.json(
                { success: false, error: 'File non trovato sul disco' },
                { status: 404 }
            );
        }

        const fileBuffer = await readFile(absolutePath);
        const ext = extname(absolutePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        console.log(`[PACS API] Serving instance ${instanceId}: ${fileBuffer.length} bytes, MIME: ${contentType}`);

        return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600, immutable',
                'Content-Disposition': 'inline',
            },
        });
    } catch (error) {
        console.error('Image serve error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore nel recupero dell\'immagine' },
            { status: 500 }
        );
    }
}
