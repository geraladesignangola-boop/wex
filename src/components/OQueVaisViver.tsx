import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, HeartPulse, Flame, ArrowUpRight, Compass } from 'lucide-react';

export default function OQueVaisViver() {
  const pilares = [
    {
      passo: "01",
      titulo: "Reconhecer identidade e valor",
      desc: "Despede-te do sentimento de rejeição, compreende quem és e assume em definitivo o teu lugar de filha amada e eleita.",
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />
    },
    {
      passo: "02",
      titulo: "Curar feridas e padrões limitantes",
      desc: "Liberta-te de dores antigas, quebras de padrões familiares negativos e rompe as amarras invisíveis do teu passado.",
      icon: <HeartPulse className="w-5 h-5 text-orange-500" />
    },
    {
      passo: "03",
      titulo: "Fortalecer conexão com Deus",
      desc: "Aproxima-te do Criador por meio de uma adoração profética e desenvolve clareza absoluta para escutar e seguir a Sua voz.",
      icon: <Flame className="w-5 h-5 text-amber-500" />
    },
    {
      passo: "04",
      titulo: "Despertar posicionamento como mulher",
      desc: "Descobre a força bíblica e o posicionamento prático para governares a tua vida com maturidade, graça, sabedoria e coragem.",
      icon: <Compass className="w-5 h-5 text-red-500" />
    },
    {
      passo: "05",
      titulo: "Viver uma nova versão de si mesma",
      desc: "Renasce das cinzas emocionais, acende o fogo interior e sai da imersão ativada para uma vida de autoridade e propósito.",
      icon: <ArrowUpRight className="w-5 h-5 text-yellow-400" />
    }
  ];

  return (
    <section 
      id="viver-section" 
      className="py-24 px-4 bg-stone-900 text-stone-100 relative overflow-hidden"
    >
      {/* Visual Fire background highlights */}
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-amber-600/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute left-10 top-10 w-80 h-80 bg-red-600/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-sans font-black tracking-[0.3em] text-amber-500 bg-amber-950/30 border border-amber-500/10 px-3 py-1 rounded">
            Experiência
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-100 mt-4">
            O que vais Viver nesta Imersão?
          </h2>
          <p className="mt-4 text-sm text-stone-400 max-w-md mx-auto">
            Uma jornada de 5 portais espirituais cuidadosamente estruturados para o teu renascimento integral neste único dia.
          </p>
        </div>

        {/* Bento/Responsive Grid of Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pilares.map((pilar, index) => {
            // Give the 5th card an ultra premium highlight since it's the culmination, and center it if on wide screen
            const isLast = index === 4;
            return (
              <motion.div
                key={pilar.passo}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                whileHover={{ y: -4, borderColor: 'rgba(245,158,11,0.25)' }}
                className={`p-6 rounded-2xl bg-stone-950 border transition-all duration-300 relative group overflow-hidden ${
                  isLast 
                    ? 'border-amber-500/30 md:col-span-2 lg:col-span-1 shadow-[0_10px_30px_rgba(245,158,11,0.05)] bg-gradient-to-b from-stone-950 via-stone-950 to-amber-950/20' 
                    : 'border-stone-800'
                }`}
              >
                {/* Floating step number */}
                <div className="absolute top-4 right-4 text-3xl font-mono font-black text-stone-800/40 group-hover:text-amber-500/20 transition-colors duration-300">
                  {pilar.passo}
                </div>

                {/* Card Icon & Top Row */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-xl bg-stone-900 border border-stone-800 group-hover:border-amber-500/30 transition-colors duration-300 ${isLast ? 'border-amber-500/20' : ''}`}>
                    {pilar.icon}
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 font-sans">
                    Fase {pilar.passo}
                  </span>
                </div>

                {/* Title & Desc */}
                <h3 className="text-lg font-bold font-serif text-amber-100 group-hover:text-amber-300 transition-colors duration-200 tracking-wide">
                  {pilar.titulo}
                </h3>
                
                <p className="mt-3 text-xs md:text-sm text-stone-400 leading-relaxed font-sans">
                  {pilar.desc}
                </p>

                {/* Bottom decorative ember lines */}
                {isLast && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400" />
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
