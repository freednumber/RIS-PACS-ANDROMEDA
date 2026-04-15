const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@pacsris.it' },
        update: {},
        create: {
            email: 'admin@pacsris.it',
            password: adminPassword,
            nome: 'Admin',
            cognome: 'Sistema',
            ruolo: 'ADMIN',
        },
    });

    // Create a doctor
    const drPassword = await bcrypt.hash('medico123', 12);
    const medico = await prisma.user.upsert({
        where: { email: 'dott.bianchi@ospedale.it' },
        update: {},
        create: {
            email: 'dott.bianchi@ospedale.it',
            password: drPassword,
            nome: 'Marco',
            cognome: 'Bianchi',
            ruolo: 'MEDICO',
            specializzazione: 'Radiologia',
            struttura: 'Ospedale San Giovanni, Roma',
        },
    });

    // Create sample patients
    const paziente1 = await prisma.patient.upsert({
        where: { codiceFiscale: 'RSSMRA80A01H501X' },
        update: {},
        create: {
            codiceFiscale: 'RSSMRA80A01H501X',
            nome: 'Mario',
            cognome: 'Rossi',
            dataNascita: new Date('1980-01-01'),
            sesso: 'M',
            citta: 'Roma',
            provincia: 'RM',
            telefono: '+39 333 1234567',
            email: 'mario.rossi@email.it',
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

    // Create sample studies
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

    console.log('✅ Seed completato!');
    console.log(`\n📧 Credenziali di accesso:`);
    console.log(`   Admin:  admin@pacsris.it / admin123`);
    console.log(`   Medico: dott.bianchi@ospedale.it / medico123`);
    console.log(`\n👥 Pazienti: ${paziente1.cognome}, ${paziente2.cognome}, ${paziente3.cognome}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
