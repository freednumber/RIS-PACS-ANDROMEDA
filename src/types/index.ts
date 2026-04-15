export type Ruolo = 'ADMIN' | 'MEDICO' | 'TECNICO' | 'PAZIENTE' | 'SEGRETERIA';

export type StatoStudio = 'IN_CORSO' | 'COMPLETATO' | 'REFERTATO' | 'FIRMATO';

export type Modalita = 'CR' | 'CT' | 'MR' | 'US' | 'XA' | 'MG' | 'NM' | 'PT' | 'DX' | 'RF' | 'OT';

export type Priorita = 'URGENTE' | 'NORMALE' | 'BASSA';

export type TipoAnalisiAI = 'REFERTO_SUGGERITO' | 'ANOMALIA' | 'CLASSIFICAZIONE';

export type CategoriaClinica = 'NEUROLOGIA' | 'ORTOPEDIA' | 'CARDIOLOGIA' | 'PNEUMOLOGIA' | 'ADDOME' | 'UROLOGIA' | 'ONCOLOGIA' | 'PEDIATRIA' | 'EMERGENZA' | 'ALTRO';

export type DifficoltaCaso = 'BASE' | 'INTERMEDIO' | 'AVANZATO';

export type TipoAnnotazione = 'COMMENTO' | 'DIAGNOSI_DIFFERENZIALE' | 'TEACHING_POINT';

export interface DashboardStats {
    totalePazienti: number;
    totaleStudi: number;
    studiOggi: number;
    studiDaRefertare: number;
    studiDaFirmare: number;
    ultimiStudi: StudyWithRelations[];
}

export interface StudyWithRelations {
    id: string;
    accessionNumber: string;
    studyInstanceUID: string;
    dataStudio: string;
    descrizione: string | null;
    modalita: string;
    bodyPart: string | null;
    sedeEsame: string | null;
    stato: string;
    priorita: string;
    referto: string | null;
    patient: {
        id: string;
        nome: string;
        cognome: string;
        codiceFiscale: string;
    };
    medicoRichiedente: {
        id: string;
        nome: string;
        cognome: string;
    } | null;
    medicoRefertante: {
        id: string;
        nome: string;
        cognome: string;
    } | null;
    tecnicoAssegnato: {
        id: string;
        nome: string;
        cognome: string;
    } | null;
    _count: {
        series: number;
        firme: number;
    };
}

export interface PatientWithStudies {
    id: string;
    codiceFiscale: string;
    nome: string;
    cognome: string;
    dataNascita: string;
    sesso: string;
    telefono: string | null;
    email: string | null;
    studi: StudyWithRelations[];
    _count: {
        studi: number;
        firme: number;
    };
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ==========================================
// AI AGENT TYPES
// ==========================================

export interface AIAnalysisResult {
    id: string;
    studyId: string;
    tipo: TipoAnalisiAI;
    contenuto: string;
    confidenza: number;
    modelloAI: string;
    stato: string;
    createdAt: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    studyContext?: string;
}

// ==========================================
// FEDERATION TYPES
// ==========================================

export interface FederatedNodeInfo {
    id: string;
    nome: string;
    paese: string;
    endpoint: string;
    attivo: boolean;
    ultimoSync: string | null;
    metadati: Record<string, unknown> | null;
    createdAt: string;
}

export interface FederatedSearchResult {
    nodeId: string;
    nodeName: string;
    paese: string;
    studies: StudyWithRelations[];
}

// ==========================================
// CASE STUDY TYPES
// ==========================================

export interface CaseStudyInfo {
    id: string;
    studyId: string;
    titolo: string;
    descrizione: string;
    categoria: string;
    difficolta: string;
    tags: string[];
    pubblicato: boolean;
    visualizzazioni: number;
    createdAt: string;
    user: {
        id: string;
        nome: string;
        cognome: string;
    };
    study: {
        id: string;
        modalita: string;
        bodyPart: string | null;
        patient: {
            nome: string;
            cognome: string;
        };
    };
    _count: {
        annotazioni: number;
    };
}

export interface CaseAnnotationInfo {
    id: string;
    contenuto: string;
    tipo: TipoAnnotazione;
    createdAt: string;
    user: {
        id: string;
        nome: string;
        cognome: string;
    };
}
