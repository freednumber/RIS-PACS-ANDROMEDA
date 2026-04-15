import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const nodes = await prisma.federatedNode.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Hide secrets from response
        const safeNodes = nodes.map(({ apiSecret, ...n }) => ({
            ...n,
            apiSecret: undefined,
            metadati: n.metadati ? JSON.parse(n.metadati) : null,
        }));

        return NextResponse.json({ success: true, data: safeNodes });
    } catch (error) {
        console.error('Federation nodes error:', error);
        return NextResponse.json({ success: false, error: 'Errore nel recupero dei nodi' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.ruolo !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Solo gli admin possono gestire la federazione' }, { status: 403 });
        }

        const { nome, paese, endpoint, metadati } = await req.json();

        if (!nome || !endpoint) {
            return NextResponse.json({ success: false, error: 'Nome e endpoint sono obbligatori' }, { status: 400 });
        }

        // Check for duplicate endpoint
        const existing = await prisma.federatedNode.findUnique({ where: { endpoint } });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Questo endpoint è già registrato' }, { status: 409 });
        }

        const node = await prisma.federatedNode.create({
            data: {
                nome,
                paese: paese || 'IT',
                endpoint,
                apiKey: uuidv4(),
                apiSecret: uuidv4(),
                metadati: metadati ? JSON.stringify(metadati) : null,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...node,
                metadati: node.metadati ? JSON.parse(node.metadati) : null,
            },
            message: 'Nodo federato registrato con successo',
        });
    } catch (error) {
        console.error('Federation node create error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella registrazione del nodo' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.ruolo !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Solo gli admin possono gestire la federazione' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const nodeId = searchParams.get('id');

        if (!nodeId) {
            return NextResponse.json({ success: false, error: 'ID nodo obbligatorio' }, { status: 400 });
        }

        await prisma.federatedNode.delete({ where: { id: nodeId } });

        return NextResponse.json({ success: true, message: 'Nodo rimosso' });
    } catch (error) {
        console.error('Federation node delete error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella rimozione del nodo' }, { status: 500 });
    }
}
