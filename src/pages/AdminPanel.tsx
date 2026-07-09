import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Users,
  Trophy,
  TrendingUp,
  Crown,
  Medal,
  Award,
  Download,
  LogOut,
  Loader2,
  MessageCircle,
  Mail,
  Eye,
  EyeOff,
  Check,
  Gift,
  Clock,
  CheckCircle,
  Bell,
  X,
  Copy,
  Send,
  RefreshCcw,
  History,
  Link2,
  Building2,
  NotebookPen,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getCurrentAdmin, signInAdmin, signOut } from '../lib/auth'
import { useReferral } from '../hooks/useReferral'
import {
  AdminParticipantOverview,
  DashboardStats,
  Notification,
  ParticipantDetail,
  PRIZE_NAMES,
  PrizeName,
  RankingEntry,
  ReferralLink,
} from '../types/database'

const PODIUM_PRIZES: PrizeName[] = ['pack_completo', 'agenda', 'camisa']

export default function AdminPanel() {
  const { getReferralLink } = useReferral()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [lastLoginAttempt, setLastLoginAttempt] = useState(0)
  const [isBooting, setIsBooting] = useState(true)
  const [isFinalizing, setIsFinalizing] = useState(false)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [participants, setParticipants] = useState<AdminParticipantOverview[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ranking' | 'notifications' | 'participants'>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [participantFilter, setParticipantFilter] = useState<'all' | 'podium' | 'linked' | 'no_links'>('all')

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)
  const [participantDetail, setParticipantDetail] = useState<ParticipantDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [adminNotesDraft, setAdminNotesDraft] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

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

  useEffect(() => {
    setAdminNotesDraft(participantDetail?.participant.admin_notes || '')
  }, [participantDetail])

  const filteredParticipants = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return participants.filter((participant) => {
      const matchesSearch = !term
        || [participant.nome, participant.email, participant.whatsapp, participant.igreja || '', participant.localizacao || '', participant.recomendacao || '']
          .join(' ')
          .toLowerCase()
          .includes(term)

      const matchesFilter =
        participantFilter === 'all'
        || (participantFilter === 'podium' && participant.prize_achieved)
        || (participantFilter === 'linked' && participant.total_links > 1)
        || (participantFilter === 'no_links' && participant.total_links <= 1)

      return matchesSearch && matchesFilter
    })
  }, [participants, searchTerm, participantFilter])

  const podiumEntries = ranking.slice(0, 3)
  const podiumPositionById = new Map(podiumEntries.map((entry, index) => [entry.id, index + 1]))

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
    setShowPassword(false)
    setStats(null)
    setRanking([])
    setNotifications([])
    setParticipants([])
    setSelectedParticipantId(null)
    setParticipantDetail(null)
    setAdminNotesDraft('')
    setDataError('')
    setDetailError('')
    setActiveTab('dashboard')
  }

  const loadFallbackStats = async (): Promise<DashboardStats> => {
    const [{ count: totalInscritos }, { count: totalReferrals }, { count: prizesAchieved }, { count: prizesPending }] = await Promise.all([
      supabase.from('inscricoes').select('*', { count: 'exact', head: true }),
      supabase.from('referrals').select('*', { count: 'exact', head: true }),
      supabase.from('prize_claims').select('*', { count: 'exact', head: true }).neq('status', 'delivered'),
      supabase.from('prize_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const { data: topReferrer } = await supabase
      .from('inscricoes')
      .select('nome, convidadas_count')
      .order('convidadas_count', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    return {
      total_inscritos: totalInscritos || 0,
      total_referrals: totalReferrals || 0,
      total_prizes_achieved: prizesAchieved || 0,
      prizes_pending_delivery: prizesPending || 0,
      total_links: 0,
      total_clicks: 0,
      facebook_clicks: 0,
      instagram_clicks: 0,
      whatsapp_clicks: 0,
      direct_clicks: 0,
      top_referrer_nome: topReferrer?.nome || '',
      top_referrer_count: topReferrer?.convidadas_count || 0,
    }
  }

  const loadFallbackParticipants = async (): Promise<AdminParticipantOverview[]> => {
    const { data } = await supabase
      .from('inscricoes')
      .select('*')
      .order('created_at', { ascending: false })

    return (data || []).map((participant) => ({
      ...participant,
      referred_by_nome: null,
      total_links: 1,
      total_clicks: 0,
      facebook_clicks: 0,
      instagram_clicks: 0,
      whatsapp_clicks: 0,
      direct_clicks: 0,
      latest_link_id: null,
      latest_link_token: participant.referral_code,
      latest_link_label: 'Link principal',
      latest_link_created_at: participant.created_at,
      prize_level: null,
      prize_achieved: false,
    }))
  }

  const fetchData = async () => {
    try {
      setDataError('')

      const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats')
      if (statsData?.[0]) {
        setStats(statsData[0] as DashboardStats)
      } else if (statsError) {
        setStats(await loadFallbackStats())
      }

      const { data: rankingData, error: rankingError } = await supabase.rpc('get_referral_ranking')
      if (rankingData) {
        setRanking(rankingData as RankingEntry[])
      } else if (rankingError) {
        const { data: fallbackRanking } = await supabase
          .from('inscricoes')
          .select('id, nome, email, whatsapp, convidadas_count, meta_convidadas')
          .gt('convidadas_count', 0)
          .order('convidadas_count', { ascending: false })
          .order('created_at', { ascending: true })
          .limit(50)

        setRanking((fallbackRanking || []).map((entry) => ({
          ...entry,
          percentage: entry.meta_convidadas && entry.meta_convidadas > 0
            ? Math.round((entry.convidadas_count / entry.meta_convidadas) * 1000) / 10
            : 0,
          prize_achieved: false,
        })) as RankingEntry[])
      }

      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (notifData) {
        setNotifications(notifData as Notification[])
      }

      const { data: participantsData, error: participantsError } = await supabase.rpc('get_admin_participants_overview')
      if (participantsData) {
        setParticipants(participantsData as AdminParticipantOverview[])
      } else if (participantsError) {
        setParticipants(await loadFallbackParticipants())
      }
    } catch (error) {
      console.error(error)
      setDataError('Não foi possível carregar os dados do painel.')
    }
  }

  const openParticipant = async (participantId: string) => {
    setSelectedParticipantId(participantId)
    setParticipantDetail(null)
    setDetailError('')
    setCopyMessage('')
    setIsDetailLoading(true)

    try {
      const { data, error } = await supabase.rpc('get_admin_participant_detail', {
        target_id: participantId,
      })
      if (error) throw error
      const detail = data?.[0] as ParticipantDetail | undefined
      if (!detail) {
        throw new Error('not_found')
      }
      setParticipantDetail(detail)
    } catch (error) {
      console.error(error)
      const { data: participantRow } = await supabase
        .from('inscricoes')
        .select('*')
        .eq('id', participantId)
        .maybeSingle()

      if (participantRow) {
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('participant_id', participantId)
          .order('created_at', { ascending: false })

        setParticipantDetail({
          participant: {
            ...participantRow,
            referred_by_nome: null,
            total_links: 1,
            total_clicks: 0,
            facebook_clicks: 0,
            instagram_clicks: 0,
            whatsapp_clicks: 0,
            direct_clicks: 0,
          },
          links: [],
          notifications: (notificationsData || []) as Notification[],
          click_summary: {
            total_links: 1,
            total_clicks: 0,
            facebook_clicks: 0,
            instagram_clicks: 0,
            whatsapp_clicks: 0,
            direct_clicks: 0,
          },
        })
        setDetailError('Migrations novas ainda não aplicadas; a vista detalhada está em modo básico.')
      } else {
        setDetailError('Não foi possível carregar este participante.')
      }
    } finally {
      setIsDetailLoading(false)
    }
  }

  const closeParticipantModal = () => {
    setSelectedParticipantId(null)
    setParticipantDetail(null)
    setDetailError('')
    setAdminNotesDraft('')
    setCopyMessage('')
    setIsDetailLoading(false)
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

  const handleFinalizePodium = async () => {
    const shouldFinalize = window.confirm(
      'Confirmas a apuração final do pódio? Isto vai substituir os prémios anteriores.'
    )

    if (!shouldFinalize) return

    try {
      setIsFinalizing(true)
      setDataError('')
      const { error } = await supabase.rpc('assign_podium_prizes')
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Erro ao apurar o pódio:', err)
      setDataError('Não foi possível fechar o pódio agora.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const saveAdminNotes = async () => {
    if (!selectedParticipantId) return

    try {
      setIsSavingNotes(true)
      setDetailError('')
      const { error } = await supabase
        .from('inscricoes')
        .update({ admin_notes: adminNotesDraft })
        .eq('id', selectedParticipantId)

      if (error) throw error
      await fetchData()
      await openParticipant(selectedParticipantId)
      setCopyMessage('Notas guardadas com sucesso.')
    } catch (error) {
      console.error(error)
      setDetailError('Não foi possível guardar as notas.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(successMessage)
      setTimeout(() => setCopyMessage(''), 2000)
    } catch {
      setDetailError('Não foi possível copiar o link agora.')
    }
  }

  const handleCopyLatestLink = async () => {
    const latestLink = participantDetail?.links?.[0]
    if (!latestLink) return
    await copyToClipboard(getReferralLink(latestLink.token), 'Link copiado.')
  }

  const handleResendLatestLink = async () => {
    if (!selectedParticipantId || !participantDetail) return
    const latestLink = participantDetail.links?.[0]
    const referralLink = latestLink?.token || participantDetail.participant.referral_code

    try {
      setIsSendingLink(true)
      setDetailError('')
      const { error } = await supabase.rpc('admin_send_referral_link', {
        p_participant_id: selectedParticipantId,
        p_referral_link_id: latestLink?.id || null,
        p_link_url: getReferralLink(referralLink),
      })
      if (error) throw error
      await fetchData()
      await openParticipant(selectedParticipantId)
      setCopyMessage('Link reenviado com sucesso.')
    } catch (error) {
      console.error(error)
      setDetailError('Não foi possível reenviar o link.')
    } finally {
      setIsSendingLink(false)
    }
  }

  const handleGenerateAndSendLink = async () => {
    if (!selectedParticipantId) return

    try {
      setIsGeneratingLink(true)
      setDetailError('')
      const { data, error } = await supabase.rpc('admin_generate_referral_link', {
        p_participant_id: selectedParticipantId,
        p_label: 'Link reemitido',
      })
      if (error) throw error

      const newLink = data?.[0] as ReferralLink | undefined
      if (!newLink) {
        throw new Error('link_not_created')
      }

      await supabase.rpc('admin_send_referral_link', {
        p_participant_id: selectedParticipantId,
        p_referral_link_id: newLink.id,
        p_link_url: getReferralLink(newLink.token),
      })
      await fetchData()
      await openParticipant(selectedParticipantId)
      setCopyMessage('Novo link gerado e enviado.')
    } catch (error) {
      console.error(error)
      setDetailError('Não foi possível gerar o novo link.')
    } finally {
      setIsGeneratingLink(false)
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

    const headers = [
      'Nome',
      'Email',
      'Telefone',
      'WhatsApp',
      'Morada',
      'Localização',
      'Igreja',
      'Recomendação',
      'Observações',
      'Faixa Etária',
      'Como Soube',
      'Convidadas',
      'Links',
      'Cliques',
      'Último Link',
      'Pódio',
      'Prémio',
      'Data Inscrição',
    ]

    const rows = participants.map((participant) => {
      const podiumPosition = podiumPositionById.get(participant.id)
      const prizeKey = typeof podiumPosition === 'number' ? PODIUM_PRIZES[podiumPosition - 1] : null
      return [
        escapeCsvField(participant.nome),
        escapeCsvField(participant.email),
        escapeCsvField(participant.telefone),
        escapeCsvField(participant.whatsapp),
        escapeCsvField(participant.morada),
        escapeCsvField(participant.localizacao || ''),
        escapeCsvField(participant.igreja || ''),
        escapeCsvField(participant.recomendacao || ''),
        escapeCsvField(participant.observacoes || ''),
        escapeCsvField(participant.faixa_etaria),
        escapeCsvField(participant.como_soube),
        escapeCsvField(String(participant.convidadas_count)),
        escapeCsvField(String(participant.total_links)),
        escapeCsvField(String(participant.total_clicks)),
        escapeCsvField(participant.latest_link_token || ''),
        escapeCsvField(podiumPosition ? `${podiumPosition}º lugar` : '—'),
        escapeCsvField(prizeKey ? PRIZE_NAMES[prizeKey] : 'Aguardando apuração'),
        escapeCsvField(new Date(participant.created_at).toLocaleString('pt-PT')),
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Inscricoes_WEX_${new Date().toISOString().split('T')[0]}.csv`)
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
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-stone-500 hover:text-amber-300"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && <p className="text-xs text-red-400">{authError}</p>}

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

      <div className="border-b border-stone-800 bg-stone-900/50">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'ranking', label: 'Ranking', icon: Crown },
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'participants', label: 'Participantes', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {dataError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                {dataError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Inscritas" value={stats?.total_inscritos || 0} />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Total Referrals" value={stats?.total_referrals || 0} />
              <StatCard icon={<Gift className="w-5 h-5" />} label="Prémios Conquistados" value={stats?.total_prizes_achieved || 0} />
              <StatCard icon={<Clock className="w-5 h-5" />} label="Prémios Pendentes" value={stats?.prizes_pending_delivery || 0} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Link2 className="w-5 h-5" />} label="Links Gerados" value={stats?.total_links || 0} />
              <StatCard icon={<Copy className="w-5 h-5" />} label="Cliques Totais" value={stats?.total_clicks || 0} />
              <StatCard icon={<MessageCircle className="w-5 h-5" />} label="Cliques WhatsApp" value={stats?.whatsapp_clicks || 0} />
              <StatCard icon={<Link2 className="w-5 h-5" />} label="Cliques Diretos" value={stats?.direct_clicks || 0} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={<FacebookBadge />} label="Facebook" value={stats?.facebook_clicks || 0} />
              <StatCard icon={<InstagramBadge />} label="Instagram" value={stats?.instagram_clicks || 0} />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Engajamento Social" value={(stats?.facebook_clicks || 0) + (stats?.instagram_clicks || 0)} />
            </div>

            {podiumEntries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-amber-100">Pódio Atual</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {podiumEntries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`rounded-2xl border p-4 ${
                        index === 0
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-stone-900 border-stone-800'
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">
                        {index + 1}º lugar
                      </p>
                      <p className="mt-2 text-lg font-bold text-stone-100 truncate">{entry.nome}</p>
                      <p className="text-sm text-stone-400">{entry.convidadas_count} convidadas</p>
                      <p className="mt-3 text-sm font-semibold text-amber-300">
                        {PRIZE_NAMES[PODIUM_PRIZES[index]]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {activeTab === 'ranking' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Ranking de Convidadoras
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  O pódio final fica com as 3 mulheres que trouxerem mais convidadas.
                </p>
              </div>

              <button
                onClick={handleFinalizePodium}
                disabled={isFinalizing || ranking.length === 0}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold disabled:opacity-50"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    A fechar...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Fechar pódio
                  </>
                )}
              </button>
            </div>

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-stone-200 truncate">
                          {entry.nome}
                        </p>
                        {index < 3 && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-bold rounded-full">
                            {PRIZE_NAMES[PODIUM_PRIZES[index]]}
                          </span>
                        )}
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
                      <p className="text-lg font-bold text-amber-400">
                        {entry.convidadas_count}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        convidadas
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notificações de Prémios e Links
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
                              href={notif.whatsapp_link || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markAsSent(notif.id)}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                            <a
                              href={notif.email_link || '#'}
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

        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes ({filteredParticipants.length})
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  Clica numa linha para abrir o modal completo do participante.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Procurar por nome, email, igreja..."
                  className="w-full md:w-80 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <select
                  value={participantFilter}
                  onChange={(e) => setParticipantFilter(e.target.value as typeof participantFilter)}
                  className="w-full md:w-44 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todos</option>
                  <option value="podium">Pódio</option>
                  <option value="linked">Com links extras</option>
                  <option value="no_links">Sem links extras</option>
                </select>
                <button
                  onClick={handleExportCSV}
                  disabled={participants.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-800">
              <table className="w-full text-left">
                <thead className="bg-stone-900/80">
                  <tr className="border-b border-stone-800">
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Nome</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Convidadas</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Links</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Cliques</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Último Link</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Pódio</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Prémio</th>
                    <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant) => {
                    const podiumPosition = podiumPositionById.get(participant.id)
                    const prizeKey = typeof podiumPosition === 'number' ? PODIUM_PRIZES[podiumPosition - 1] : null

                    return (
                      <tr
                        key={participant.id}
                        onClick={() => openParticipant(participant.id)}
                        className="border-b border-stone-800/50 hover:bg-stone-900/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1">
                            <p className="text-sm text-stone-100 font-semibold">{participant.nome}</p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {participant.igreja || 'Sem igreja registada'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-stone-400">
                          <div className="space-y-1">
                            <p>{participant.email}</p>
                            <p className="text-[11px] text-stone-500">{participant.whatsapp}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          <span className="font-bold text-amber-400">{participant.convidadas_count}</span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-stone-300">
                          <div className="space-y-1">
                            <p className="font-bold text-stone-100">{participant.total_links}</p>
                            <p className="text-[11px] text-stone-500">origem: {participant.latest_link_label || 'principal'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          <div className="space-y-1">
                            <p className="font-bold text-stone-100">{participant.total_clicks}</p>
                            <p className="text-[11px] text-stone-500">
                              W:{participant.whatsapp_clicks} · F:{participant.facebook_clicks} · I:{participant.instagram_clicks}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm text-stone-400 max-w-[220px]">
                          <div className="space-y-1">
                            <p className="truncate">{participant.latest_link_token || '—'}</p>
                            <p className="text-[11px] text-stone-500">
                              {participant.latest_link_created_at ? new Date(participant.latest_link_created_at).toLocaleDateString('pt-PT') : 'Sem data'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          {podiumPosition ? (
                            <span className="px-2 py-1 bg-amber-500/10 text-amber-300 text-xs font-bold rounded-full">
                              {podiumPosition}º lugar
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-stone-800 text-stone-500 text-xs font-bold rounded-full">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          {prizeKey ? (
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full">
                              {PRIZE_NAMES[prizeKey]}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-stone-800 text-stone-500 text-xs font-bold rounded-full">
                              Aguardando apuração
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-stone-500">
                          {new Date(participant.created_at).toLocaleDateString('pt-PT')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedParticipantId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-800 bg-stone-950/95 px-6 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-amber-100">
                      {participantDetail?.participant.nome || 'Participante'}
                    </h3>
                    {participantDetail?.click_summary && (
                      <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        {participantDetail.click_summary.total_clicks} cliques
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 mt-1">
                    {participantDetail?.participant.email}
                  </p>
                </div>

                <button
                  onClick={closeParticipantModal}
                  className="p-2 rounded-full bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-16 text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    A carregar detalhes...
                  </div>
                ) : detailError ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                    {detailError}
                  </div>
                ) : participantDetail ? (
                  <>
                    {copyMessage && (
                      <div className="rounded-2xl border border-green-500/20 bg-green-950/20 px-4 py-3 text-sm text-green-300">
                        {copyMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <MetricCard label="Convidadas" value={participantDetail.participant.convidadas_count} />
                      <MetricCard label="Links" value={participantDetail.click_summary.total_links} />
                      <MetricCard label="Cliques" value={participantDetail.click_summary.total_clicks} />
                      <MetricCard label="Pódio" value={podiumPositionById.get(participantDetail.participant.id) ? `${podiumPositionById.get(participantDetail.participant.id)}º` : '—'} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <h4 className="font-bold text-amber-100">Dados do cadastro</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <DetailItem label="Email" value={participantDetail.participant.email} />
                          <DetailItem label="Telefone" value={participantDetail.participant.telefone} />
                          <DetailItem label="WhatsApp" value={participantDetail.participant.whatsapp} />
                          <DetailItem label="Morada" value={participantDetail.participant.morada} />
                          <DetailItem label="Localização" value={participantDetail.participant.localizacao || '—'} />
                          <DetailItem label="Igreja" value={participantDetail.participant.igreja || '—'} />
                          <DetailItem label="Recomendação" value={participantDetail.participant.recomendacao || '—'} />
                          <DetailItem label="Faixa Etária" value={participantDetail.participant.faixa_etaria} />
                          <DetailItem label="Como soube" value={participantDetail.participant.como_soube} />
                          <DetailItem label="Expectativa" value={participantDetail.participant.expectativa || '—'} />
                          <DetailItem label="Observações" value={participantDetail.participant.observacoes || '—'} />
                          <DetailItem label="Referência" value={participantDetail.participant.referred_by_nome || '—'} />
                        </div>

                        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <NotebookPen className="w-4 h-4 text-amber-400" />
                            <h5 className="text-sm font-bold text-stone-100">Notas internas do admin</h5>
                          </div>
                          <textarea
                            value={adminNotesDraft}
                            onChange={(e) => setAdminNotesDraft(e.target.value)}
                            rows={5}
                            className="w-full rounded-xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                            placeholder="Notas internas, follow-up, estado do contacto..."
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={saveAdminNotes}
                              disabled={isSavingNotes}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold disabled:opacity-50"
                            >
                              {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Guardar notas
                            </button>
                          </div>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-amber-400" />
                          <h4 className="font-bold text-amber-100">Links e cliques</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <MetricCard label="WhatsApp" value={participantDetail.click_summary.whatsapp_clicks} compact />
                          <MetricCard label="Facebook" value={participantDetail.click_summary.facebook_clicks} compact />
                          <MetricCard label="Instagram" value={participantDetail.click_summary.instagram_clicks} compact />
                          <MetricCard label="Diretos" value={participantDetail.click_summary.direct_clicks} compact />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleCopyLatestLink}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-200 hover:border-amber-500/30"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar link
                          </button>
                          <button
                            onClick={handleResendLatestLink}
                            disabled={isSendingLink}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {isSendingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Reenviar link
                          </button>
                          <button
                            onClick={handleGenerateAndSendLink}
                            disabled={isGeneratingLink}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold disabled:opacity-50"
                          >
                            {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                            Gerar novo link e enviar
                          </button>
                        </div>

                        <div className="space-y-3">
                          <h5 className="text-sm font-bold text-stone-100">Histórico de links</h5>
                          {participantDetail.links.length === 0 ? (
                            <p className="text-sm text-stone-500">Ainda não existem links extra.</p>
                          ) : (
                            <div className="space-y-2">
                              {participantDetail.links.map((link, index) => (
                                <div key={link.id} className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3">
                                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-stone-100">
                                        {link.label}
                                        {index === 0 && (
                                          <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] uppercase tracking-wider">
                                            Atual
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-stone-500 break-all">{getReferralLink(link.token)}</p>
                                    </div>
                                    <button
                                      onClick={() => copyToClipboard(getReferralLink(link.token), 'Link copiado do histórico.')}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-sm text-stone-200 hover:border-amber-500/30"
                                    >
                                      <Copy className="w-4 h-4" />
                                      Copiar
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] text-stone-400">
                                    <StatPill label="Cliques" value={link.total_clicks || 0} />
                                    <StatPill label="WhatsApp" value={link.whatsapp_clicks || 0} />
                                    <StatPill label="Facebook" value={link.facebook_clicks || 0} />
                                    <StatPill label="Instagram" value={link.instagram_clicks || 0} />
                                    <StatPill label="Diretos" value={link.direct_clicks || 0} />
                                  </div>

                                  <div className="text-[11px] text-stone-500 flex flex-wrap gap-3">
                                    <span>Fonte: {link.source}</span>
                                    <span>Gerado: {new Date(link.created_at).toLocaleString('pt-PT')}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <h4 className="font-bold text-amber-100">Notificações do participante</h4>
                      </div>

                      {participantDetail.notifications.length === 0 ? (
                        <p className="text-sm text-stone-500">Sem notificações registadas.</p>
                      ) : (
                        <div className="space-y-3">
                          {participantDetail.notifications.map((notification) => (
                            <div key={notification.id} className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <p className="text-sm text-stone-100 whitespace-pre-wrap">{notification.message}</p>
                                  <p className="text-[11px] text-stone-500">
                                    {new Date(notification.created_at).toLocaleString('pt-PT')} · {notification.type}
                                  </p>
                                </div>
                                {!notification.sent ? (
                                  <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                                    Pendente
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-300 text-[10px] font-bold uppercase tracking-wider">
                                    Enviado
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

function MetricCard({ label, value, compact = false }: { label: string; value: number | string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-stone-800 bg-stone-950/70 ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`${compact ? 'text-base' : 'text-xl'} font-bold text-stone-100 mt-1`}>{value}</p>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="text-sm font-bold text-stone-100">{value}</p>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/70 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
      <p className="text-sm font-medium text-stone-100 mt-1 break-words">{value}</p>
    </div>
  )
}

function FacebookBadge() {
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-black">F</span>
}

function InstagramBadge() {
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-fuchsia-600 text-white text-[10px] font-black">I</span>
}
