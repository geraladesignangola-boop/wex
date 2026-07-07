import React from 'react';
import { motion } from 'motion/react';
import { HeartPulse, Key, Sparkles, TrendingUp } from 'lucide-react';

export default function ParaQuem() {
  const itens = [
    {
      id: 1,
      titulo: "Mulheres que carregam feridas emocionais",
      desc: "Se carregas cicatrizes de traumas, rejeição ou deceções que ainda pesam na tua alma, este é o momento da tua libertação espiritual.",
      icon: <HeartPulse className="w-6 h-6 text-red-500" />,
      glowColor: "rgba(239, 68, 68, 0.15)"
    },
    {
      id: 2,
      titulo: "Mulheres em busca de propósito e identidade",
      desc: "Para as que se sentem confusas sobre quem são e para onde vão. Vamos reconectar-te com o projeto original que Deus sonhou para ti.",
      icon: <Key className="w-6 h-6 text-amber-500" />,
      glowColor: "rgba(245, 158, 11, 0.15)"
    },
    {
      id: 3,
      titulo: "Mulheres que desejam aprofundar a sua intimidade",
      desc: "Ideal para quem quer transcender o cristianismo morno e acender uma chama de intimidade e autoridade profética com o Espírito Santo.",
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      glowColor: "rgba(253, 224, 71, 0.15)"
    },
    {
      id: 4,
      titulo: "Mulheres prontas para um novo posicionamento",
      desc: "Se queres deixar de viver no silêncio e na limitação, e passar a governar nas tuas áreas de influência com maturidade e sabedoria.",
      icon: <TrendingUp className="w-6 h-6 text-orange-500" />,
      glowColor: "rgba(249, 115, 22, 0.15)"
    }
  ];

  return (
    <section 
      id="para-quem-section" 
      className="py-24 px-4 bg-gradient-to-b from-stone-950 to-stone-900 text-stone-100 relative overflow-hidden"
    >
      {/* Decorative top border fade */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-sans font-black tracking-[0.3em] text-amber-500 bg-amber-950/30 border border-amber-500/10 px-3 py-1 rounded">
            Alinhamento
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-serif tracking-tight text-amber-100 mt-4">
            Para quem é esta Imersão?
          </h2>
          <p className="mt-4 text-sm text-stone-400 max-w-md mx-auto">
            Identifica-te com um destes estados? Se sim, Deus reservou o dia 8 de Agosto especificamente para se encontrar contigo.
          </p>
        </div>

        {/* Audience Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {itens.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.01, borderColor: 'rgba(245,158,11,0.2)' }}
              className="p-6 md:p-8 rounded-2xl bg-stone-900/60 border border-stone-800/80 flex flex-col sm:flex-row items-start gap-5 transition-all duration-300 relative group overflow-hidden"
            >
              {/* Soft glow background */}
              <div 
                className="absolute -top-12 -left-12 w-24 h-24 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: item.glowColor }}
              />

              {/* Icon Holder */}
              <div className="p-4 bg-stone-950 border border-stone-800 rounded-xl group-hover:border-amber-500/20 transition-all duration-300 shrink-0 shadow-lg">
                {item.icon}
              </div>

              {/* Content text */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-serif text-amber-100 group-hover:text-amber-300 transition-colors duration-200 leading-snug">
                  {item.titulo}
                </h3>
                <p className="text-xs md:text-sm text-stone-400 leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
