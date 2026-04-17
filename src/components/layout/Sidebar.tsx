'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Ruolo } from '@/types';

type NavItem = {
    href: string;
    label: string;
    roles: Ruolo[];
    icon: React.ReactNode;
};

const navItems: NavItem[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        roles: ['ADMIN', 'MEDICO', 'TECNICO', 'SEGRETERIA'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
        ),
    },
    {
        href: '/dashboard/pazienti',
        label: 'Pazienti',
        roles: ['ADMIN', 'MEDICO', 'TECNICO', 'SEGRETERIA'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        href: '/dashboard/studi',
        label: 'Studi Radiologici',
        roles: ['ADMIN', 'MEDICO', 'TECNICO', 'SEGRETERIA'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <path d="M7 2v20" />
                <path d="M17 2v20" />
                <path d="M2 12h20" />
                <path d="M2 7h5" />
                <path d="M2 17h5" />
                <path d="M17 7h5" />
                <path d="M17 17h5" />
            </svg>
        ),
    },
    {
        href: '/dashboard/upload',
        label: 'Carica DICOM',
        roles: ['ADMIN', 'TECNICO', 'SEGRETERIA', 'MEDICO'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        ),
    },
    {
        href: '/dashboard/agente',
        label: 'Agente AI',
        roles: ['ADMIN', 'MEDICO'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
        ),
    },
    {
        href: '/dashboard/federazione',
        label: 'Federazione',
        roles: ['ADMIN', 'SEGRETERIA'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
        ),
    },
    {
        href: '/dashboard/casi-studio',
        label: 'Casi Studio',
        roles: ['ADMIN', 'MEDICO'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
    // ── PAZIENTE NAV ──
    {
        href: '/dashboard/paziente',
        label: 'La mia Area',
        roles: ['PAZIENTE'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
        ),
    },
    {
        href: '/dashboard/paziente/prenota',
        label: 'Prenota Esame',
        roles: ['PAZIENTE'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" />
                <line x1="10" y1="16" x2="14" y2="16" />
            </svg>
        ),
    },
    {
        href: '/dashboard/paziente/appuntamenti',
        label: 'Appuntamenti',
        roles: ['PAZIENTE'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        href: '/dashboard/paziente/profilo',
        label: 'I miei Dati',
        roles: ['PAZIENTE'],
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [userRole, setUserRole] = useState<Ruolo | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setUserRole(data.data.ruolo as Ruolo);
                }
            })
            .catch(console.error);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const visibleLinks = navItems.filter(item => userRole ? item.roles.includes(userRole) : false);

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col p-4 border-r"
            style={{ background: 'rgba(15, 23, 42, 0.95)', borderColor: 'var(--color-border)' }}>
            {/* Logo */}
            <div className="flex flex-col items-center gap-1 mb-10 px-3 pt-4 text-center">
                <div className="w-36 h-36 shrink-0 drop-shadow-[0_0_20px_rgba(0,212,190,0.6)]"
                    style={{
                        background: 'linear-gradient(135deg, #00D4BE 0%, #008080 100%)',
                        WebkitMaskImage: 'url(/andromeda-logo.png)',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: 'url(/andromeda-logo.png)',
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center'
                    }} />
                <div>
                    <h2 className="font-bold text-2xl text-white leading-tight mb-1">Andromeda</h2>
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-bold text-[#00D4BE] uppercase tracking-[0.3em] mb-1">
                            {userRole === 'PAZIENTE' ? 'PORTALE' : 
                             userRole === 'MEDICO' ? 'AREA' : 
                             userRole === 'TECNICO' ? 'TSRM' : 
                             userRole === 'SEGRETERIA' ? 'SEGRETERIA' : 'SISTEMA'}
                        </p>
                        <p className="text-[10px] font-bold text-white uppercase tracking-[0.3em] opacity-80">
                            {userRole === 'PAZIENTE' ? 'PAZIENTE' : 
                             userRole === 'MEDICO' ? 'MEDICA' : 
                             userRole === 'TECNICO' ? 'LOG' : 
                             userRole === 'SEGRETERIA' ? 'HUB' : 'DIREZIONALE'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1">
                {visibleLinks.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--color-border)' }}>
                <button
                    onClick={handleLogout}
                    className="sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Esci</span>
                </button>
            </div>
        </aside>
    );
}
