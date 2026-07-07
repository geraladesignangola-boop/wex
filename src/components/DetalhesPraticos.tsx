import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Coffee, Sparkles, Flame, Check, AlertTriangle } from 'lucide-react';

export default function DetalhesPraticos() {
  const scrollToForm = () => {
    const element = document.getElementById('form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="detalhes-section" 
      className="py-24 px-4 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 text-stone-100 relative overflow-hidden"
    >
      {/* Decorative ambient elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-sans font-black tracking-[0.3em] text-amber-500 bg-amber-950/30 border border-amber-500/10 px-3 py-1 rounded">
            Logística
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-100 mt-4">
            Acesso & Detalhes Práticos
          </h2>
          <p className="mt-4 text-sm text-stone-400 max-w-md mx-auto">
            Tudo o que precisas de saber para te posicionares no dia do evento. Prepara a tua entrada de forma planeada.
          </p>
        </div>

        {/* Premium Perforated Entry Ticket */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
          onClick={scrollToForm}
          type="button"
          className="relative bg-stone-900 border border-amber-500/25 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden hover:border-amber-500/40 cursor-pointer transition-all duration-300 group shadow-amber-950/10"
        >
          {/* Ticket Glow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/35 via-stone-900/10 to-transparent pointer-events-none" />

          {/* Ticket Left Side: Information Detail (65%) */}
          <div className="p-8 md:p-10 flex-1 relative z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-red-500 uppercase">
                  Acesso Gratuito • Confirmação Obrigatória
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black font-serif text-amber-100 tracking-wide mb-6">
                Ticket Oficial de Entrada
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                
                {/* Data */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Data do Evento</p>
                    <p className="text-sm font-bold text-stone-200 mt-1">Sábado, 8 de Agosto</p>
                  </div>
                </div>

                {/* Horas */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Duração / Horas</p>
                    <p className="text-sm font-bold text-stone-200 mt-1">Das 9h às 17h (Pontual)</p>
                  </div>
                </div>

                {/* Local */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Localização Oficial</p>
                    <p className="text-sm font-bold text-stone-200 mt-1">Mediateca de Luanda</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Luanda, Angola</p>
                  </div>
                </div>

                {/* Inclui */}
                <div className="flex items-start gap-3">
                  <Coffee className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Serviço de Catering</p>
                    <p className="text-sm font-bold text-stone-200 mt-1">Direito a Coffee-break</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Incluído para inscritas</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Urgência warning */}
            <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="inline-flex p-1.5 bg-orange-950/60 border border-orange-500/20 rounded text-orange-400">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-200 uppercase tracking-wide">Vagas Limitadas — Garante já o teu lugar</p>
                <p className="text-[10px] text-stone-500 font-sans">A Mediateca possui restrições estritas de capacidade de segurança.</p>
              </div>
            </div>
          </div>

          {/* Perforated Vertical Divider for desktop */}
          <div className="hidden md:flex flex-col justify-between py-6 items-center w-6 shrink-0 relative z-20 bg-stone-900 border-l border-r border-dashed border-stone-800">
            {/* Top Cutout */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-b from-stone-950 via-stone-950 to-transparent border-b border-amber-500/10" />
            
            {/* Dots */}
            <div className="w-0.5 h-full bg-stone-950/20" />

            {/* Bottom Cutout */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-t from-stone-950 via-stone-950 to-transparent border-t border-amber-500/10" />
          </div>

          {/* Ticket Right Side: QR Code Area (35%) */}
          <div className="p-8 md:p-10 bg-stone-950/80 md:w-64 flex flex-col items-center justify-center text-center relative z-10 border-t md:border-t-0 border-stone-800">
            
            <div className="relative p-3 bg-stone-900 border border-amber-500/25 rounded-2xl inline-block group-hover:scale-105 transition-transform duration-500 shadow-xl">
              
              <svg 
                id="ticket-qr-code"
                width="140" 
                height="140" 
                viewBox="0 0 100 100" 
                className="text-amber-500 opacity-90 fill-current"
              >
                {/* Corner squares - QR code standard */}
                <rect x="2" y="2" width="20" height="20" rx="2" fill="currentColor" />
                <rect x="5" y="5" width="14" height="14" rx="1" fill="#0C0A09" />
                <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" />

                <rect x="78" y="2" width="20" height="20" rx="2" fill="currentColor" />
                <rect x="81" y="5" width="14" height="14" rx="1" fill="#0C0A09" />
                <rect x="84" y="8" width="8" height="8" rx="1" fill="currentColor" />

                <rect x="2" y="78" width="20" height="20" rx="2" fill="currentColor" />
                <rect x="5" y="81" width="14" height="14" rx="1" fill="#0C0A09" />
                <rect x="8" y="84" width="8" height="8" rx="1" fill="currentColor" />

                {/* Timing patterns */}
                <rect x="26" y="10" width="2" height="2" fill="currentColor" />
                <rect x="30" y="10" width="2" height="2" fill="currentColor" />
                <rect x="34" y="10" width="2" height="2" fill="currentColor" />
                <rect x="38" y="10" width="2" height="2" fill="currentColor" />
                <rect x="42" y="10" width="2" height="2" fill="currentColor" />
                <rect x="46" y="10" width="2" height="2" fill="currentColor" />
                <rect x="50" y="10" width="2" height="2" fill="currentColor" />
                <rect x="54" y="10" width="2" height="2" fill="currentColor" />
                <rect x="58" y="10" width="2" height="2" fill="currentColor" />
                <rect x="62" y="10" width="2" height="2" fill="currentColor" />
                <rect x="66" y="10" width="2" height="2" fill="currentColor" />
                <rect x="70" y="10" width="2" height="2" fill="currentColor" />

                <rect x="10" y="26" width="2" height="2" fill="currentColor" />
                <rect x="10" y="30" width="2" height="2" fill="currentColor" />
                <rect x="10" y="34" width="2" height="2" fill="currentColor" />
                <rect x="10" y="38" width="2" height="2" fill="currentColor" />
                <rect x="10" y="42" width="2" height="2" fill="currentColor" />
                <rect x="10" y="46" width="2" height="2" fill="currentColor" />
                <rect x="10" y="50" width="2" height="2" fill="currentColor" />
                <rect x="10" y="54" width="2" height="2" fill="currentColor" />
                <rect x="10" y="58" width="2" height="2" fill="currentColor" />
                <rect x="10" y="62" width="2" height="2" fill="currentColor" />
                <rect x="10" y="66" width="2" height="2" fill="currentColor" />
                <rect x="10" y="70" width="2" height="2" fill="currentColor" />

                {/* Data modules - representative pattern */}
                <rect x="26" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="34" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="42" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="50" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="58" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="66" y="26" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="26" y="34" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="42" y="34" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="58" y="34" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="34" y="42" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="50" y="42" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="66" y="42" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="26" y="50" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="42" y="50" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="58" y="50" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="34" y="58" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="50" y="58" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="66" y="58" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="26" y="66" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="42" y="66" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="58" y="66" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="78" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="86" y="26" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="78" y="34" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="86" y="42" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="78" y="50" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="86" y="58" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="78" y="66" width="4" height="4" rx="1" fill="currentColor" />

                <rect x="26" y="78" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="34" y="78" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="42" y="86" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="50" y="78" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="58" y="86" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="66" y="78" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="78" y="78" width="4" height="4" rx="1" fill="currentColor" />
                <rect x="86" y="86" width="4" height="4" rx="1" fill="currentColor" />

                {/* Central Flame Embellishment */}
                <circle cx="50" cy="50" r="14" fill="#0C0A09" />
                <path 
                  d="M50 42 C54 48, 58 52, 58 56 C58 60, 54 62, 50 62 C46 62, 42 60, 42 56 C42 52, 46 48, 50 42 Z" 
                  fill="#F59E0B" 
                />
              </svg>
              
              {/* Scan effect lines */}
              <div className="absolute inset-x-0 h-0.5 bg-orange-500/50 shadow-[0_0_10px_#F97316] top-2 animate-bounce pointer-events-none" style={{ animationDuration: '3s' }} />
            </div>

            <p className="mt-4 text-[10px] font-sans font-bold tracking-[0.15em] uppercase text-amber-500">
              Clica para Reservar
            </p>
            <p className="mt-1 text-[9px] text-stone-500 leading-snug">
              Este QR Code aponta para o formulário oficial de inscrições.
            </p>
          </div>

        </motion.button>

      </div>
    </section>
  );
}
