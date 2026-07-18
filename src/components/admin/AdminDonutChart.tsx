import React from 'react'
import { DashboardStats } from '../../types/database'

interface AdminDonutChartProps {
  stats: DashboardStats | null
}

interface ChannelData {
  name: string
  value: number
  pct: number
  color: string
}

export default function AdminDonutChart({ stats }: AdminDonutChartProps) {
  const total = stats?.total_clicks || 0

  const channels: ChannelData[] = [
    { name: 'WhatsApp', value: stats?.whatsapp_clicks || 0, pct: 0, color: '#f59e0b' },
    { name: 'Diretos', value: stats?.direct_clicks || 0, pct: 0, color: '#78716c' },
    { name: 'Facebook', value: stats?.facebook_clicks || 0, pct: 0, color: '#3b82f6' },
    { name: 'Instagram', value: stats?.instagram_clicks || 0, pct: 0, color: '#d946ef' },
  ].map((ch) => ({
    ...ch,
    pct: total > 0 ? Math.round((ch.value / total) * 100) : 0,
  }))

  const radius = 60
  const circumference = 2 * Math.PI * radius
  let accumulated = 0

  const arcs = channels
    .filter((ch) => ch.value > 0)
    .map((ch) => {
      const dashLen = (ch.pct / 100) * circumference
      const dashOffset = -(accumulated / 100) * circumference
      accumulated += ch.pct
      return { ...ch, dashLen, dashOffset }
    })

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">
        Canais e trafego
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <svg width="120" height="120" viewBox="0 0 160 160" className="sm:w-[140px] sm:h-[140px] flex-shrink-0">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#292524" strokeWidth="20" />
          {arcs.map((arc) => (
            <circle
              key={arc.name}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="20"
              strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
              strokeDashoffset={arc.dashOffset}
              transform="rotate(-90 80 80)"
            />
          ))}
          <text x="80" y="76" textAnchor="middle" fontSize="20" fontWeight="700" fill="#f5f5f4">
            {total}
          </text>
          <text x="80" y="94" textAnchor="middle" fontSize="10" fill="#78716c">
            cliques
          </text>
        </svg>

        <div className="flex-1 space-y-2.5 w-full">
          {channels.map((ch) => (
            <div key={ch.name} className="flex items-center gap-2 text-[13px]">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: ch.color }}
              />
              <span className="flex-1 text-stone-200">{ch.name}</span>
              <span className="text-stone-500 tabular-nums">
                {ch.value} &middot; {ch.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
