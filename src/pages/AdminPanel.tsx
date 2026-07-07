import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { 
  Users, Trophy, TrendingUp, Crown, Medal, Award, 
  Download, LogOut, Loader2, MessageCircle, Mail, 
  Check, Eye, Gift, Clock, CheckCircle, Bell
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getCurrentAdmin, signInAdmin, signOut } from '../lib/auth'
import { 
  DashboardStats, RankingEntry, Notification, 
  Inscricao, PRIZE_NAMES 
} from '../types/database'

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [lastLoginAttempt, setLastLoginAttempt] = useState(0)
  const [isBooting, setIsBooting] = useState(true)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [participants, setParticipants] = useState<Inscricao[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ranking' | 'notifications' | 'participants'>('dashboard')

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const admin = await getCurrentAdmin()
        if (admin) {
          setIsAuthenticated(true)
          await fetchData()
        } else {
          await signOut()
        }
      } finally {
        setIsBooting(false)
      }
    }

    restoreSession()
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now - lastLoginAttempt < 5000) {
      setAuthError('Aguarde 5 segundos antes de tentar novamente.')
      return
    }
    setLastLoginAttempt(now)
    setIsLoading(true)
    setAuthError('')

    try {
      await signInAdmin(email, password)
      setIsAuthenticated(true)
      await fetchData()
    } catch (err: any) {
      setAuthError(err.message || 'Credenciais inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsAuthenticated(false)
    setEmail('')
    setPassword('')
    setStats(null)
    setRanking([])
    setNotifications([])
    setParticipants([])
    setDataError('')
    setActiveTab('dashboard')
  }

  const fetchData = async () => {
    try {
      setDataError('')

      const { data: statsData } = await supabase.rpc('get_dashboard_stats')
      if (statsData && statsData[0]) {
        setStats(statsData[0])
      }

      const { data: rankingData } = await supabase.rpc('get_referral_ranking')
      if (rankingData) {
        setRanking(rankingData)
      }

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (notifData) {
        setNotifications(notifData)
      }

      const { data: participantsData } = await supabase
        .from('inscricoes')
        .select('*')
        .order('created_at', { ascending: false })
      if (participantsData) {
        setParticipants(participantsData)
      }
    } catch (error) {
      console.error(error)
      setDataError('Não foi possível carregar os dados do painel.')
    }
  }

  const markAsSent = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_sent', { notification_id: notificationId })
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Erro ao marcar notificação:', err)
      setDataError('Não foi possível marcar a notificação como enviada.')
    }
  }

  const escapeCsvField = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return `"${value}"`
  }

  const handleExportCSV = () => {
    if (participants.length === 0) return
    
    const headers = ['Nome', 'Email', 'Telefone', 'WhatsApp', 'Morada', 'Igreja', 'Faixa Etária', 'Como Soube', 'Meta', 'Convidadas', 'Data Inscrição']
    const rows = participants.map(p => [
      escapeCsvField(p.nome),
      escapeCsvField(p.email),
      escapeCsvField(p.telefone),
      escapeCsvField(p.whatsapp),
      escapeCsvField(p.morada),
      escapeCsvField(p.igreja || ''),
      escapeCsvField(p.faixa_etaria),
      escapeCsvField(p.como_soube),
      p.meta_convidadas,
      p.convidadas_count,
      escapeCsvField(new Date(p.created_at).toLocaleString('pt-PT'))
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Inscricoes_WEX_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isBooting) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 text-stone-400">
        A validar sessão administrativa...
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-amber-100 mb-2">
            Configuração em falta
          </h1>
          <p className="text-stone-400 text-sm mb-6">
            As variáveis de ambiente do Supabase não estão configuradas no Vercel.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-sm"
          >
            Voltar à página principal
          </a>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-stone-900 rounded-3xl p-8 border border-stone-800"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-amber-100 font-serif">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-stone-500 text-sm">
              Imersão WEX - Mulheres de Fogo
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="admin@wex.ao"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                Senha
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-lg font-bold text-amber-100">Painel Admin WEX</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-stone-400 hover:text-white text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-stone-800 bg-stone-900/50">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'ranking', label: 'Ranking', icon: Crown },
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'participants', label: 'Participantes', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {dataError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                {dataError}
              </div>
            )}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Total Inscritas"
                value={stats?.total_inscritos || 0}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Total Referrals"
                value={stats?.total_referrals || 0}
              />
              <StatCard
                icon={<Gift className="w-5 h-5" />}
                label="Prêmios Conquistados"
                value={stats?.total_prizes_achieved || 0}
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Prêmios Pendentes"
                value={stats?.prizes_pending_delivery || 0}
              />
            </div>

            {/* Top Referrer */}
            {stats?.top_referrer_nome && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-full">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-300 uppercase tracking-wider font-bold">
                      Top Convidadora
                    </p>
                    <p className="text-xl font-bold text-white">
                      {stats.top_referrer_nome}
                    </p>
                    <p className="text-sm text-stone-400">
                      {stats.top_referrer_count} convidadas
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Ranking de Convidadoras
            </h2>
            
            {ranking.length === 0 ? (
              <p className="text-stone-500 text-center py-8">
                Ainda não há dados de referral.
              </p>
            ) : (
              <div className="space-y-3">
                {ranking.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-stone-900 rounded-xl border border-stone-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      {index === 0 ? <Crown className="w-5 h-5 text-amber-400" /> :
                       index === 1 ? <Medal className="w-5 h-5 text-stone-400" /> :
                       index === 2 ? <Award className="w-5 h-5 text-amber-600" /> :
                       <span className="text-sm text-stone-500 font-bold">{index + 1}</span>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-stone-200 truncate">
                          {entry.nome}
                        </p>
                        {entry.prize_achieved && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full">
                            PRÊMIO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {entry.email}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        entry.convidadas_count >= entry.meta_convidadas 
                          ? 'text-green-400' 
                          : 'text-amber-400'
                      }`}>
                        {entry.convidadas_count}/{entry.meta_convidadas}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {entry.percentage}%
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notificações de Prêmios
            </h2>
            
            {notifications.length === 0 ? (
              <p className="text-stone-500 text-center py-8">
                Nenhuma notificação pendente.
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      notif.sent 
                        ? 'bg-stone-900/50 border-stone-800/50 opacity-60' 
                        : 'bg-stone-900 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-stone-200 whitespace-pre-wrap">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-2">
                          {new Date(notif.created_at).toLocaleString('pt-PT')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {!notif.sent ? (
                          <>
                            <a
                              href={notif.whatsapp_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markAsSent(notif.id)}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                            <a
                              href={notif.email_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markAsSent(notif.id)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              Email
                            </a>
                          </>
                        ) : (
                          <span className="px-3 py-2 bg-stone-800 text-stone-500 text-xs font-bold rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Enviado
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participantes ({participants.length})
              </h2>
              
              <button
                onClick={handleExportCSV}
                disabled={participants.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-800">
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Nome</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">WhatsApp</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Meta</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Convidadas</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-stone-800/50 hover:bg-stone-900/50">
                      <td className="px-4 py-3 text-sm text-stone-200">{p.nome}</td>
                      <td className="px-4 py-3 text-sm text-stone-400">{p.email}</td>
                      <td className="px-4 py-3 text-sm text-stone-400">{p.whatsapp}</td>
                      <td className="px-4 py-3 text-sm text-stone-400">{p.meta_convidadas}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-bold ${
                          p.convidadas_count >= p.meta_convidadas 
                            ? 'text-green-400' 
                            : 'text-amber-400'
                        }`}>
                          {p.convidadas_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.convidadas_count >= p.meta_convidadas ? (
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full">
                            META ATINGIDA
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-stone-800 text-stone-500 text-xs font-bold rounded-full">
                            EM PROGRESSO
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {new Date(p.created_at).toLocaleDateString('pt-PT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-stone-900 rounded-xl p-4 border border-stone-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
          {icon}
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-stone-200">{value}</p>
        </div>
      </div>
    </div>
  )
}
