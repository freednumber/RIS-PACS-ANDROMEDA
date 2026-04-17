/**
 * WADO-RS: Retrieve Metadata
 * GET /api/dicomweb/studies/{studyUID}/metadata
 */

import { NextResponse } from 'next/server';
import { DICOM_STORE, studyToMetadataResponse } from '@/lib/dicomweb';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ studyUID: string }> }
) {
    const { studyUID } = await params;
    
    const study = DICOM_STORE.find(s => s.studyInstanceUID === studyUID);
    
    if (!study) {
        return new NextResponse('Study not found', { status: 404 });
    }

    const metadata = studyToMetadataResponse(study);

    return NextResponse.json(metadata, {
        headers: { 'Content-Type': 'application/dicom+json' },
    });
}
