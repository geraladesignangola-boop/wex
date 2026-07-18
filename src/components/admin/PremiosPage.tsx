import React from 'react'
import { Gift, Trophy, Shirt, BookOpen, Calendar } from 'lucide-react'
import { RankingEntry, PRIZE_NAMES, PrizeName } from '../../types/database'

interface PremiosPageProps {
  ranking: RankingEntry[]
}

const PODIUM_PRIZES: PrizeName[] = ['pack_completo', 'agenda', 'camisa']

const PRIZE_DETAILS: Record<PrizeName, { icon: React.ElementType; description: string; criteria: string }> = {
  pack_completo: {
    icon: BookOpen,
    description: 'Biblia de estudo capa premium com devocional incluido.',
    criteria: '1a classificada no ranking de convidadoras',
  },
  agenda: {
    icon: Calendar,
    description: 'Agenda espiritual 2026 com planos de leitura e reflexoes.',
    criteria: '2a classificada no ranking de convidadas',
  },
  camisa: {
    icon: Shirt,
    description: 'T-shirt exclusiva Mulheres de Fogo edicao limitada.',
    criteria: '3a classificada no ranking de convidadas',
  },
}

export default function PremiosPage({ ranking }: PremiosPageProps) {
  const podium = ranking.slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-500" />
          Gestao de Premios
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Premios atribuidos automaticamente com base no ranking de convidadoras.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PODIUM_PRIZES.map((prizeKey, i) => {
          const detail = PRIZE_DETAILS[prizeKey]
          const Icon = detail.icon
          const winner = podium[i]

          return (
            <div
              key={prizeKey}
              className={`rounded-2xl border p-5 ${
                i === 0
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-stone-900 border-stone-800'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${i === 0 ? 'bg-amber-500/15' : 'bg-stone-800'}`}>
                  <Icon className={`w-5 h-5 ${i === 0 ? 'text-amber-400' : 'text-stone-400'}`} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                    {i + 1}o lugar
                  </p>
                  <p className="text-sm font-bold text-stone-100">
                    {PRIZE_NAMES[prizeKey]}
                  </p>
                </div>
              </div>

              <p className="text-[13px] text-stone-400 mb-3">{detail.description}</p>
              <p className="text-[11px] text-stone-600 mb-3">{detail.criteria}</p>

              {winner ? (
                <div className="rounded-xl border border-green-500/20 bg-green-950/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-green-500 font-bold mb-1">
                    Atribuido a
                  </p>
                  <p className="text-sm font-bold text-stone-100">{winner.nome}</p>
                  <p className="text-[11px] text-stone-400">
                    {winner.convidadas_count} convidadas
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-stone-800 bg-stone-950/50 p-3">
                  <p className="text-[11px] text-stone-600">
                    Aguardando apuramento do ranking.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {ranking.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-stone-100 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Classificacao actual
          </h3>
          <div className="space-y-2">
            {ranking.slice(0, 10).map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 text-[13px]"
              >
                <span className={`w-6 text-center font-bold ${i < 3 ? 'text-amber-500' : 'text-stone-600'}`}>
                  {i + 1}o
                </span>
                <span className="flex-1 text-stone-200 truncate">{entry.nome}</span>
                <span className="text-stone-500 tabular-nums">{entry.convidadas_count} convidadas</span>
                {i < 3 && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full">
                    {PRIZE_NAMES[PODIUM_PRIZES[i]]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
