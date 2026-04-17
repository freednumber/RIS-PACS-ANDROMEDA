import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requestAIAnalysis } from '@/lib/ai-analysis';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.ruolo !== 'MEDICO' && user.ruolo !== 'ADMIN')) {
            return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401 });
        }

        const { studyId, tipo, imageUrls } = await req.json();

        if (!studyId || !tipo) {
            return NextResponse.json({ success: false, error: 'Parametri mancanti' }, { status: 400 });
        }

        const result = await requestAIAnalysis(studyId, tipo, imageUrls || []);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('AI Analysis API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
