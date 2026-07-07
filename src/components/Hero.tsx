import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Coffee, MapPin, Ticket, Flame } from 'lucide-react';
import SeloMulheresDeFogo from './SeloMulheresDeFogo';

export default function Hero() {
  const scrollToForm = () => {
    const element = document.getElementById('form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="hero-section" 
      className="min-h-screen relative flex flex-col justify-center items-center py-24 px-4 bg-black text-stone-100 overflow-hidden"
    >
      {/* Dynamic Animated Ember Background */}
      <div className="absolute inset-0 bg-radial-gradient from-stone-900 via-stone-950 to-black z-0" />
      
      {/* Abstract Glowing Fire Backdrops */}
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/[0.04] blur-[160px] rounded-full pointer-events-none" />

      {/* Sparks SVG Overlays */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10%" cy="20%" r="2" fill="#F59E0B" className="animate-pulse" />
          <circle cx="85%" cy="15%" r="1.5" fill="#EF4444" />
          <circle cx="45%" cy="80%" r="3" fill="#EA580C" className="animate-ping" style={{ animationDuration: '4s' }} />
          <circle cx="90%" cy="70%" r="2" fill="#F59E0B" />
          <circle cx="15%" cy="60%" r="1" fill="#FFF" />
          <circle cx="70%" cy="40%" r="2.5" fill="#EA580C animate-pulse" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
        
        {/* Selo Mulheres de Fogo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <SeloMulheresDeFogo size={76} showText={false} />
        </motion.div>

        {/* Small Golden Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs md:text-sm font-sans font-bold uppercase tracking-[0.4em] text-amber-500 bg-amber-950/30 border border-amber-500/15 px-4 py-1.5 rounded-full mb-6 inline-block shadow-[0_2px_10px_rgba(245,158,11,0.05)]"
        >
          Luanda • Angola
        </motion.span>

        {/* Name / Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black font-serif tracking-tight leading-[1.1] text-amber-100 max-w-3xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
        >
          IMERSÃO WEX
          <span className="block mt-1 font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 font-black italic tracking-wide text-3xl sm:text-5xl md:text-6xl">
            WOMAN EXPERIENCE
          </span>
        </motion.h1>

        {/* Frase de Impacto */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-6 text-lg sm:text-2xl md:text-3xl font-serif italic text-stone-200 tracking-wide max-w-2xl border-y border-amber-500/10 py-4"
        >
          "Da dor à consciência. Da limitação à cura. Do silêncio ao fogo."
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 text-sm sm:text-base text-stone-400 font-sans max-w-lg leading-relaxed"
        >
          Uma imersão emocional e espiritual inesquecível, desenhada para curar as feridas da alma, recuperar a identidade e ativar o teu propósito eterno em Deus.
        </motion.p>

        {/* Call To Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md"
        >
          <button
            id="btn-hero-cta"
            onClick={scrollToForm}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-white font-bold uppercase tracking-widest text-xs shadow-[0_5px_25px_rgba(234,88,12,0.4)] flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Quero Garantir Minha Vaga</span>
            <Flame className="w-4 h-4 text-white animate-pulse group-hover:scale-110 transition-transform" />
          </button>
          
          <a
            id="btn-hero-learn"
            href="#sobre-section"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/20 text-stone-300 font-bold uppercase tracking-widest text-xs transition-colors duration-200 flex items-center justify-center gap-1.5"
          >
            Conhecer Visão
          </a>
        </motion.div>

        {/* Badges / Ticket Info Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 w-full max-w-4xl"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            {/* Badge: Data */}
            <div id="badge-data" className="flex flex-col items-center justify-center p-4 bg-stone-900/60 backdrop-blur border border-amber-500/10 rounded-2xl shadow-lg">
              <Calendar className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-[10px] text-stone-500 uppercase font-sans font-black tracking-widest">Data</span>
              <span className="text-sm font-bold text-amber-100 mt-1 font-serif">8 de Agosto</span>
            </div>

            {/* Badge: Horário */}
            <div id="badge-horario" className="flex flex-col items-center justify-center p-4 bg-stone-900/60 backdrop-blur border border-amber-500/10 rounded-2xl shadow-lg">
              <Clock className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-[10px] text-stone-500 uppercase font-sans font-black tracking-widest">Horário</span>
              <span className="text-sm font-bold text-amber-100 mt-1 font-serif">9h às 17h</span>
            </div>

            {/* Badge: Coffee-break */}
            <div id="badge-coffee" className="flex flex-col items-center justify-center p-4 bg-stone-900/60 backdrop-blur border border-amber-500/10 rounded-2xl shadow-lg col-span-2 sm:col-span-1">
              <Coffee className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-[10px] text-stone-500 uppercase font-sans font-black tracking-widest">Alimentação</span>
              <span className="text-sm font-bold text-amber-100 mt-1 font-serif">Com Coffee Break</span>
            </div>

            {/* Badge: Local */}
            <div id="badge-local" className="flex flex-col items-center justify-center p-4 bg-stone-900/60 backdrop-blur border border-amber-500/10 rounded-2xl shadow-lg col-span-1">
              <MapPin className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-[10px] text-stone-500 uppercase font-sans font-black tracking-widest">Local</span>
              <span className="text-xs font-bold text-amber-100 mt-1 font-serif text-center">Mediateca de Luanda</span>
            </div>

            {/* Badge: Entrada */}
            <div id="badge-entrada" className="flex flex-col items-center justify-center p-4 bg-stone-950 border border-orange-500/30 rounded-2xl shadow-lg col-span-1 shadow-orange-950/20">
              <Ticket className="w-5 h-5 text-orange-500 mb-2" />
              <span className="text-[10px] text-orange-400 uppercase font-sans font-black tracking-widest">Entrada</span>
              <span className="text-xs font-black text-amber-100 mt-1 uppercase tracking-wide text-center">Grátis (Vagas Lim.)</span>
            </div>

          </div>
        </motion.div>

      </div>

      {/* Elegant Fade bottom divider */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
    </section>
  );
}
