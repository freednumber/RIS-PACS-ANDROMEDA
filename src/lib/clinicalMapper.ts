/**
 * Clinical Intelligence Mapper
 * 
 * Bridges the gap between RIS textual descriptions and PACS DICOM metadata.
 * Uses anatomical keyword matching and modality validation to select the 
 * correct study for a given diagnostic order.
 */

import { DICOM_STORE, DicomStudy } from './dicomweb';

const ANATOMY_KEYWORDS: Record<string, string[]> = {
    'CHEST': ['TORACE', 'TORACICO', 'CHEST', 'LUNG', 'POLMONE'],
    'BRAIN': ['ENCEFALO', 'BRAIN', 'HEAD', 'TESTA', 'CRANIO'],
    'ABDOMEN': ['ADDOME', 'ABDOMEN', 'PELVI', 'PEVLY', 'FEGATO'],
    'SPINE': ['COLONNA', 'SPINE', 'RACHIDE', 'LOMBARE', 'CERVICALE'],
    'LIMB': ['ARTO', 'GAMBA', 'BRACCIO', 'MANO', 'PIEDE', 'ANKLE', 'FOOT', 'HAND'],
};

const MODALITY_MAP: Record<string, string> = {
    'TC': 'CT',
    'RM': 'MR',
    'RX': 'CR',
    'ECO': 'US',
};

export interface MappingResult {
    study: DicomStudy;
    confidence: number; // 0 to 1
    reason: string;
}

/**
 * Finds the most clinically relevant PACS study for a RIS order ID.
 */
export function findBestClinicalMatch(examDescription: string, patientID: string): MappingResult | null {
    const queryModality = Object.keys(MODALITY_MAP).find(k => examDescription.toUpperCase().includes(k));
    const normalizedModality = queryModality ? MODALITY_MAP[queryModality] : null;

    const queryAnatomy = Object.keys(ANATOMY_KEYWORDS).find(k => 
        ANATOMY_KEYWORDS[k].some(word => examDescription.toUpperCase().includes(word))
    );

    const candidates = DICOM_STORE.filter(s => s.patientID === patientID);

    if (candidates.length === 0) return null;

    let bestMatch: DicomStudy | null = null;
    let maxScore = -1;
    let matchReason = '';

    for (const study of candidates) {
        let score = 0;

        // Rule 1: Modality Match (Strong)
        if (normalizedModality && study.modality === normalizedModality) {
            score += 0.5;
        }

        // Rule 2: Anatomical Match (High Confidence)
        const studyDesc = study.studyDescription.toUpperCase();
        if (queryAnatomy && ANATOMY_KEYWORDS[queryAnatomy].some(word => studyDesc.includes(word))) {
            score += 0.4;
        }

        // Rule 3: Date Proximity (Tie-breaker)
        // (Simplified for mock: more recent studies have higher UIDs in our generator)
        score += 0.1;

        if (score > maxScore) {
            maxScore = score;
            bestMatch = study;
            matchReason = `Match found by ${normalizedModality ? 'modality (' + normalizedModality + ')' : 'anatomy'}`;
        }
    }

    if (!bestMatch) return null;

    return {
        study: bestMatch,
        confidence: maxScore,
        reason: matchReason
    };
}
