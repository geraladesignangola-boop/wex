import React from 'react'
import { DailyClick } from '../../types/database'

interface AdminBarChartProps {
  data: DailyClick[]
}

export default function AdminBarChart({ data }: AdminBarChartProps) {
  const hasData = data.length > 0
  const maxTotal = hasData ? Math.max(...data.map((d) => d.total), 1) : 1
  const days = hasData ? data : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d) => ({
    date: d,
    day_of_week: d,
    total: 0,
    whatsapp: 0,
    facebook: 0,
    instagram: 0,
    direct: 0,
  }))

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-4">
        Cliques por dia da semana
      </p>
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height: 120 }}>
        {days.map((d) => {
          const heightPct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0
          const isMax = d.total === maxTotal && d.total > 0
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end h-full gap-1"
            >
              {!hasData && (
                <span className="text-[9px] text-stone-700 mb-1">0</span>
              )}
              <div
                className={`w-full rounded-t-md transition-all ${
                  isMax ? 'bg-amber-500' : 'bg-stone-800'
                }`}
                style={{ height: `${hasData ? Math.max(heightPct, 4) : 4}%` }}
              />
              <span className="text-[9px] sm:text-[10px] text-stone-600 truncate w-full text-center">
                {d.day_of_week}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
