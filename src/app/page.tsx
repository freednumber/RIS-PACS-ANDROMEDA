'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NeuralBackground from '@/components/NeuralBackground';

export default function LoginPage() {
  const router = useRouter();
  const [accessType, setAccessType] = useState<'PAZIENTE' | 'MEDICO' | 'TSRM' | 'SEGRETERIA'>('PAZIENTE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: 'paziente@test.it',
    password: 'password123',
  });

  useEffect(() => {
    switch (accessType) {
      case 'PAZIENTE':
        setForm({ email: 'paziente@test.it', password: 'password123' });
        break;
      case 'MEDICO':
        setForm({ email: 'medico@test.it', password: 'password123' });
        break;
      case 'TSRM':
        setForm({ email: 'tsrm@test.it', password: 'password123' });
        break;
      case 'SEGRETERIA':
        setForm({ email: 'segreteria@test.it', password: 'password123' });
        break;
    }
  }, [accessType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Errore durante l\'autenticazione');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  const roles = ['PAZIENTE', 'MEDICO', 'TSRM', 'SEGRETERIA'];
  const selectedIndex = roles.indexOf(accessType);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">

      {/* --- CUSTOM CSS ANIMATIONS INJECTED HERE --- */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes fade-up-staggered {
          0% { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        .animate-floating { animation: floating 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .fade-up-1 { animation: fade-up-staggered 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both; }
        .fade-up-2 { animation: fade-up-staggered 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both; }
        .fade-up-3 { animation: fade-up-staggered 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both; }
        .fade-up-4 { animation: fade-up-staggered 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both; }
        .fade-up-5 { animation: fade-up-staggered 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both; }
        .fade-up-6 { animation: fade-up-staggered 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s both; }
      `}} />

      {/* Left Panel: Hero Branding */}
      <div className="relative w-full lg:w-[50%] min-h-[40vh] lg:min-h-screen bg-[#04151a] flex flex-col items-center justify-center overflow-hidden">

        {/* Background Canvas Effect */}
        <div className="absolute inset-0 z-0">
          <NeuralBackground />
        </div>

        {/* Soft immersive dark teal background overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#004d4d]/30 via-[#04151a]/90 to-[#020a0d] z-0 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center mt-[-5%]">

          {/* Wrapper for perfectly centered logo and wide soft radial glow */}
          <div className="w-full flex justify-center items-center mb-10 relative">

            {/* The distinct, soft, wide radial glow epicentered exactly with the logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-[radial-gradient(circle_at_center,#008080_0%,transparent_60%)] animate-pulse-glow z-0 blur-[60px] sm:blur-[100px] pointer-events-none"></div>

            {/* Drastically increased floating logo (scaled up 20-30%) */}
            <div className="animate-floating relative z-10">
              <div
                className="w-72 h-72 sm:w-[400px] sm:h-[400px] drop-shadow-[0_0_50px_rgba(0,128,128,0.7)]"
                style={{
                  background: 'linear-gradient(135deg, #20b2aa 0%, #008080 100%)',
                  WebkitMaskImage: 'url(/andromeda-logo.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url(/andromeda-logo.png)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }}
              />
            </div>
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-2 font-sans drop-shadow-2xl fade-up-1">
            ANDROMEDA
          </h1>
          <p className="text-lg lg:text-2xl text-teal-100/70 font-light tracking-[0.3em] uppercase drop-shadow-md fade-up-2">
            RIS-PACS System
          </p>
        </div>
      </div>

      {/* Right Panel: Innovative & Fluid UI */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-white">
        <div className="w-full max-w-md relative z-10">

          {/* Dynamic "Sliding Pill" Tabs */}
          <div className="relative flex mb-12 p-1.5 rounded-[1.25rem] bg-slate-50 border border-slate-100 shadow-inner fade-up-1">
            {/* The absolute sliding background pill */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-[1rem] bg-[#008080] shadow-[0_4px_12px_rgba(0,128,128,0.4)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
              style={{
                width: 'calc(25% - 4.5px)',
                left: `calc(${selectedIndex * 25}% + 3px)`
              }}
            />
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setAccessType(role as any)}
                className={`relative z-10 flex-1 py-3.5 px-1 text-[10px] sm:text-[11px] font-bold tracking-widest transition-colors duration-300 uppercase ${accessType === role ? 'text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
              >
                {role === 'PAZIENTE' ? 'Paziente' : role === 'MEDICO' ? 'Medico' : role === 'TSRM' ? 'TSRM' : 'Segreteria'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-[fade-up-staggered_0.4s_ease-out_both] flex items-center gap-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Input 1: Floating Label & Expanding Underline */}
            <div className="relative fade-up-2 group rounded-t-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input
                type="text"
                id="emailField"
                className="peer w-full bg-transparent border-b-2 border-slate-200 px-5 pt-7 pb-2.5 text-slate-600 focus:outline-none font-medium placeholder-transparent rounded-t-xl"
                placeholder=" "
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <label
                htmlFor="emailField"
                className="absolute left-5 text-slate-400 font-bold uppercase transition-all duration-300 pointer-events-none
                           peer-placeholder-shown:top-5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:tracking-wider peer-placeholder-shown:normal-case peer-placeholder-shown:font-medium
                           peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#008080] peer-focus:uppercase peer-focus:font-bold
                           top-2 text-[10px] text-slate-500"
              >
                {accessType === 'PAZIENTE' ? "mario.rossi@email.it / Codice Fiscale" : "ID Aziendale o Email"}
              </label>
              {/* Center-out expanded underline */}
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#008080] scale-x-0 origin-center peer-focus:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"></div>
            </div>

            {/* Input 2: Floating Label, Show Password Toggle & Expanding Underline */}
            <div className="relative fade-up-3 group rounded-t-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input
                type={showPassword ? 'text' : 'password'}
                id="passwordField"
                className="peer w-full bg-transparent border-b-2 border-slate-200 pl-5 pr-14 pt-7 pb-2.5 text-slate-600 focus:outline-none font-medium placeholder-transparent rounded-t-xl"
                placeholder=" "
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <label
                htmlFor="passwordField"
                className="absolute left-5 text-slate-400 font-bold uppercase transition-all duration-300 pointer-events-none
                           peer-placeholder-shown:top-5 peer-placeholder-shown:text-[13px] peer-placeholder-shown:tracking-wider peer-placeholder-shown:normal-case peer-placeholder-shown:font-medium
                           peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-[#008080] peer-focus:uppercase peer-focus:font-bold
                           top-2 text-[10px] text-slate-500"
              >
                Password
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-[#008080] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>

              {/* Center-out expanded underline */}
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#008080] scale-x-0 origin-center peer-focus:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"></div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mt-8 fade-up-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded group-hover:border-[#008080] peer-checked:bg-[#008080] peer-checked:border-[#008080] peer-checked:scale-[1.05] transition-all duration-300 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 fill-white opacity-0 peer-checked:opacity-100 peer-checked:scale-100 scale-50 transition-all duration-300" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
                  Ricorda accesso
                </span>
              </label>
              <a href="#" className="text-[13px] font-bold text-slate-400 hover:text-[#008080] transition-colors">
                Hai dimenticato la password?
              </a>
            </div>

            {/* Glowing morphing button */}
            <div className="mt-10 fade-up-5">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 text-sm font-bold rounded-2xl text-white transition-all duration-300 overflow-hidden bg-[linear-gradient(110deg,#008080,#14b8a6,#008080)] hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_25px_rgba(0,128,128,0.35)] focus:outline-none focus:ring-4 focus:ring-[#008080]/20 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ backgroundSize: '200% auto' }}
              >
                {/* Shiny hover effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_2s_infinite]"></div>

                {loading ? (
                  <div className="flex items-center gap-2">
                    {/* Morphing Spinner */}
                    <div className="flex space-x-1.5 items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-white rounded-full animate-bounce"></div>
                    </div>
                  </div>
                ) : (
                  <span className="tracking-wide">ACCEDI AL SISTEMA</span>
                )}
              </button>
            </div>

          </form>

          <div className="mt-12 text-center fade-up-6">
            <p className="text-[10px] font-bold tracking-widest text-[#008080]/40 uppercase">
              Secure Medical Environment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
