import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
        }

        const { query, modalita, bodyPart } = await req.json();

        // 1. Search local database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const localWhere: any = {};
        if (modalita) localWhere.modalita = modalita;
        if (bodyPart) localWhere.bodyPart = { contains: bodyPart };
        if (query) {
            localWhere.OR = [
                { descrizione: { contains: query } },
                { referto: { contains: query } },
                { note: { contains: query } },
                { patient: { cognome: { contains: query } } },
                { patient: { nome: { contains: query } } },
            ];
        }

        const localStudies = await prisma.study.findMany({
            where: localWhere,
            include: {
                patient: { select: { id: true, nome: true, cognome: true, codiceFiscale: true } },
                medicoRichiedente: { select: { id: true, nome: true, cognome: true } },
                medicoRefertante: { select: { id: true, nome: true, cognome: true } },
                _count: { select: { series: true, firme: true } },
            },
            orderBy: { dataStudio: 'desc' },
            take: 20,
        });

        // 2. Search federated nodes in parallel
        const nodes = await prisma.federatedNode.findMany({
            where: { attivo: true },
        });

        const federatedResults = await Promise.allSettled(
            nodes.map(async (node) => {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);

                    const res = await fetch(`${node.endpoint}/search`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Federation-Key': node.apiKey,
                        },
                        body: JSON.stringify({ query, modalita, bodyPart }),
                        signal: controller.signal,
                    });

                    clearTimeout(timeout);

                    if (!res.ok) return { nodeId: node.id, nodeName: node.nome, paese: node.paese, studies: [] };

                    const data = await res.json();
                    return {
                        nodeId: node.id,
                        nodeName: node.nome,
                        paese: node.paese,
                        studies: data.data || [],
                    };
                } catch {
                    return { nodeId: node.id, nodeName: node.nome, paese: node.paese, studies: [], error: 'timeout/unreachable' };
                }
            })
        );

        const remoteResults = federatedResults
            .filter((r) => r.status === 'fulfilled')
            .map((r) => (r as PromiseFulfilledResult<{ nodeId: string; nodeName: string; paese: string; studies: unknown[] }>).value);

        return NextResponse.json({
            success: true,
            data: {
                local: {
                    nodeId: 'local',
                    nodeName: process.env.FEDERATION_NODE_NAME || 'Andromeda-Local',
                    paese: 'IT',
                    studies: localStudies,
                },
                federated: remoteResults,
                totalNodes: 1 + nodes.length,
                respondingNodes: 1 + remoteResults.filter((r) => !('error' in r)).length,
            },
        });
    } catch (error) {
        console.error('Federated search error:', error);
        return NextResponse.json({ success: false, error: 'Errore nella ricerca federata' }, { status: 500 });
    }
}
