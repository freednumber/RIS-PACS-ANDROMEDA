import { format, formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
    return format(new Date(date), 'dd/MM/yyyy', { locale: it });
}

export function formatDateTime(date: Date | string): string {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: it });
}

export function formatRelativeTime(date: Date | string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: it });
}

export function getModalitaLabel(modalita: string): string {
    const labels: Record<string, string> = {
        CR: 'Radiografia (CR)',
        CT: 'TAC (CT)',
        MR: 'Risonanza Magnetica (MR)',
        US: 'Ecografia (US)',
        XA: 'Angiografia (XA)',
        MG: 'Mammografia (MG)',
        NM: 'Medicina Nucleare (NM)',
        PT: 'PET (PT)',
        DX: 'Radiografia Digitale (DX)',
        RF: 'Fluoroscopia (RF)',
        OT: 'Altro (OT)',
    };
    return labels[modalita] || modalita;
}

export function getStatoLabel(stato: string): string {
    const labels: Record<string, string> = {
        IN_CORSO: 'In Corso',
        COMPLETATO: 'Completato',
        REFERTATO: 'Refertato',
        FIRMATO: 'Firmato',
    };
    return labels[stato] || stato;
}

export function getStatoColor(stato: string): string {
    const colors: Record<string, string> = {
        IN_CORSO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        COMPLETATO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        REFERTATO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        FIRMATO: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return colors[stato] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getRuoloLabel(ruolo: string): string {
    const labels: Record<string, string> = {
        ADMIN: 'Amministratore',
        MEDICO: 'Medico',
        TECNICO: 'Tecnico Radiologo',
        PAZIENTE: 'Paziente',
    };
    return labels[ruolo] || ruolo;
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(' ');
}
