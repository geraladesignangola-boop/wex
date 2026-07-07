import React from 'react';

interface SeloProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export default function SeloMulheresDeFogo({ className = '', showText = true, size = 64 }: SeloProps) {
  return (
    <div id="selo-mulheres-fogo-container" className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* Icone Mulheres de Fogo */}
      <img
        id="selo-mulheres-fogo-img"
        src="/images/icone_mulheres.png"
        alt="Mulheres de Fogo"
        width={size}
        height={size}
        className="object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse"
      />

      {showText && (
        <span 
          id="selo-mulheres-fogo-label" 
          className="mt-2 text-[10px] tracking-[0.25em] text-amber-500 font-bold uppercase font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        >
          Mulheres de Fogo
        </span>
      )}
    </div>
  );
}
