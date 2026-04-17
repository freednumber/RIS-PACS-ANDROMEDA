const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// ═══════════════════════════════════════════════════════════════
// PASSWORD UNICA per tutti i ruoli
// ═══════════════════════════════════════════════════════════════
const UNIVERSAL_PASSWORD = 'andromeda2026';

async function main() {
    console.log('🌱 Seeding database Andromeda RIS-PACS...');

    const hashedPassword = await bcrypt.hash(UNIVERSAL_PASSWORD, 12);

    // ─── USERS ───────────────────────────────────────────────────────────────

    const admin = await prisma.user.upsert({
        where: { email: 'admin@andromeda.it' },
        update: { password: hashedPassword },
        create: {
            email: 'admin@andromeda.it',
            password: hashedPassword,
            nome: 'Admin',
            cognome: 'Sistema',
            ruolo: 'ADMIN',
            struttura: 'Andromeda HQ',
        },
    });

    const medico = await prisma.user.upsert({
        where: { email: 'medico@andromeda.it' },
        update: { password: hashedPassword },
        create: {
            email: 'medico@andromeda.it',
            password: hashedPassword,
            nome: 'Marco',
            cognome: 'Bianchi',
            ruolo: 'MEDICO',
            specializzazione: 'Radiologia',
            struttura: 'Ospedale San Giovanni, Roma',
        },
    });

    const tecnico = await prisma.user.upsert({
        where: { email: 'tecnico@andromeda.it' },
        update: { password: hashedPassword },
        create: {
            email: 'tecnico@andromeda.it',
            password: hashedPassword,
            nome: 'Luca',
            cognome: 'Ferretti',
            ruolo: 'TECNICO',
            struttura: 'Ospedale San Giovanni, Roma',
        },
    });

    const segreteria = await prisma.user.upsert({
        where: { email: 'segreteria@andromeda.it' },
        update: { password: hashedPassword },
        create: {
            email: 'segreteria@andromeda.it',
            password: hashedPassword,
            nome: 'Anna',
            cognome: 'Conti',
            ruolo: 'SEGRETERIA',
            struttura: 'Ospedale San Giovanni, Roma',
        },
    });

    const pazienteUser = await prisma.user.upsert({
        where: { email: 'paziente@andromeda.it' },
        update: { password: hashedPassword },
        create: {
            email: 'paziente@andromeda.it',
            password: hashedPassword,
            nome: 'Mario',
            cognome: 'Rossi',
            ruolo: 'PAZIENTE',
            telefono: '+39 333 1234567',
        },
    });

    // Keep legacy users updated too
    const legacyEmails = [
        'admin@pacsris.it', 'dott.bianchi@ospedale.it', 'mario.rossi@email.it',
        'paziente@test.it', 'medico@test.it', 'tsrm@test.it', 'segreteria@test.it'
    ];
    for (const email of legacyEmails) {
        try {
            await prisma.user.update({ where: { email }, data: { password: hashedPassword } });
        } catch { /* user may not exist, skip */ }
    }

    // ─── PATIENTS ────────────────────────────────────────────────────────────

    const paziente1 = await prisma.patient.upsert({
        where: { codiceFiscale: 'RSSMRA80A01H501X' },
        update: { email: 'paziente@andromeda.it' },
        create: {
            codiceFiscale: 'RSSMRA80A01H501X',
            nome: 'Mario',
            cognome: 'Rossi',
            dataNascita: new Date('1980-01-01'),
            sesso: 'M',
            luogoNascita: 'Roma',
            indirizzo: 'Via Roma 12',
            citta: 'Roma',
            cap: '00100',
            provincia: 'RM',
            telefono: '+39 333 1234567',
            email: 'paziente@andromeda.it',
        },
    });

    const paziente2 = await prisma.patient.upsert({
        where: { codiceFiscale: 'VRDGPP75B02F205Y' },
        update: {},
        create: {
            codiceFiscale: 'VRDGPP75B02F205Y',
            nome: 'Giuseppina',
            cognome: 'Verdi',
            dataNascita: new Date('1975-02-15'),
            sesso: 'F',
            citta: 'Milano',
            provincia: 'MI',
            telefono: '+39 320 9876543',
        },
    });

    const paziente3 = await prisma.patient.upsert({
        where: { codiceFiscale: 'BNCLCA90C03L219Z' },
        update: {},
        create: {
            codiceFiscale: 'BNCLCA90C03L219Z',
            nome: 'Luca',
            cognome: 'Bianchi',
            dataNascita: new Date('1990-03-10'),
            sesso: 'M',
            citta: 'Torino',
            provincia: 'TO',
        },
    });

    // ─── STUDIES (existing) ───────────────────────────────────────────────────

    await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RX Torace in 2 proiezioni',
            modalita: 'CR',
            bodyPart: 'TORACE',
            sedeEsame: 'Ospedale San Giovanni, Roma',
            stato: 'REFERTATO',
            referto: 'Non si evidenziano lesioni pleuroparenchimali in atto. Cuore nei limiti. Seni costofrenici liberi.',
            medicoRefertanteId: medico.id,
            dataReferto: new Date(),
        },
    });

    await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'TC Encefalo senza mdc',
            modalita: 'CT',
            bodyPart: 'TESTA',
            sedeEsame: 'Ospedale San Giovanni, Roma',
            stato: 'COMPLETATO',
            priorita: 'URGENTE',
        },
    });

    await prisma.study.create({
        data: {
            patientId: paziente2.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RM Ginocchio sx',
            modalita: 'MR',
            bodyPart: 'GINOCCHIO',
            sedeEsame: 'Clinica Villa Rosa, Milano',
            stato: 'IN_CORSO',
        },
    });

    await prisma.study.create({
        data: {
            patientId: paziente3.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'Ecografia addome completo',
            modalita: 'US',
            bodyPart: 'ADDOME',
            sedeEsame: 'Studio Medico Dr. Bianchi, Torino',
            stato: 'COMPLETATO',
        },
    });

    // ─── STUDIES FOR PATIENT PORTAL (Mario Rossi) ────────────────────────────

    const studioPaziente_RMCranio = await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            medicoRefertanteId: medico.id,
            descrizione: 'RM Encefalo senza e con mdc',
            modalita: 'MR',
            bodyPart: 'CRANIO',
            sedeEsame: 'Centro RM Parioli – Viale Parioli 55, Roma',
            stato: 'REFERTATO',
            priorita: 'NORMALE',
            dataStudio: new Date('2026-03-10T09:30:00'),
            referto: `ESAME: RM Encefalo senza e con mdc
DATA: 10/03/2026
MEDICO REFERTANTE: Dott. Marco Bianchi

TECNICA: Studio RM dell'encefalo eseguito con apparecchiatura a 1.5T con sequenze standard SE T1, TSE T2, FLAIR, DWI e sequenze T1 post-contrasto (gadolinio 0.1 mmol/kg).

REPERTI:
Il parenchima cerebrale presenta normale morfologia e segnale nelle sequenze eseguite. Non si evidenziano aree di alterato segnale nelle sequenze T2/FLAIR riferibili a lesioni ischemiche o demielinizzanti in atto. Non si rilevano aree di restrizione alla diffusione. Il sistema ventricolare è nei limiti dimensionali, simmetrico, regolarmente conformato. Le strutture della linea mediana sono in sede. Le cisterne della base sono libere e pervie. Non si evidenziano alterazioni patologiche del segnale a carico della fossa posteriore. Lo studio post-contrasto non dimostra anomale impregnazioni patologiche. La sella turcica è nei limiti, l'ipofisi ha normale morfologia e segnale.

CONCLUSIONI:
RM encefalo nei limiti della norma. Non si rilevano lesioni focali né alterazioni del segnale patologicamente significative.`,
            dataReferto: new Date('2026-03-10T14:00:00'),
        },
    });

    const studioPaziente_TCAddome = await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            medicoRefertanteId: medico.id,
            descrizione: 'TC Addome e Pelvi con mdc',
            modalita: 'CT',
            bodyPart: 'ADDOME',
            sedeEsame: 'Clinica Villa Serena – Via Aurelia 300, Roma',
            stato: 'REFERTATO',
            priorita: 'NORMALE',
            dataStudio: new Date('2026-03-15T11:00:00'),
            referto: `ESAME: TC Addome e Pelvi con mdc e.v.
DATA: 15/03/2026
MEDICO REFERTANTE: Dott. Marco Bianchi

TECNICA: Studio TC dell'addome e della pelvi eseguito con mezzo di contrasto iodato e.v. nelle fasi arteriosa, portale e tardiva (MDCT 64 strati, collimazione 0.6 mm).

REPERTI:
FEGATO: Dimensioni nella norma, profilo regolare, parenchima omogeneo. Non si evidenziano lesioni focali nelle sequenze eseguite.
COLECISTI: Regolarmente distesa, pareti nei limiti, assenza di calcoli endoluminali.
VIE BILIARI: Non dilatate.
MILZA: Dimensioni nella norma, omogenea.
PANCREAS: Regolare per morfologia e densità, wirsung non dilatato.
SURRENI: Bilateralmente nella norma.
RENI: Entrambi i reni sono regolari per morfologia e dimensioni. Escrezione del mdc simmetrica e tempestiva. Non si identificano calcoli o masse.
AORTA E VASI: Calibro regolare, pareti nei limiti.
INTESTINO: Anse intestinali nei limiti, nessuna occlusione evidenziabile.
PELVI: Non si identificano masse o linfoadenopatie significative.

CONCLUSIONI:
TC addome e pelvi senza reperti patologici di rilievo.`,
            dataReferto: new Date('2026-03-15T16:30:00'),
        },
    });

    // Studio futuro (schedulato) – nessun referto ancora
    await prisma.study.create({
        data: {
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RX Torace PA e LL',
            modalita: 'CR',
            bodyPart: 'TORACE',
            sedeEsame: 'Centro Diagnostico Roma Nord – Via Salaria 120, Roma',
            stato: 'IN_CORSO',
            priorita: 'NORMALE',
            dataStudio: new Date('2026-04-28T10:00:00'),
        },
    });

    // ─── PRENOTAZIONI (Patient Portal) ───────────────────────────────────────

    const hasPrenotazione = Object.keys(prisma).includes('prenotazione');

    if (hasPrenotazione) {
        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-001' },
            update: {},
            create: {
                id: 'seed-prenotazione-001',
                pazienteId: paziente1.id,
                tipoEsame: 'RM',
                descrizioneEsame: 'RM Encefalo con e senza mdc',
                struttura: 'Centro RM Parioli – Viale Parioli 55, Roma',
                dataDesiderata: new Date('2026-04-20T09:00:00'),
                stato: 'CONFERMATO',
                note: 'Paziente riferisce cefalea ricorrente da 3 mesi.',
                codicePrenotazione: 'AND-2026-001',
            },
        });

        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-002' },
            update: {},
            create: {
                id: 'seed-prenotazione-002',
                pazienteId: paziente1.id,
                tipoEsame: 'RX',
                descrizioneEsame: 'RX Torace PA e LL',
                struttura: 'Centro Diagnostico Roma Nord – Via Salaria 120, Roma',
                dataDesiderata: new Date('2026-04-28T10:00:00'),
                stato: 'IN_ATTESA',
                note: null,
                codicePrenotazione: 'AND-2026-002',
            },
        });

        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-003' },
            update: {},
            create: {
                id: 'seed-prenotazione-003',
                pazienteId: paziente1.id,
                tipoEsame: 'TC',
                descrizioneEsame: 'TC Addome e Pelvi con mdc',
                struttura: 'Clinica Villa Serena – Via Aurelia 300, Roma',
                dataDesiderata: new Date('2026-03-15T11:00:00'),
                stato: 'COMPLETATO',
                studyId: studioPaziente_TCAddome.id,
                codicePrenotazione: 'AND-2026-003',
            },
        });

        await prisma.prenotazione.upsert({
            where: { id: 'seed-prenotazione-004' },
            update: {},
            create: {
                id: 'seed-prenotazione-004',
                pazienteId: paziente1.id,
                tipoEsame: 'ECO',
                descrizioneEsame: 'Ecografia addome superiore',
                struttura: 'Poliambulatorio San Marco – Corso Vittorio 45, Milano',
                dataDesiderata: new Date('2026-04-05T15:00:00'),
                stato: 'ANNULLATO',
                note: 'Annullato dal paziente per impegni lavorativi.',
                codicePrenotazione: 'AND-2026-004',
            },
        });

    // ─── FEDERATED NODES ─────────────────────────────────────────────────────
    
    await prisma.federatedNode.upsert({
        where: { id: 'node-roma-1' },
        update: {},
        create: {
            id: 'node-roma-1',
            nome: 'Ospedale San Camillo',
            endpoint: 'https://pacs.sancamillo.roma.it/api/federation',
            apiKey: 'sk-camillo-12345',
            paese: 'IT',
            citta: 'Roma',
            attivo: true
        }
    });

    await prisma.federatedNode.upsert({
        where: { id: 'node-milano-1' },
        update: {},
        create: {
            id: 'node-milano-1',
            nome: 'Galeazzi Orthopaedics',
            endpoint: 'https://federation.galeazzi.it',
            apiKey: 'sk-galeazzi-67890',
            paese: 'IT',
            citta: 'Milano',
            attivo: true
        }
    });

    console.log('🌐 Nodi federati creati con successo.');

    // ─── CASE STUDIES / AI PREVIEWS ──────────────────────────────────────────

    const mriBrainStudy = await prisma.study.upsert({
        where: { id: 'study-ai-mri-001' },
        update: {},
        create: {
            id: 'study-ai-mri-001',
            patientId: paziente1.id,
            medicoRichiedenteId: medico.id,
            descrizione: 'RM ENCEFALO - ANALISI AI INTEGRATA',
            modalita: 'MR',
            bodyPart: 'CRANIO',
            sedeEsame: 'Centro Andromeda Vision',
            stato: 'DA_REFERTARE',
            dataStudio: new Date('2026-04-10T14:00:00'),
            priorita: 'URGENTE',
        }
    });

    await prisma.aIAnalysis.create({
        data: {
            studyId: mriBrainStudy.id,
            tipo: 'ANOMALIA',
            contenuto: '## Analisi Preliminare AI\n\n- **Segnale anomalo** rilevato in corrispondenza del lobo temporale sinistro.\n- Sospetta area di edema vasogenico.\n- Necessaria correlazione con mdc.',
            confidenza: 0.94,
            modelloAI: 'gemini-2.5-flash',
            stato: 'COMPLETATO'
        }
    });

    console.log('🤖 Dati di addestramento AI creati.');

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║          ✅ SEED ANDROMEDA RIS-PACS COMPLETATO           ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                          ║');
    console.log('║  🔑 PASSWORD UNICA: andromeda2026                        ║');
    console.log('║                                                          ║');
    console.log('║  📧 Account disponibili:                                 ║');
    console.log('║     🛡️  Admin:      admin@andromeda.it                    ║');
    console.log('║     🩺 Medico:     medico@andromeda.it                   ║');
    console.log('║     🔬 TSRM:       tecnico@andromeda.it                  ║');
    console.log('║     📋 Segreteria: segreteria@andromeda.it               ║');
    console.log('║     👤 Paziente:   paziente@andromeda.it                  ║');
    console.log('║                                                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
