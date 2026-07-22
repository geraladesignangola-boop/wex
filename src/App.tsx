import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Instagram, Facebook, Phone, Mail, ArrowUp, Menu, X, Check, Lock } from 'lucide-react';

// Custom Components
import Hero from './components/Hero';
import Sobre from './components/Sobre';
import ParaQuem from './components/ParaQuem';
import OQueVaisViver from './components/OQueVaisViver';
import OradorasSection from './components/OradorasSection';
import DetalhesPraticos from './components/DetalhesPraticos';
import InscricaoForm from './components/InscricaoForm';
import SeloMulheresDeFogo from './components/SeloMulheresDeFogo';

// Pages
import ConvitePage from './pages/ConvitePage';
import AdminPanel from './pages/AdminPanel';
import CheckInPage from './pages/CheckInPage';
import TermosPage from './pages/TermosPage';

// Lib
import { supabase, isSupabaseConfigured } from './lib/supabase';

function MainPage() {
  const [showMobileCta, setShowMobileCta] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);

  useEffect(() => {
    const fetchInscricoesStatus = async () => {
      if (!isSupabaseConfigured) return
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'inscricoes_abertas')
          .single()
        if (data?.value) setInscricoesAbertas(data.value !== 'false')
      } catch {
        // default to open
      }
    }
    fetchInscricoesStatus()
  }, [])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const timer = setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const formElement = document.getElementById('form-section');
      
      if (formElement) {
        const formTop = formElement.offsetTop;
        const windowHeight = window.innerHeight;
        
        const isPastHero = scrollY > 400;
        const isBeforeForm = scrollY < formTop - (windowHeight / 2);
        
        setShowMobileCta(isPastHero && isBeforeForm);
      } else {
        setShowMobileCta(scrollY > 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="wex-app-root" className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-orange-600/30 selection:text-white">
      
      {/* GLASSMORPHIC STICKY HEADER */}
      <header 
        id="wex-main-header"
        className="sticky top-0 z-50 w-full bg-stone-950/80 backdrop-blur-md border-b border-stone-900/60 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div 
            className="flex items-center group"
          >
            <button
              type="button"
              onClick={() => scrollToSection('hero-section')}
              aria-label="Voltar ao início"
              className="flex items-center"
            >
              <img 
                src="/images/Logo_mulheresde_fogo.png" 
                alt="Mulheres de Fogo" 
                className="w-35 h-35 object-contain drop-shadow-[0_2px_6px_rgba(234,88,12,0.5)]"
              />
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-stone-400">
            <button 
              onClick={() => scrollToSection('sobre-section')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Visão
            </button>
            <button 
              onClick={() => scrollToSection('para-quem-section')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Para Quem
            </button>
            <button 
              onClick={() => scrollToSection('viver-section')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              O que Vais Viver
            </button>
            <button 
              onClick={() => scrollToSection('oradoras-section')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Mentoras
            </button>
            <button 
              onClick={() => scrollToSection('detalhes-section')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Logística
            </button>
          </nav>

          <div className="hidden md:block">
            {inscricoesAbertas ? (
              <button
                id="header-cta-btn"
                onClick={() => scrollToSection('form-section')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_15px_rgba(234,88,12,0.3)] cursor-pointer"
              >
                Garantir Vaga <Flame className="w-3 h-3 inline" />
              </button>
            ) : (
              <span className="px-5 py-2.5 rounded-xl bg-stone-800 text-stone-500 font-bold text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Inscrições Encerradas
              </span>
            )}
          </div>

          <button
            id="mobile-menu-toggle"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-stone-950 border-t border-stone-900 overflow-hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-4 flex flex-col font-bold text-xs uppercase tracking-widest text-stone-400">
                <button 
                  onClick={() => scrollToSection('sobre-section')} 
                  className="py-2 text-left hover:text-amber-400 transition-colors"
                >
                  Visão
                </button>
                <button 
                  onClick={() => scrollToSection('para-quem-section')} 
                  className="py-2 text-left hover:text-amber-400 transition-colors"
                >
                  Para Quem
                </button>
                <button 
                  onClick={() => scrollToSection('viver-section')} 
                  className="py-2 text-left hover:text-amber-400 transition-colors"
                >
                  O que Vais Viver
                </button>
                <button 
                  onClick={() => scrollToSection('oradoras-section')} 
                  className="py-2 text-left hover:text-amber-400 transition-colors"
                >
                  Mentoras
                </button>
                <button 
                  onClick={() => scrollToSection('detalhes-section')} 
                  className="py-2 text-left hover:text-amber-400 transition-colors"
                >
                  Logística
                </button>
                
                <button
                  id="mobile-menu-cta"
                  onClick={() => scrollToSection('form-section')}
                  disabled={!inscricoesAbertas}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    inscricoesAbertas
                      ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-[0_4px_15px_rgba(234,88,12,0.3)]'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  {inscricoesAbertas ? 'Garantir Vaga 🔥' : 'Inscrições Encerradas'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* SECTIONS LAYOUT */}
      <main id="wex-main-content">
        <Hero />
        <Sobre />
        <ParaQuem />
        <OQueVaisViver />
        <OradorasSection />
        <DetalhesPraticos />
        <InscricaoForm />
      </main>

      {/* COMPREHENSIVE PREMIUM FOOTER */}
      <footer 
        id="wex-footer"
        className="bg-black text-stone-400 py-16 px-4 border-t border-stone-900 relative overflow-hidden"
      >
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-red-950/5 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center">
          
          <SeloMulheresDeFogo size={80} showText={true} className="mb-8" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center max-w-xl w-full border-t border-b border-stone-900 py-8 mb-8 text-xs font-medium">
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-amber-500">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-stone-500 uppercase text-[9px] font-bold tracking-widest">Contacto Suporte / Organização</span>
              <a href="tel:+244932583167" className="text-stone-200 hover:text-amber-400 transition-colors font-mono">
                +244 932 583 167
              </a>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-amber-500">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-stone-500 uppercase text-[9px] font-bold tracking-widest">E-mail Oficial</span>
              <a href="mailto:geral@womanexperience.ao" className="text-stone-200 hover:text-amber-400 transition-colors font-mono">
                geral@womanexperience.ao
              </a>
            </div>

          </div>

          <div className="flex gap-4 mb-8">
            <a 
              href="https://www.instagram.com/muf.mulheresdefogo/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-3 bg-stone-900/50 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/25 rounded-full text-stone-400 hover:text-amber-400 transition-all duration-300"
              aria-label="Instagram Mulheres de Fogo"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=61583199112349" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-stone-900/50 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/25 rounded-full text-stone-400 hover:text-amber-400 transition-all duration-300"
              aria-label="Facebook Mulheres de Fogo"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>

          <blockquote className="text-xl md:text-2xl font-serif italic text-amber-200 text-center tracking-wide mb-8 max-w-md leading-relaxed drop-shadow">
            "Levanta-te, mulher. O fogo já está em ti."
          </blockquote>

          <div className="text-center text-[10px] text-stone-600 space-y-1 select-none">
            <p>© {new Date().getFullYear()} IMERSÃO WEX — WOMAN EXPERIENCE.</p>
            <p>Todos os direitos reservados • Mediateca de Luanda, Angola.</p>
            <p>
              <a href="/termos" className="hover:text-amber-500 transition-colors">Termos de Participação & Privacidade</a>
            </p>
          </div>

        </div>
      </footer>

      {/* FLOATING CTA FOR MOBILE DEVICES */}
      <AnimatePresence>
        {showMobileCta && inscricoesAbertas && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 inset-x-4 z-40 md:hidden"
          >
            <button
              id="mobile-floating-cta"
              onClick={() => scrollToSection('form-section')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(239,68,68,0.5)] active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
              <span>Garantir Vaga Gratuita</span>
              <Flame className="w-4 h-4 text-white animate-bounce" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:block fixed bottom-6 right-6 z-40">
        <button
          id="btn-scroll-to-top"
          onClick={() => scrollToSection('hero-section')}
          className="p-3 rounded-full bg-stone-900/80 hover:bg-amber-500 border border-stone-800 hover:border-amber-400 text-stone-400 hover:text-stone-950 transition-all duration-300 shadow-xl group cursor-pointer"
          title="Voltar ao início"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-black font-serif text-amber-100">Página não encontrada</h1>
        <p className="mt-3 text-stone-400 text-sm">
          O endereço pedido não existe. Volta à página principal para continuar.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-bold text-xs uppercase tracking-widest"
        >
          Ir para o início
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/convite" element={<ConvitePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
