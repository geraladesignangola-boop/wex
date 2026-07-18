import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  DashboardStats,
  DailyRegistration,
  DailyClick,
  RankingEntry,
} from '../../types/database'
import AdminFunnel from './AdminFunnel'
import AdminInsights from './AdminInsights'
import AdminTrendChart from './AdminTrendChart'
import AdminDonutChart from './AdminDonutChart'
import AdminBarChart from './AdminBarChart'
import AdminLeaderboard from './AdminLeaderboard'

interface AdminDashboardProps {
  stats: DashboardStats | null
  ranking: RankingEntry[]
}

export default function AdminDashboard({ stats, ranking }: AdminDashboardProps) {
  const [dailyRegistrations, setDailyRegistrations] = useState<DailyRegistration[]>([])
  const [dailyClicks, setDailyClicks] = useState<DailyClick[]>([])
  const [todayRegistrations, setTodayRegistrations] = useState(0)

  useEffect(() => {
    const loadDailyData = async () => {
      const [regResult, clickResult] = await Promise.all([
        supabase.rpc('get_daily_registrations', { p_days: 7 }),
        supabase.rpc('get_daily_clicks', { p_days: 7 }),
      ])

      if (regResult.data) {
        setDailyRegistrations(regResult.data as DailyRegistration[])
        const today = regResult.data[regResult.data.length - 1]
        setTodayRegistrations(today?.count || 0)
      }

      if (clickResult.data) {
        setDailyClicks(clickResult.data as DailyClick[])
      }
    }

    loadDailyData()
  }, [])

  const conversionRate = stats && stats.total_clicks > 0
    ? Math.round((stats.total_inscritos / stats.total_clicks) * 100)
    : 0

  const referralRate = stats && stats.total_inscritos > 0
    ? Math.round((stats.total_referrals / stats.total_inscritos) * 100)
    : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
          Funil da campanha
        </p>
        <AdminFunnel stats={stats} />
      </div>

      <AdminInsights stats={stats} />

      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Tendencia de inscricoes
          </p>
          <span className="text-stone-600 normal-case font-normal text-[11px]">ultimos 7 dias</span>
        </div>
        <AdminTrendChart data={dailyRegistrations} totalToday={todayRegistrations} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
          Canais & trafego
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <AdminDonutChart stats={stats} />
          <AdminBarChart data={dailyClicks} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
          Conversao & premios
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <MiniStat
            value={`${conversionRate}%`}
            label="Taxa de conversao"
            note="cliques -> inscricoes"
          />
          <MiniStat
            value={`${referralRate}%`}
            label="Taxa de referral"
            note="inscritas que convidam"
          />
          <MiniStat
            value={String(stats?.total_prizes_achieved || 0)}
            label="Premios entregues"
            note={stats?.total_prizes_achieved === 0 ? 'nenhum atribuido ate agora' : 'atribuidos'}
            valueColor={stats?.total_prizes_achieved === 0 ? 'text-red-400' : 'text-amber-500'}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Ranking de convidadoras
          </p>
          <span className="text-stone-600 normal-case font-normal text-[11px]">top 5</span>
        </div>
        <AdminLeaderboard ranking={ranking} />
      </div>
    </div>
  )
}

function MiniStat({
  value,
  label,
  note,
  valueColor = 'text-amber-500',
}: {
  value: string
  label: string
  note: string
  valueColor?: string
}) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-1">
      <p className={`text-2xl sm:text-[30px] font-bold ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-stone-400 uppercase tracking-wider">{label}</p>
      <p className="text-[12px] text-stone-600">{note}</p>
    </div>
  )
}
