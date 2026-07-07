import React from 'react';
import { motion } from 'motion/react';
import { Oradora } from '../types/database';
import { Sparkles } from 'lucide-react';
import OradorasDesignPicker from './OradorasDesignPicker';

export default function OradorasSection() {

  const oradoras: Oradora[] = [
    {
      id: 'gilsa',
      nome: "Pra. Gilsa Bitumba",
      cargo: "Mentora Principal & Líder Espiritual da Imersão WEX",
      fotoUrl: "/images/preletoras/pra-gilsa-bitumba.png",
      isMain: true
    },
    {
      id: 'indira',
      nome: "Indira Luís Cariege",
      cargo: "Diaconisa, Terapeuta Emocional e Mentora Feminina",
      subtitulo: "Explosão Profética: Mulheres de Fogo",
      fotoUrl: "/images/preletoras/indira-luis-cariege.png"
    },
    {
      id: 'mari',
      nome: "Mari Pongue",
      cargo: "Convidada Especial de Louvor & Ministração",
      fotoUrl: "/images/preletoras/mari-pongue.png"
    },
    {
      id: 'daniela',
      nome: "Profetiza Daniela Mussumba",
      cargo: "Convidada de Ativação Profética e Revelação",
      fotoUrl: "/images/preletoras/daniela-mussumba.png"
    }
  ];

  return (
    <section 
      id="oradoras-section" 
      className="py-24 px-4 bg-stone-950 text-stone-100 relative overflow-hidden"
    >
      {/* Dynamic warm accent glows */}
      <div className="absolute top-0 right-10 w-[350px] h-[350px] bg-amber-600/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-red-600/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Title Block */}
        <div className="text-center mb-16">
          <div className="inline-flex p-2 bg-amber-500/10 border border-amber-500/15 rounded-full mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <span className="block text-[10px] uppercase font-sans font-black tracking-[0.3em] text-orange-500">
            Painel Espiritual
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-100 mt-4">
            Mentoras & Convocadas
          </h2>
          <p className="mt-4 text-sm text-stone-400 max-w-md mx-auto">
            Mulheres de autoridade espiritual chamadas para ativar a tua identidade e guiar a tua libertação emocional neste dia profético.
          </p>
        </div>

        {/* Design Picker & Cards */}
        <OradorasDesignPicker 
          oradoras={oradoras}
        />

      </div>
    </section>
  );
}
