import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createToken, setAuthCookie, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, nome, cognome, ruolo } = body;

        if (action === 'register') {
            // Check if user exists
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json(
                    { success: false, error: 'Email già registrata' },
                    { status: 400 }
                );
            }

            const hashedPassword = await hashPassword(password);
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    nome,
                    cognome,
                    ruolo: ruolo || 'MEDICO',
                },
            });

            const token = await createToken({
                id: user.id,
                email: user.email,
                nome: user.nome,
                cognome: user.cognome,
                ruolo: user.ruolo,
            });

            await setAuthCookie(token);

            return NextResponse.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    nome: user.nome,
                    cognome: user.cognome,
                    ruolo: user.ruolo,
                },
            });
        }

        if (action === 'login') {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.attivo) {
                return NextResponse.json(
                    { success: false, error: 'Credenziali non valide' },
                    { status: 401 }
                );
            }

            const valid = await verifyPassword(password, user.password);
            if (!valid) {
                return NextResponse.json(
                    { success: false, error: 'Credenziali non valide' },
                    { status: 401 }
                );
            }

            const token = await createToken({
                id: user.id,
                email: user.email,
                nome: user.nome,
                cognome: user.cognome,
                ruolo: user.ruolo,
            });

            await setAuthCookie(token);

            return NextResponse.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    nome: user.nome,
                    cognome: user.cognome,
                    ruolo: user.ruolo,
                },
            });
        }

        return NextResponse.json(
            { success: false, error: 'Azione non valida' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { success: false, error: 'Errore del server' },
            { status: 500 }
        );
    }
}
