import React from 'react';
import { motion } from 'motion/react';
import { Flame, Star, Sparkles, Compass } from 'lucide-react';

export default function Sobre() {
  return (
    <section 
      id="sobre-section" 
      className="py-24 px-4 bg-stone-950 text-stone-100 relative overflow-hidden"
    >
      {/* Glow details */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-red-950/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header styling */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-[10px] uppercase font-sans font-black tracking-[0.3em] text-orange-500 bg-orange-950/30 border border-orange-500/10 px-3 py-1 rounded">
            A Nossa Missão
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-100 mt-4">
            Sobre o Projeto
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-amber-500 to-red-600 mt-4 rounded" />
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Column 1: Core Vision Card (5 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative group"
          >
            {/* Glowing background panel */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-orange-600/10 to-transparent rounded-3xl blur-xl opacity-60 pointer-events-none" />
            
            <div className="relative bg-gradient-to-b from-stone-900/90 to-stone-950 border border-amber-500/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Flame className="w-40 h-40 text-amber-500" />
              </div>
              
              <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
                <Compass className="w-6 h-6 text-amber-400" />
              </div>

              <h3 className="text-lg font-bold font-sans uppercase tracking-widest text-amber-400 mb-4">
                A Grande Visão
              </h3>

              <blockquote className="text-xl md:text-2xl font-serif italic text-stone-200 leading-relaxed tracking-wide">
                "Levantar, ativar e posicionar uma geração de mulheres incendiadas pelo Espírito Santo."
              </blockquote>

              <div className="mt-8 flex items-center gap-3">
                <div className="w-8 h-px bg-amber-500/30" />
                <span className="text-[10px] tracking-widest uppercase font-sans font-bold text-stone-400">
                  Imersão WEX 2026
                </span>
              </div>
            </div>
          </motion.div>

          {/* Column 2: Short visual text blocks (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Block 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex gap-4 items-start"
            >
              <div className="mt-1.5 p-1.5 bg-stone-900 border border-amber-500/20 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-amber-200 tracking-wide">
                  Despertar da Identidade
                </h4>
                <p className="mt-2 text-stone-400 text-sm leading-relaxed">
                  A Imersão WEX não é um evento comum. É uma intervenção espiritual desenhada para ajudar as mulheres a redescobrirem o seu valor original, despindo-se das falsas identidades impostas pelas pressões sociais ou dores do passado.
                </p>
              </div>
            </motion.div>

            {/* Block 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex gap-4 items-start"
            >
              <div className="mt-1.5 p-1.5 bg-stone-900 border border-amber-500/20 rounded-lg shrink-0">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-amber-200 tracking-wide">
                  Cura Emocional Profunda
                </h4>
                <p className="mt-2 text-stone-400 text-sm leading-relaxed">
                  Criamos um espaço de total acolhimento, onde a dor é tratada pela presença do Espírito Santo. Através de ministrações direcionadas, os bloqueios, mágoas e traumas são confrontados para dar lugar a uma cura interior genuína.
                </p>
              </div>
            </motion.div>

            {/* Block 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-4 items-start"
            >
              <div className="mt-1.5 p-1.5 bg-stone-900 border border-amber-500/20 rounded-lg shrink-0">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-amber-200 tracking-wide">
                  Ativação de Propósito
                </h4>
                <p className="mt-2 text-stone-400 text-sm leading-relaxed">
                  Entendemos que uma mulher curada é uma mulher perigosa para as trevas. A nossa missão final é posicionar cada participante para liderar, influenciar e restaurar as suas famílias, casamentos, finanças e carreiras de forma profética.
                </p>
              </div>
            </motion.div>

          </div>

        </div>

      </div>
    </section>
  );
}
