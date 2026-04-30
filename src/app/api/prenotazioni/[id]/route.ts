import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await request.json();
        const { stato, dataDesiderata, note } = body;

        // Fetch the existing prenotazione
        const existing = await prisma.prenotazione.findUnique({ where: { id } });
        if (!existing) {
             return NextResponse.json({ success: false, error: 'Prenotazione non trovata' }, { status: 404 });
        }

        // Roles limits:
        // PAZIENTE: Can only accept PROPOSTA_ALTERNA (turn to CONFERMATO) or reject (turn to ANNULLATO)
        // SEGRETERIA/ADMIN: Can CONFIRM or PROPOSE_ALTERNATIVE

        let updateData: any = { stato };
        if (note !== undefined) updateData.note = note;

        if (user.ruolo === 'SEGRETERIA' || user.ruolo === 'ADMIN') {
            if (stato === 'PROPOSTA_ALTERNA' && dataDesiderata) {
                updateData.dataDesiderata = new Date(dataDesiderata);
            }
            if (stato === 'CONFERMATO') {
               // When Segreteria confirms, create an associated Study!
               // Generate Study only if it doesn't already have one
               if (!existing.studyId) {
                   const newStudy = await prisma.study.create({
                       data: {
                           patientId: existing.pazienteId,
                           descrizione: existing.descrizioneEsame || existing.tipoEsame,
                           modalita: existing.tipoEsame,
                           sedeEsame: existing.struttura,
                           stato: 'PRENOTATO', // Will become IN_CORSO when time comes
                           dataStudio: new Date(existing.dataDesiderata) // Wait: if dataDesiderata is changed? We use existing.dataDesiderata (if not updating it in this request)
                       }
                   });
                   
                   // if dataDesiderata is provided we use it, otherwise existing
                   if (dataDesiderata) {
                         // Update study date in case it was modified now
                         await prisma.study.update({ where: { id: newStudy.id }, data: { dataStudio: new Date(dataDesiderata) }});
                   }
                   updateData.studyId = newStudy.id;
               }
            }
        } 
        else if (user.ruolo === 'PAZIENTE') {
            // Patient can accept or reject proposal
            if (stato === 'CONFERMATO' && existing.stato === 'PROPOSTA_ALTERNA') {
                 // Create study
                 if (!existing.studyId) {
                   const newStudy = await prisma.study.create({
                       data: {
                           patientId: existing.pazienteId,
                           descrizione: existing.descrizioneEsame || existing.tipoEsame,
                           modalita: existing.tipoEsame,
                           sedeEsame: existing.struttura,
                           stato: 'PRENOTATO', 
                           dataStudio: new Date(existing.dataDesiderata) 
                       }
                   });
                   updateData.studyId = newStudy.id;
                 }
            } else if (stato !== 'ANNULLATO') {
                 return NextResponse.json({ success: false, error: 'Azione non permessa per il paziente' }, { status: 403 });
            }
        }

        const updated = await prisma.prenotazione.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
         console.error('Update prenotazione error:', error);
         return NextResponse.json({ success: false, error: 'Errore nell\'aggiornamento della prenotazione' }, { status: 500 });
    }
}
