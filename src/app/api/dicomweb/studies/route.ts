/**
 * QIDO-RS: Search for Studies
 * GET /api/dicomweb/studies
 */

import { NextResponse } from 'next/server';
import { DICOM_STORE, studyToQidoResponse, TAGS } from '@/lib/dicomweb';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    let results = [...DICOM_STORE];

    // standard DICOM tags or readable aliases
    const patientName = searchParams.get('PatientName') || searchParams.get(TAGS.PATIENT_NAME);
    if (patientName) {
        const query = patientName.replace(/\*/g, '').toUpperCase();
        results = results.filter(s => s.patientName.toUpperCase().includes(query));
    }

    const patientID = searchParams.get('PatientID') || searchParams.get(TAGS.PATIENT_ID);
    if (patientID) {
        results = results.filter(s => s.patientID === patientID);
    }

    const modality = searchParams.get('ModalitiesInStudy') || searchParams.get(TAGS.MODALITY);
    if (modality) {
        results = results.filter(s => s.modality === modality.toUpperCase());
    }

    const studyUID = searchParams.get('StudyInstanceUID') || searchParams.get(TAGS.STUDY_INSTANCE_UID);
    if (studyUID) {
        results = results.filter(s => s.studyInstanceUID === studyUID);
    }

    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const paged = results.slice(offset, offset + limit);

    const qidoResponse = paged.map(studyToQidoResponse);

    return NextResponse.json(qidoResponse, {
        headers: { 'Content-Type': 'application/dicom+json' },
    });
}
