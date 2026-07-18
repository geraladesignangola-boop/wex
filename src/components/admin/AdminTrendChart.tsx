import React from 'react'
import { DailyRegistration } from '../../types/database'

interface AdminTrendChartProps {
  data: DailyRegistration[]
  totalToday: number
}

export default function AdminTrendChart({ data, totalToday }: AdminTrendChartProps) {
  const hasData = data.length > 0
  const maxCount = hasData ? Math.max(...data.map((d) => d.count), 1) : 1
  const width = 900
  const height = 140
  const padding = { top: 20, bottom: 10 }
  const usableHeight = height - padding.top - padding.bottom

  const points = hasData ? data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width
    const y = padding.top + usableHeight - (d.count / maxCount) * usableHeight
    return { x, y, count: d.count, day: d.day_of_week }
  }) : []

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')
  const polygon = `${polyline} ${width},${height} 0,${height}`

  const weekTotal = data.reduce((sum, d) => sum + d.count, 0)
  const lastCount = data.length > 0 ? data[data.length - 1].count : 0

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-xl md:text-2xl font-black text-stone-100">{lastCount}</p>
          <p className="text-[11px] text-stone-500">Total acumulado</p>
        </div>
        {hasData && (
          <p className="text-[11px] text-green-500 font-semibold text-right">
            +{totalToday} hoje<br className="sm:hidden" /> <span className="hidden sm:inline">&middot;</span> +{weekTotal} esta semana
          </p>
        )}
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1="40" x2={width} y2="40" stroke="#292524" strokeWidth="1" />
        <line x1="0" y1="80" x2={width} y2="80" stroke="#292524" strokeWidth="1" />
        <line x1="0" y1="120" x2={width} y2="120" stroke="#292524" strokeWidth="1" />

        {hasData ? (
          <>
            <polygon points={polygon} fill="#f59e0b" fillOpacity="0.08" />
            <polyline
              points={polyline}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === points.length - 1 ? 5 : 4}
                fill="#f59e0b"
              />
            ))}
          </>
        ) : (
          <text x="450" y="80" textAnchor="middle" fontSize="13" fill="#57534e">
            Aguardando dados diarios...
          </text>
        )}
      </svg>

      <div className="flex justify-between text-[10.5px] text-stone-600 mt-1 px-1">
        {hasData ? (
          data.map((d, i) => (
            <span key={d.date}>{i === data.length - 1 ? 'Hoje' : d.day_of_week}</span>
          ))
        ) : (
          ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom', 'Hoje'].map((d) => (
            <span key={d}>{d}</span>
          ))
        )}
      </div>
    </div>
  )
}
