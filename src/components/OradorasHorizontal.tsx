import React from 'react';
import { motion } from 'motion/react';
import { Oradora } from '../types';

export default function OradorasHorizontal() {
  const oradoras: Oradora[] = [
    {
      id: 'gilsa',
      nome: "Pra. Gilsa Bitumba",
      cargo: "MENTORA PRINCIPAL & LÍDER ESPIRITUAL DA IMERSÃO WEX",
      fotoUrl: "/images/preletoras/Pastora Gilsa Bitumba.png",
    },
    {
      id: 'indira',
      nome: "Indira Luís Cariege",
      cargo: "DIACONISA, TERAPEUTA EMOCIONAL E MENTORA FEMININA",
      subtitulo: "EXPLOSÃO PROFÉTICA: MULHERES DE FOGO",
      fotoUrl: "/images/preletoras/Indira Luís cariege.png",
    },
    {
      id: 'mari',
      nome: "Mari Pongue",
      cargo: "CONVIDADA ESPECIAL DE LOUVOR & MINISTRAÇÃO",
      fotoUrl: "/images/preletoras/Mari Pongue.png",
    },
    {
      id: 'daniela',
      nome: "Profetiza Daniela Mussumba",
      cargo: "CONVIDADA DE ATIVAÇÃO PROFÉTICA E REVELAÇÃO",
      fotoUrl: "/images/preletoras/Profetiza Daniela Mussumba.png",
    }
  ];

  return (
    <section 
      id="oradoras-horizontal-section"
      className="py-16 bg-[#0a0a0a] overflow-hidden"
    >
      {/* Title */}
      <div className="text-center mb-12 px-4">
        <span className="block text-[10px] uppercase font-sans font-black tracking-[0.3em] text-orange-500 mb-2">
          Painel Espiritual
        </span>
        <h2 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-100">
          Mentoras & Convocadas
        </h2>
      </div>

      {/* Horizontal Cards Container */}
      <div className="flex w-full h-[500px] md:h-[600px]">
        {oradoras.map((oradora, index) => (
          <motion.div
            key={oradora.id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className="relative group flex-1 md:flex-none md:w-[25%] overflow-hidden cursor-pointer"
          >
            {/* Background Image */}
            {oradora.fotoUrl ? (
              <img
                src={oradora.fotoUrl}
                alt={oradora.nome}
                className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 ease-out md:group-hover:scale-105 md:group-hover:w-[130%]"
                style={{ transformOrigin: 'left center' }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950" />
            )}

            {/* Dark Gradient Overlay - Right Side */}
            <div 
              className="absolute inset-0 transition-all duration-500 ease-out md:group-hover:opacity-60"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,1) 100%)'
              }}
            />

            {/* Mobile: Bottom Gradient */}
            <div 
              className="absolute inset-0 md:hidden"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0) 60%)'
              }}
            />

            {/* Text Content - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 md:right-[20%] p-6 md:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
              >
                {/* Decorative Line */}
                <div className="w-10 h-[2px] bg-amber-500 mb-4 transform origin-left" />
                
                {/* Name */}
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide leading-tight mb-2">
                  {oradora.nome}
                </h3>
                
                {/* Function/Role */}
                <p className="text-[10px] md:text-xs text-white/80 uppercase tracking-wider leading-relaxed mb-2">
                  {oradora.cargo}
                </p>
                
                {/* Highlight Text - Golden */}
                {oradora.subtitulo && (
                  <span className="inline-block text-[10px] md:text-xs text-[#C9972C] uppercase tracking-widest font-medium">
                    {oradora.subtitulo}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Subtle hover shine effect */}
            <div className="absolute inset-0 opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-white/5 via-transparent to-transparent" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
