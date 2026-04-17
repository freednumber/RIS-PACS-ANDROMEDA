/**
 * DICOMweb Service Layer v2.0 (Google Cloud Healthcare Compliant)
 * 
 * Implements the DICOM JSON Model (PS3.18 Annex F) for enterprise-grade 
 * RIS-PACS integration. Supports clinical mapping and high-performance WADO-RS.
 */

// ─── DICOM TAG CONSTANTS ─────────────────────────────────────────────────────
export const TAGS = {
    STUDY_DATE: '00080020',
    MODALITY: '00080060',
    STUDY_DESCRIPTION: '00081030',
    INSTITUTION_NAME: '00080080',
    PATIENT_NAME: '00100010',
    PATIENT_ID: '00100020',
    PATIENT_BIRTH_DATE: '00100030',
    PATIENT_SEX: '00100040',
    BODY_PART: '00180015',
    STUDY_INSTANCE_UID: '0020000D',
    SERIES_INSTANCE_UID: '0020000E',
    SERIES_NUMBER: '00200011',
    SERIES_DESCRIPTION: '0008103E',
    INSTANCE_NUMBER: '00200013',
    SOP_INSTANCE_UID: '00080018',
    WINDOW_CENTER: '00281050',
    WINDOW_WIDTH: '00281051',
};

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

export interface DicomInstance {
    sopInstanceUID: string;
    instanceNumber: number;
    sliceLocation: number;
    imagePath: string;
    metadata?: any; // DICOM JSON Model for this instance
}

export interface DicomSeries {
    seriesInstanceUID: string;
    seriesNumber: number;
    seriesDescription: string;
    modality: string;
    sliceThickness: number;
    instances: DicomInstance[];
    bodyPartExamined?: string;
}

export interface DicomStudy {
    studyInstanceUID: string;
    patientName: string;
    patientID: string;
    patientBirthDate: string;
    patientSex: string;
    studyDate: string;
    studyTime: string;
    studyDescription: string;
    modality: string;
    bodyPartExamined: string;
    institutionName: string;
    referringPhysicianName: string;
    windowCenter: number;
    windowWidth: number;
    series: DicomSeries[];
    thumbnailPath: string;
}

// ─── UID GENERATOR ───────────────────────────────────────────────────────────
const BASE = '1.2.826.0.1.3680043.8.1055';
const uid = (s: number, se: number, i: number) => `${BASE}.${s}.${se}.${i}`;

// ─── REAL DICOM SAMPLES (Updated for Enterprise Mapping) ─────────────────────
const SAMPLES = {
    LUNG_CT: 'https://github.com/robyoung/dicom-test-files/raw/refs/heads/master/data/pydicom/CT_small.dcm',
    BRAIN_MRI: 'https://github.com/robyoung/dicom-test-files/raw/refs/heads/master/data/WG04/J2KI/MR1_J2KI',
    CHEST_XRAY: 'https://github.com/robyoung/dicom-test-files/raw/refs/heads/master/data/WG04/J2KI/NM1_J2KI',
};

function getProxyUrl(url: string) {
    return `/api/dicom-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Generates specific DICOM JSON metadata for an instance to support bit-depth windowing.
 */
function generateInstanceMetadata(study: Partial<DicomStudy>, series: Partial<DicomSeries>, instance: Partial<DicomInstance>) {
    return {
        [TAGS.SOP_INSTANCE_UID]: { vr: 'UI', Value: [instance.sopInstanceUID] },
        [TAGS.INSTANCE_NUMBER]: { vr: 'IS', Value: [instance.instanceNumber] },
        [TAGS.WINDOW_CENTER]: { vr: 'DS', Value: [study.windowCenter] },
        [TAGS.WINDOW_WIDTH]: { vr: 'DS', Value: [study.windowWidth] },
        [TAGS.PATIENT_NAME]: { vr: 'PN', Value: [{ Alphabetic: study.patientName }] },
        [TAGS.MODALITY]: { vr: 'CS', Value: [series.modality] },
        [TAGS.BODY_PART]: { vr: 'CS', Value: [series.bodyPartExamined || study.bodyPartExamined] },
    };
}

function makeSlices(studyN: number, seriesN: number, count: number, sampleUrl: string, startLoc: number, spacing: number, studyBase: Partial<DicomStudy>): DicomInstance[] {
    const seriesUID = uid(studyN, seriesN, 0);
    return Array.from({ length: count }, (_, i) => {
        const sopUID = uid(studyN, seriesN, i + 1);
        const inst: DicomInstance = {
            sopInstanceUID: sopUID,
            instanceNumber: i + 1,
            sliceLocation: +(startLoc + i * spacing).toFixed(1),
            imagePath: getProxyUrl(sampleUrl),
        };
        inst.metadata = generateInstanceMetadata(studyBase, { seriesInstanceUID: seriesUID, modality: studyBase.modality }, inst);
        return inst;
    });
}

// ─── DICOM STORE (Clinical Simulation) ───────────────────────────────────────

export const DICOM_STORE: DicomStudy[] = [
    // ═══ 1. CT Chest (Lung Window) — Enterprise Sample ═══
    {
        studyInstanceUID: uid(10, 0, 0),
        patientName: 'ROSSI^MARIO',
        patientID: 'PA-20481',
        patientBirthDate: '19800101',
        patientSex: 'M',
        studyDate: '20260415',
        studyTime: '100000',
        studyDescription: 'TC TORACE (LUNG WINDOW)',
        modality: 'CT',
        bodyPartExamined: 'CHEST',
        institutionName: 'Andromeda Diagnostic Center',
        referringPhysicianName: 'NERI^MARCO',
        windowCenter: -600,
        windowWidth: 1500,
        thumbnailPath: '/dicom-images/chest-ct.png',
        series: [{
            seriesInstanceUID: uid(10, 1, 0),
            seriesNumber: 1,
            seriesDescription: 'AXIAL LUNG 3mm',
            modality: 'CT',
            sliceThickness: 3,
            bodyPartExamined: 'CHEST',
            instances: [], // Populated below
        }],
    },
    // ═══ 2. MR Brain (T2 Weight) ═══
    {
        studyInstanceUID: uid(20, 0, 0),
        patientName: 'ROSSI^MARIO',
        patientID: 'PA-20481',
        patientBirthDate: '19800101',
        patientSex: 'M',
        studyDate: '20260414',
        studyTime: '113000',
        studyDescription: 'RM ENCEFALO',
        modality: 'MR',
        bodyPartExamined: 'BRAIN',
        institutionName: 'Andromeda Diagnostic Center',
        referringPhysicianName: 'NERI^MARCO',
        windowCenter: 600,
        windowWidth: 1200,
        thumbnailPath: '/dicom-images/brain-mri.png',
        series: [{
            seriesInstanceUID: uid(20, 1, 0),
            seriesNumber: 1,
            seriesDescription: 'AX T2 FLAIR',
            modality: 'MR',
            sliceThickness: 5,
            bodyPartExamined: 'BRAIN',
            instances: [], // Populated below
        }],
    }
];

// Populate slices with metadata
DICOM_STORE[0].series[0].instances = makeSlices(10, 1, 20, SAMPLES.LUNG_CT, -100, 3, DICOM_STORE[0]);
DICOM_STORE[1].series[0].instances = makeSlices(20, 1, 16, SAMPLES.BRAIN_MRI, 20, 5, DICOM_STORE[1]);

// ─── HELPER FUNCTIONS (Formatting & Standards) ──────────────────────────────

export function formatDicomDate(d: string): string {
    if (!d || d.length !== 8) return d;
    return `${d.slice(6)}/${d.slice(4, 6)}/${d.slice(0, 4)}`;
}

export function formatPatientName(n: string): string {
    if (!n) return '';
    const p = n.split('^');
    if (p.length >= 2) {
        const fmt = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        return `${fmt(p[1])} ${fmt(p[0])}`;
    }
    return n;
}

export function getTotalInstances(study: DicomStudy): number {
    return study.series.reduce((sum, s) => sum + s.instances.length, 0);
}

/**
 * QIDO-RS Study Search Response Formatter
 */
export function studyToQidoResponse(study: DicomStudy) {
    return {
        [TAGS.STUDY_DATE]: { vr: 'DA', Value: [study.studyDate] },
        [TAGS.MODALITY]: { vr: 'CS', Value: [study.modality] },
        [TAGS.STUDY_DESCRIPTION]: { vr: 'LO', Value: [study.studyDescription] },
        [TAGS.INSTITUTION_NAME]: { vr: 'LO', Value: [study.institutionName] },
        [TAGS.PATIENT_NAME]: { vr: 'PN', Value: [{ Alphabetic: study.patientName }] },
        [TAGS.PATIENT_ID]: { vr: 'LO', Value: [study.patientID] },
        [TAGS.STUDY_INSTANCE_UID]: { vr: 'UI', Value: [study.studyInstanceUID] },
        '00201208': { vr: 'IS', Value: [getTotalInstances(study)] }, // Number of Study Related Instances
    };
}

/**
 * WADO-RS Metadata Response Formatter (Study Level)
 */
export function studyToMetadataResponse(study: DicomStudy): any[] {
    return study.series.flatMap(series => 
        series.instances.map(inst => ({
            ...inst.metadata,
            [TAGS.STUDY_INSTANCE_UID]: { vr: 'UI', Value: [study.studyInstanceUID] },
            [TAGS.SERIES_INSTANCE_UID]: { vr: 'UI', Value: [series.seriesInstanceUID] },
        }))
    );
}
