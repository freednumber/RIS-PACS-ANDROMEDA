-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "ruolo" TEXT NOT NULL DEFAULT 'MEDICO',
    "specializzazione" TEXT,
    "struttura" TEXT,
    "telefono" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codiceFiscale" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "dataNascita" DATETIME NOT NULL,
    "sesso" TEXT NOT NULL,
    "luogoNascita" TEXT,
    "indirizzo" TEXT,
    "citta" TEXT,
    "cap" TEXT,
    "provincia" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Study" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "medicoRichiedenteId" TEXT,
    "medicoRefertanteId" TEXT,
    "tecnicoAssegnatoId" TEXT,
    "accessionNumber" TEXT NOT NULL,
    "studyInstanceUID" TEXT NOT NULL,
    "dataStudio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descrizione" TEXT,
    "modalita" TEXT NOT NULL,
    "bodyPart" TEXT,
    "sedeEsame" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'IN_CORSO',
    "priorita" TEXT NOT NULL DEFAULT 'NORMALE',
    "referto" TEXT,
    "dataReferto" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Study_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Study_medicoRichiedenteId_fkey" FOREIGN KEY ("medicoRichiedenteId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Study_medicoRefertanteId_fkey" FOREIGN KEY ("medicoRefertanteId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Study_tecnicoAssegnatoId_fkey" FOREIGN KEY ("tecnicoAssegnatoId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "seriesInstanceUID" TEXT NOT NULL,
    "seriesNumber" INTEGER NOT NULL DEFAULT 1,
    "descrizione" TEXT,
    "modalita" TEXT,
    "dataAcquisizione" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Series_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seriesId" TEXT NOT NULL,
    "sopInstanceUID" TEXT NOT NULL,
    "instanceNumber" INTEGER NOT NULL DEFAULT 1,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "rows" INTEGER,
    "columns" INTEGER,
    "bitsAllocated" INTEGER,
    "transferSyntax" TEXT,
    "thumbnailPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Instance_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "firmaData" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consenso" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signature_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signature_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "descrizione" TEXT,
    "scadenza" DATETIME NOT NULL,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "maxAccess" INTEGER NOT NULL DEFAULT 10,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareToken_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FederatedNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "paese" TEXT NOT NULL DEFAULT 'IT',
    "endpoint" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoSync" DATETIME,
    "metadati" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "userId" TEXT,
    "tipo" TEXT NOT NULL,
    "contenuto" TEXT NOT NULL,
    "confidenza" REAL NOT NULL DEFAULT 0,
    "modelloAI" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "stato" TEXT NOT NULL DEFAULT 'COMPLETATO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIAnalysis_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "difficolta" TEXT NOT NULL DEFAULT 'INTERMEDIO',
    "tags" TEXT,
    "pubblicato" BOOLEAN NOT NULL DEFAULT false,
    "visualizzazioni" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaseStudy_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CaseStudy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseAnnotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseStudyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contenuto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'COMMENTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseAnnotation_caseStudyId_fkey" FOREIGN KEY ("caseStudyId") REFERENCES "CaseStudy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CaseAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prenotazione" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pazienteId" TEXT NOT NULL,
    "tipoEsame" TEXT NOT NULL,
    "descrizioneEsame" TEXT,
    "struttura" TEXT NOT NULL,
    "dataDesiderata" DATETIME NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'IN_ATTESA',
    "note" TEXT,
    "studyId" TEXT,
    "codicePrenotazione" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_codiceFiscale_key" ON "Patient"("codiceFiscale");

-- CreateIndex
CREATE UNIQUE INDEX "Study_accessionNumber_key" ON "Study"("accessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Study_studyInstanceUID_key" ON "Study"("studyInstanceUID");

-- CreateIndex
CREATE UNIQUE INDEX "Series_seriesInstanceUID_key" ON "Series"("seriesInstanceUID");

-- CreateIndex
CREATE UNIQUE INDEX "Instance_sopInstanceUID_key" ON "Instance"("sopInstanceUID");

-- CreateIndex
CREATE UNIQUE INDEX "ShareToken_token_key" ON "ShareToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "FederatedNode_endpoint_key" ON "FederatedNode"("endpoint");
