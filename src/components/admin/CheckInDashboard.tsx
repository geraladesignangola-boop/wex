import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  UserCheck,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Loader2,
  Undo2,
  RefreshCcw,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ExcelJS from 'exceljs'
import type { CheckInStats, CheckInReportEntry } from '../../types/database'

export default function CheckInDashboard() {
  const [stats, setStats] = useState<CheckInStats | null>(null)
  const [report, setReport] = useState<CheckInReportEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'checked' | 'pending'>('all')

  const loadData = useCallback(async () => {
    try {
      const [statsRes, reportRes] = await Promise.all([
        supabase.rpc('get_checkin_stats'),
        supabase.rpc('get_checkin_report'),
      ])

      if (!statsRes.error && statsRes.data?.length > 0) {
        setStats(statsRes.data[0])
      }
      if (!reportRes.error && reportRes.data) {
        setReport(reportRes.data)
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleUndo = async (participantId: string) => {
    setUndoingId(participantId)
    try {
      const { error } = await supabase.rpc('undo_checkin', {
        p_participant_id: participantId,
      })
      if (!error) {
        await loadData()
      }
    } catch {
      // Silent fail
    } finally {
      setUndoingId(null)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Check-in')

      sheet.columns = [
        { header: 'Nome', key: 'nome', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Telefone', key: 'telefone', width: 18 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Check-in as', key: 'checked_in_at', width: 20 },
        { header: 'Feito por', key: 'checked_in_by', width: 20 },
        { header: 'Inscrito em', key: 'created_at', width: 20 },
      ]

      // Style header
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF292524' } }
        cell.alignment = { horizontal: 'center' }
      })

      for (const entry of report) {
        sheet.addRow({
          nome: entry.nome,
          email: entry.email,
          telefone: entry.telefone,
          status: entry.checked_in ? 'Presente' : 'Ausente',
          checked_in_at: entry.checked_in_at
            ? new Date(entry.checked_in_at).toLocaleString('pt-AO')
            : '',
          checked_in_by: entry.checked_in_by || '',
          created_at: new Date(entry.created_at).toLocaleString('pt-AO'),
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wex-checkin-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail
    } finally {
      setIsExporting(false)
    }
  }

  const filteredReport = report.filter((entry) => {
    if (filter === 'checked') return entry.checked_in
    if (filter === 'pending') return !entry.checked_in
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Total Inscritos</p>
            <p className="text-2xl font-black text-stone-100">{stats.total_inscritos}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Presentes</p>
            <p className="text-2xl font-black text-green-400">{stats.total_checked_in}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Ausentes</p>
            <p className="text-2xl font-black text-stone-400">{stats.total_inscritos - stats.total_checked_in}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Percentual</p>
            <p className="text-2xl font-black text-amber-500">{stats.percentual}%</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {stats && stats.total_inscritos > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-stone-300">Progresso do Check-in</p>
            <p className="text-xs text-stone-500">{stats.total_checked_in} / {stats.total_inscritos}</p>
          </div>
          <div className="h-3 bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentual}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-amber-500/15 text-amber-500' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Todos ({report.length})
          </button>
          <button
            onClick={() => setFilter('checked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'checked' ? 'bg-green-500/15 text-green-500' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Presentes ({report.filter(r => r.checked_in).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'pending' ? 'bg-stone-700 text-stone-300' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Ausentes ({report.filter(r => !r.checked_in).length})
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
            title="Atualizar"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || report.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-stone-300 hover:text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Exportar .xlsx</span>
            <span className="sm:hidden">Exportar</span>
          </button>
        </div>
      </div>

      {/* Report table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800">
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Nome</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden md:table-cell">Telefone</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Status</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold hidden lg:table-cell">Hora</th>
                <th className="text-center px-4 py-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold">Acao</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.map((entry) => (
                <tr key={entry.id} className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-100 text-xs truncate max-w-[150px] sm:max-w-none">{entry.nome}</p>
                    <p className="text-[11px] text-stone-500 sm:hidden truncate">{entry.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400 hidden sm:table-cell truncate max-w-[200px]">{entry.email}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 hidden md:table-cell">{entry.telefone}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.checked_in ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Presente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-800 px-2 py-0.5 rounded-full">
                        <Circle className="w-3 h-3" />
                        Ausente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {entry.checked_in_at ? (
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-green-500/70" />
                        <span className="text-[10px] text-stone-400">
                          {new Date(entry.checked_in_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                          {entry.checked_in_by && <span className="text-stone-600"> por {entry.checked_in_by}</span>}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.checked_in && (
                      <button
                        onClick={() => handleUndo(entry.id)}
                        disabled={undoingId === entry.id}
                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Desfazer check-in"
                      >
                        {undoingId === entry.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Undo2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReport.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="w-8 h-8 text-stone-700 mx-auto mb-2" />
            <p className="text-stone-500 text-xs">Nenhum registo encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
