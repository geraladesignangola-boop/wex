import React from 'react';
import { motion } from 'motion/react';
import { Oradora } from '../types/database';

interface DesignPickerProps {
  oradoras: Oradora[];
}

function EditorialPanelsCard({ oradora, index }: { oradora: Oradora; index: number }) {
  const initials = oradora.nome.split(' ').filter((_, i, arr) => i === 0 || i === arr.length - 1).map(n => n[0]).join('');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative group h-[500px] bg-black overflow-hidden cursor-pointer"
    >
      {/* Photo - aligned to face area */}
      {oradora.fotoUrl ? (
        <img 
          src={oradora.fotoUrl} 
          alt={oradora.nome} 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out"
          style={{ objectPosition: 'center 15%' }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-stone-800 to-black flex items-center justify-center">
          <span className="text-6xl font-bold text-stone-600">{initials}</span>
        </div>
      )}
      
      {/* Dark bar overlay - slides right on hover to reveal photo */}
      <div className="absolute top-0 right-0 w-[45%] h-full bg-black/85 backdrop-blur-sm transition-all duration-500 ease-out group-hover:w-0 group-hover:opacity-0" />
      
      {/* Names on left with dark gradient - fades on hover */}
      <div className="absolute bottom-0 left-0 w-[55%] p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-500 group-hover:from-black/70 group-hover:via-black/30">
        <div className="w-8 h-[2px] bg-amber-500 mb-3 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100" />
        <h3 className="text-lg font-bold text-white tracking-wide leading-tight group-hover:text-amber-100 transition-colors duration-300">{oradora.nome}</h3>
        <p className="text-[10px] text-stone-400 mt-2 uppercase tracking-wider leading-relaxed group-hover:text-stone-300 transition-colors duration-300">{oradora.cargo}</p>
        {oradora.subtitulo && (
          <span className="inline-block mt-2 text-[9px] text-amber-400 uppercase tracking-widest leading-relaxed group-hover:text-amber-300 transition-colors duration-300">
            {oradora.subtitulo}
          </span>
        )}
      </div>
      
      {/* Subtle side accent line */}
      <div className="absolute top-0 left-0 w-[2px] h-0 bg-amber-500 group-hover:h-full transition-all duration-700" />
    </motion.div>
  );
}

export default function OradorasDesignPicker({ oradoras }: DesignPickerProps) {
  return (
    <div className="mb-12">
      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        {oradoras.map((oradora, index) => (
          <div key={oradora.id}>
            <EditorialPanelsCard oradora={oradora} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
