import React from 'react';
import { motion } from 'motion/react';
import { Oradora } from '../types';
import { Shield, Sparkles, Flame, Star } from 'lucide-react';

interface OradoraCardProps {
  oradora: Oradora;
  index: number;
}

export default function OradoraCard({ oradora, index }: OradoraCardProps) {
  // Generate a premium gradient based on the speaker's role
  const getGradientAndIcon = (id: string) => {
    switch (id) {
      case 'gilsa':
        return {
          bg: 'from-amber-600 via-orange-600 to-red-700',
          glow: 'rgba(245,158,11,0.3)',
          icon: <Flame className="w-6 h-6 text-amber-300" />,
          label: 'Mentora Principal',
        };
      case 'indira':
        return {
          bg: 'from-yellow-500 via-amber-600 to-amber-900',
          glow: 'rgba(217,119,6,0.25)',
          icon: <Shield className="w-6 h-6 text-amber-300" />,
          label: 'Explosão Profética',
        };
      case 'mari':
        return {
          bg: 'from-orange-500 via-red-600 to-stone-900',
          glow: 'rgba(234,88,12,0.25)',
          icon: <Star className="w-6 h-6 text-orange-300" />,
          label: 'Convidada Especial',
        };
      case 'daniela':
        return {
          bg: 'from-amber-500 via-red-700 to-stone-950',
          glow: 'rgba(245,158,11,0.25)',
          icon: <Sparkles className="w-6 h-6 text-amber-200" />,
          label: 'Profetiza Convidada',
        };
      default:
        return {
          bg: 'from-amber-500 to-red-600',
          glow: 'rgba(245,158,11,0.2)',
          icon: <Flame className="w-6 h-6 text-amber-300" />,
          label: 'Convidada',
        };
    };
  };

  const { bg, glow, icon, label } = getGradientAndIcon(oradora.id);
  const initials = oradora.nome
    .split(' ')
    .filter((n, i) => i === 0 || (oradora.nome.split(' ').length > 1 && i === oradora.nome.split(' ').length - 1))
    .map(n => n[0])
    .join('');

  return (
    <motion.div
      id={`oradora-card-${oradora.id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -6 }}
      className="relative flex flex-col items-center p-6 rounded-2xl bg-gradient-to-b from-stone-900/90 to-stone-950/90 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 group overflow-hidden"
    >
      {/* Decorative Golden Fire Mesh Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,88,12,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/5 blur-xl rounded-full group-hover:bg-amber-500/10 transition-colors duration-500 pointer-events-none" />

      {/* Elegant Badge */}
      <div className="mb-4 px-3 py-1 rounded-full text-[10px] tracking-[0.15em] font-bold uppercase bg-amber-950/60 border border-amber-500/20 text-amber-400">
        {label}
      </div>

      {/* Circular Glow Avatar Slot */}
      <div 
        id={`avatar-wrapper-${oradora.id}`}
        className="relative mb-6"
      >
        {/* Pulsing Backlight Halo */}
        <div 
          className="absolute inset-0 rounded-full blur-xl scale-110 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
          style={{ 
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` 
          }} 
        />
        
        {/* Animated Outer Golden Border */}
        <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-amber-600/30 via-orange-500 to-amber-300/30 group-hover:scale-105 transition-transform duration-500 ease-out">
          {/* Inner dark buffer */}
          <div className="w-full h-full rounded-full bg-stone-950 p-1 flex items-center justify-center">
            {/* The Avatar Core */}
            <div className={`w-full h-full rounded-full bg-gradient-to-br ${bg} flex flex-col items-center justify-center relative overflow-hidden group-hover:brightness-110 transition-all duration-500 shadow-inner`}>
              
              {oradora.fotoUrl ? (
                <img 
                  src={oradora.fotoUrl} 
                  alt={oradora.nome}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <>
                  {/* Overlay Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                  
                  {/* Initials with Metallic Text Glow */}
                  <span className="text-3xl font-bold font-serif tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                    {initials}
                  </span>

                  {/* Floating micro sparks (visual detail) */}
                  <div className="absolute bottom-2 text-[8px] tracking-[0.2em] font-sans font-black text-amber-300/80 uppercase">
                    WEX
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Small Corner Icon badge */}
        <div className="absolute bottom-0 right-0 p-2 bg-stone-900 border border-amber-500/30 rounded-full shadow-lg group-hover:border-amber-500/60 transition-colors duration-300">
          {icon}
        </div>
      </div>

      {/* Name and Details */}
      <h3 className="text-xl font-bold font-serif text-amber-100 tracking-wide text-center group-hover:text-amber-300 transition-colors duration-300">
        {oradora.nome}
      </h3>
      
      <p className="mt-2 text-xs text-stone-400 font-medium tracking-wide text-center max-w-[200px]">
        {oradora.cargo}
      </p>

      {oradora.subtitulo && (
        <span className="mt-3 text-[10px] uppercase font-sans font-bold tracking-widest text-orange-500 bg-orange-950/30 border border-orange-500/10 px-2.5 py-1 rounded text-center leading-normal">
          {oradora.subtitulo}
        </span>
      )}
    </motion.div>
  );
}
