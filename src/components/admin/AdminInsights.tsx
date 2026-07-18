import React from 'react'
import { DashboardStats } from '../../types/database'

interface AdminInsightsProps {
  stats: DashboardStats | null
}

interface Insight {
  type: 'warn' | 'good' | 'info'
  title: string
  description: string
}

export default function AdminInsights({ stats }: AdminInsightsProps) {
  const insights: Insight[] = []

  if (stats) {
    if (stats.instagram_clicks === 0) {
      insights.push({
        type: 'warn',
        title: 'Instagram sem tracao',
        description: '0 inscricoes e 0 engajamento vindos deste canal.',
      })
    }

    if (stats.total_clicks > 0 && stats.whatsapp_clicks > 0) {
      const pct = Math.round((stats.whatsapp_clicks / stats.total_clicks) * 100)
      insights.push({
        type: 'good',
        title: 'WhatsApp e o canal principal',
        description: `${pct}% dos cliques totais (${stats.whatsapp_clicks} de ${stats.total_clicks}).`,
      })
    }

    if (stats.total_prizes_achieved === 0) {
      insights.push({
        type: 'info',
        title: '0 premios entregues',
        description: 'Confirma se o processo de atribuicao esta ativo.',
      })
    }

    if (stats.top_referrer_nome && stats.top_referrer_count > 0) {
      insights.push({
        type: 'good',
        title: `Top convidadora: ${stats.top_referrer_nome}`,
        description: `${stats.top_referrer_count} convidadas directas.`,
      })
    }

    if (stats.total_inscritos > 0 && stats.total_referrals > 0) {
      const referralPct = Math.round((stats.total_referrals / stats.total_inscritos) * 100)
      insights.push({
        type: 'info',
        title: `${referralPct}% taxa de referral`,
        description: `${stats.total_referrals} de ${stats.total_inscritos} inscritas convidaram outras.`,
      })
    }
  }

  if (insights.length === 0) return null

  const dotColorMap = {
    warn: 'bg-red-500',
    good: 'bg-green-500',
    info: 'bg-amber-500',
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
        O que precisa da tua atencao
      </p>
      {insights.map((insight) => (
        <div
          key={insight.title}
          className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl px-3 sm:px-4 py-3 text-[13px]"
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColorMap[insight.type]}`} />
          <p className="text-stone-100">
            <span className="font-bold">{insight.title}</span>
            <span className="text-stone-500"> -- {insight.description}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
