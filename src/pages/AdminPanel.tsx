import React, { useEffect, useMemo, useState } from 'react'
import ExcelJS from 'exceljs'
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
import AdminSidebar, { AdminTab } from '../components/admin/AdminSidebar'
import AdminDashboard from '../components/admin/AdminDashboard'
import PremiosPage from '../components/admin/PremiosPage'
import DefinicoesPage from '../components/admin/DefinicoesPage'

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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
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
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('https://chat.whatsapp.com/JX7TIQXGIZ60bnwEl7DTEW')
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set())
  const [showBulkSendModal, setShowBulkSendModal] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const admin = await getCurrentAdmin()
        if (admin) {
          setIsAuthenticated(true)
          await fetchData()
          const { data: setting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'whatsapp_group_link')
            .single()
          if (setting?.value) setWhatsappGroupLink(setting.value)
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

  useEffect(() => {
    if (!isAuthenticated) return
    const saveGroupLink = async () => {
      await supabase
        .from('app_settings')
        .upsert({ key: 'whatsapp_group_link', value: whatsappGroupLink }, { onConflict: 'key' })
    }
    saveGroupLink()
  }, [whatsappGroupLink, isAuthenticated])

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
  const podiumPositionById = new Map<string, number>(podiumEntries.map((entry, index) => [entry.id, index + 1]))

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
      setAuthError(err.message || 'Credenciais invalidas')
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

  const handleNotifyAll = async () => {
    const confirmed = window.confirm(
      'Confirmas o envio de notificacoes para todas as participantes?'
    )
    if (!confirmed) return

    try {
      setDataError('')
      const { data: allParticipants } = await supabase
        .from('inscricoes')
        .select('id, nome, email, whatsapp')

      if (!allParticipants || allParticipants.length === 0) {
        setDataError('Nenhuma participante encontrada.')
        return
      }

      let sentCount = 0
      for (const p of allParticipants) {
        const msg = `Olá ${p.nome}!\n\nLembrete: A Imersão WEX acontece no dia 8 de Agosto na Mediateca de Luanda. Não esqueças!\n\nMulheres de Fogo`
        const digits = (p.whatsapp || '').replace(/\D/g, '')

        await supabase.from('notifications').insert({
          participant_id: p.id,
          type: 'reminder',
          message: msg,
          whatsapp_link: digits ? `https://wa.me/${digits}?text=${encodeURIComponent(msg)}` : null,
          email_link: `mailto:${p.email}?subject=Lembrete%20Imersao%20WEX`,
        })
        sentCount++
      }

      alert(`${sentCount} notificacoes criadas com sucesso.`)
      await fetchData()
    } catch (err) {
      console.error('Erro ao notificar todas:', err)
      setDataError('Nao foi possivel criar as notificacoes.')
    }
  }

  const handleAddToGroup = (participant: AdminParticipantOverview) => {
    if (!whatsappGroupLink) {
      alert('Configura o link do grupo de WhatsApp em Definicoes primeiro.')
      return
    }
    const digits = (participant.whatsapp || '').replace(/\D/g, '')
    if (!digits) {
      alert('Este participante nao tem numero de WhatsApp registado.')
      return
    }
    const msg = `Ola ${participant.nome}! 🔥\n\nVimos que te inscreveste para participar na Imersao WEX Mulheres de Fogo e estamos muito contentes! 🔥\n\nPara ficares por dentro de todas as novidades, actualizacoes do evento e conteudos exclusivos, criamos um grupo oficial so para inscritas.\n\nEntra ja:\n${whatsappGroupLink}\n\nAguardamos-te! 🔥 Mulheres de Fogo 🔥`
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleNotifySelected = () => {
    if (selectedParticipantIds.size === 0) {
      alert('Seleciona pelo menos uma participante na tabela.')
      return
    }
    if (!whatsappGroupLink) {
      alert('Configura o link do grupo de WhatsApp em Definicoes primeiro.')
      return
    }
    setShowBulkSendModal(true)
  }

  const handleSendToSingle = (participant: AdminParticipantOverview) => {
    const digits = (participant.whatsapp || '').replace(/\D/g, '')
    if (!digits) return
    const msg = `Ola ${participant.nome}! 🔥\n\nVimos que te inscreveste para participar na Imersao WEX Mulheres de Fogo e estamos muito contentes! 🔥\n\nPara ficares por dentro de todas as novidades, actualizacoes do evento e conteudos exclusivos, criamos um grupo oficial so para inscritas.\n\nEntra ja:\n${whatsappGroupLink}\n\nAguardamos-te! 🔥 Mulheres de Fogo 🔥`
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, '_blank')
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
      setDataError('Nao foi possivel carregar os dados do painel.')
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
        setDetailError('Migrations novas ainda nao aplicadas; a vista detalhada esta em modo basico.')
      } else {
        setDetailError('Nao foi possivel carregar este participante.')
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
      console.error('Erro ao marcar notificacao:', err)
      setDataError('Nao foi possivel marcar a notificacao como enviada.')
    }
  }

  const handleFinalizePodium = async () => {
    const shouldFinalize = window.confirm(
      'Confirmas a apuracao final do podio? Isto vai substituir os premios anteriores.'
    )

    if (!shouldFinalize) return

    try {
      setIsFinalizing(true)
      setDataError('')
      const { error } = await supabase.rpc('assign_podium_prizes')
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Erro ao apurar o podio:', err)
      setDataError('Nao foi possivel fechar o podio agora.')
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
      setDetailError('Nao foi possivel guardar as notas.')
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
      setDetailError('Nao foi possivel copiar o link agora.')
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
      setDetailError('Nao foi possivel reenviar o link.')
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
      setDetailError('Nao foi possivel gerar o novo link.')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleExportCSV = async () => {
    if (participants.length === 0) return

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Inscricoes WEX')

    sheet.mergeCells('A1:R1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = 'Inscrições WEX — Painel de Participantes'
    titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 35

    const headers = [
      'Nome', 'Email', 'Telefone', 'WhatsApp', 'Morada', 'Localização',
      'Igreja', 'Recomendação', 'Observações', 'Faixa Etária', 'Como Soube',
      'Convidadas', 'Links', 'Cliques', 'Último Link', 'Pódio', 'Prémio', 'Data Inscrição'
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF000000' }, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5A623' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
      }
    })
    headerRow.height = 28

    participants.forEach((p) => {
      const podium = podiumPositionById.get(p.id)
      const prizeKey = typeof podium === 'number' ? PODIUM_PRIZES[podium - 1] : null

      const row = sheet.addRow([
        p.nome, p.email, p.telefone, p.whatsapp, p.morada,
        p.localizacao || '', p.igreja || '', p.recomendacao || '',
        p.observacoes || '', p.faixa_etaria, p.como_soube,
        p.convidadas_count, p.total_links, p.total_clicks,
        p.latest_link_token || '',
        podium ? `${podium}º lugar` : '--',
        prizeKey ? PRIZE_NAMES[prizeKey] : 'Aguardando apuração',
        new Date(p.created_at).toLocaleString('pt-PT')
      ])

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        }
        cell.alignment = { horizontal: [12, 13, 14].includes(colNumber) ? 'right' : 'left' }
      })
    })

    sheet.columns.forEach((col) => { col.width = 20 })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Inscricoes_WEX_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isBooting) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 text-stone-400">
        A validar sessao administrativa...
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-amber-100 mb-2">
            Configuracao em falta
          </h1>
          <p className="text-stone-400 text-sm mb-6">
            As variaveis de ambiente do Supabase nao estao configuradas no Vercel.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-sm"
          >
            Voltar a pagina principal
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
          className="w-full max-w-md bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800"
        >
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-amber-100 font-serif">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-stone-500 text-sm">
              Imersao WEX - Mulheres de Fogo
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
                  placeholder="********"
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
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
    <div className="min-h-screen bg-stone-950 flex">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden md:ml-0">
        <header className="bg-stone-900 border-b border-stone-800 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="pl-10 md:pl-0">
            <h1 className="text-sm md:text-base font-bold text-stone-100">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'ranking' && 'Ranking'}
              {activeTab === 'notifications' && 'Notificacoes'}
              {activeTab === 'participants' && 'Participantes'}
              {activeTab === 'prizes' && 'Premios'}
              {activeTab === 'settings' && 'Definicoes'}
            </h1>
            {activeTab === 'dashboard' && (
              <p className="text-[11px] text-stone-500 mt-0.5 hidden sm:block">Campanha de inscricao -- atualizado agora</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {activeTab === 'dashboard' && (
              <button
                onClick={handleNotifyAll}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1.5 bg-amber-500 text-stone-950 rounded-lg text-[11px] md:text-xs font-bold transition-colors hover:bg-amber-400"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Notificar todas</span>
                <span className="sm:hidden">Notificar</span>
              </button>
            )}
            {activeTab === 'participants' && (
              <button
                onClick={handleExportCSV}
                disabled={participants.length === 0}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1.5 bg-stone-800 text-stone-300 hover:text-white rounded-lg text-[11px] md:text-xs font-medium disabled:opacity-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar .xlsx</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 text-stone-500 hover:text-white text-[11px] md:text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {dataError && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              {dataError}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <AdminDashboard stats={stats} ranking={ranking} />
          )}

          {activeTab === 'ranking' && (
            <RankingSection
              ranking={ranking}
              isFinalizing={isFinalizing}
              onFinalize={handleFinalizePodium}
              podiumEntries={podiumEntries}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsSection
              notifications={notifications}
              onMarkAsSent={markAsSent}
            />
          )}

          {activeTab === 'participants' && (
            <ParticipantsSection
              participants={filteredParticipants}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              participantFilter={participantFilter}
              onFilterChange={setParticipantFilter}
              podiumPositionById={podiumPositionById}
              onSelectParticipant={openParticipant}
              selectedIds={selectedParticipantIds}
              onToggleSelect={(id) => {
                setSelectedParticipantIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }}
              onSelectAll={() => {
                if (selectedParticipantIds.size === filteredParticipants.length) {
                  setSelectedParticipantIds(new Set())
                } else {
                  setSelectedParticipantIds(new Set(filteredParticipants.map((p) => p.id)))
                }
              }}
              onNotifySelected={handleNotifySelected}
            />
          )}

          {activeTab === 'prizes' && (
            <PremiosPage ranking={ranking} />
          )}

          {activeTab === 'settings' && (
            <DefinicoesPage stats={stats} whatsappGroupLink={whatsappGroupLink} onWhatsappGroupLinkChange={setWhatsappGroupLink} />
          )}
        </main>
      </div>

      <AnimatePresence>
        {selectedParticipantId && (
          <ParticipantModal
            participantDetail={participantDetail}
            isDetailLoading={isDetailLoading}
            detailError={detailError}
            copyMessage={copyMessage}
            adminNotesDraft={adminNotesDraft}
            onAdminNotesChange={setAdminNotesDraft}
            isSavingNotes={isSavingNotes}
            isGeneratingLink={isGeneratingLink}
            isSendingLink={isSendingLink}
            podiumPositionById={podiumPositionById}
            onClose={closeParticipantModal}
            onSaveNotes={saveAdminNotes}
            onCopyLink={handleCopyLatestLink}
            onResendLink={handleResendLatestLink}
            onGenerateLink={handleGenerateAndSendLink}
            onCopyToClipboard={copyToClipboard}
            getReferralLink={getReferralLink}
            onAddToGroup={() => { if (participantDetail?.participant) handleAddToGroup(participantDetail.participant as AdminParticipantOverview) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkSendModal && (
          <BulkSendModal
            participants={participants.filter((p) => selectedParticipantIds.has(p.id))}
            whatsappGroupLink={whatsappGroupLink}
            onSend={handleSendToSingle}
            onClose={() => { setShowBulkSendModal(false); setSelectedParticipantIds(new Set()) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Sub-sections ---

function RankingSection({
  ranking,
  isFinalizing,
  onFinalize,
  podiumEntries,
}: {
  ranking: RankingEntry[]
  isFinalizing: boolean
  onFinalize: () => void
  podiumEntries: RankingEntry[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Ranking de Convidadoras
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            O podio final fica com as 3 mulheres que trouxerem mais convidadas.
          </p>
        </div>

        <button
          onClick={onFinalize}
          disabled={isFinalizing || ranking.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white text-sm font-bold disabled:opacity-50"
        >
          {isFinalizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A fechar...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Fechar podio
            </>
          )}
        </button>
      </div>

      {podiumEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {podiumEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`rounded-2xl border p-3 sm:p-4 ${
                index === 0
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-stone-900 border-stone-800'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wider text-stone-500">
                {index + 1}o lugar
              </p>
              <p className="mt-2 text-lg font-bold text-stone-100 truncate">{entry.nome}</p>
              <p className="text-sm text-stone-400">{entry.convidadas_count} convidadas</p>
              <p className="mt-3 text-sm font-semibold text-amber-300">
                {PRIZE_NAMES[PODIUM_PRIZES[index]]}
              </p>
            </div>
          ))}
        </div>
      )}

      {ranking.length === 0 ? (
        <p className="text-stone-500 text-center py-8">
          Ainda nao ha dados de referral.
        </p>
      ) : (
        <div className="space-y-2">
          {ranking.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-stone-900 rounded-xl border border-stone-800"
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
                      PREMIO
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
  )
}

function NotificationsSection({
  notifications,
  onMarkAsSent,
}: {
  notifications: Notification[]
  onMarkAsSent: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
        <Mail className="w-5 h-5" />
        Notificacoes de Premios e Links
      </h2>

      {notifications.length === 0 ? (
        <p className="text-stone-500 text-center py-8">
          Nenhuma notificacao pendente.
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 sm:p-4 rounded-xl border ${
                notif.sent
                  ? 'bg-stone-900/50 border-stone-800/50 opacity-60'
                  : 'bg-stone-900 border-amber-500/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-200 whitespace-pre-wrap break-words">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-2">
                    {new Date(notif.created_at).toLocaleString('pt-PT')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  {!notif.sent ? (
                    <>
                      <a
                        href={notif.whatsapp_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onMarkAsSent(notif.id)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                      <a
                        href={notif.email_link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onMarkAsSent(notif.id)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        Email
                      </a>
                    </>
                  ) : (
                    <span className="px-3 py-2 bg-stone-800 text-stone-500 text-xs font-bold rounded-lg flex items-center justify-center gap-1">
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
  )
}

function ParticipantsSection({
  participants,
  searchTerm,
  onSearchChange,
  participantFilter,
  onFilterChange,
  podiumPositionById,
  onSelectParticipant,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onNotifySelected,
}: {
  participants: AdminParticipantOverview[]
  searchTerm: string
  onSearchChange: (v: string) => void
  participantFilter: 'all' | 'podium' | 'linked' | 'no_links'
  onFilterChange: (v: 'all' | 'podium' | 'linked' | 'no_links') => void
  podiumPositionById: Map<string, number>
  onSelectParticipant: (id: string) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onNotifySelected: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-100 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes ({participants.length})
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Clica numa linha para abrir o modal completo do participante.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Procurar por nome, email, igreja..."
            className="w-full md:w-80 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
          />
          <select
            value={participantFilter}
            onChange={(e) => onFilterChange(e.target.value as typeof participantFilter)}
            className="w-full md:w-44 bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos</option>
            <option value="podium">Podio</option>
            <option value="linked">Com links extras</option>
            <option value="no_links">Sem links extras</option>
          </select>
          {selectedIds.size > 0 && (
            <button
              onClick={onNotifySelected}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-500 transition-colors"
            >
              <Send className="w-4 h-4" />
              Enviar para {selectedIds.size} selecionada(s)
            </button>
          )}
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto rounded-2xl border border-stone-800">
        <table className="w-full text-left">
          <thead className="bg-stone-900/80">
            <tr className="border-b border-stone-800">
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">
                <input
                  type="checkbox"
                  checked={selectedIds.size === participants.length && participants.length > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
                />
              </th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Nome</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Contacto</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Convidadas</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Links</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Cliques</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Ultimo Link</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Podio</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Premio</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Data</th>
              <th className="px-4 py-3 text-xs font-bold text-amber-300 uppercase">Grupo</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => {
              const podiumPosition = podiumPositionById.get(participant.id)
              const prizeKey = typeof podiumPosition === 'number' ? PODIUM_PRIZES[podiumPosition - 1] : null

              return (
                <tr
                  key={participant.id}
                  onClick={() => onSelectParticipant(participant.id)}
                  className={`border-b border-stone-800/50 hover:bg-stone-900/50 cursor-pointer transition-colors ${selectedIds.has(participant.id) ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(participant.id)}
                      onChange={(e) => { e.stopPropagation(); onToggleSelect(participant.id) }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
                    />
                  </td>
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
                      <p className="truncate">{participant.latest_link_token || '--'}</p>
                      <p className="text-[11px] text-stone-500">
                        {participant.latest_link_created_at ? new Date(participant.latest_link_created_at).toLocaleDateString('pt-PT') : 'Sem data'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm">
                    {podiumPosition ? (
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-300 text-xs font-bold rounded-full">
                        {podiumPosition}o lugar
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-stone-800 text-stone-500 text-xs font-bold rounded-full">
                        --
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
                        Aguardando apuracao
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-stone-500">
                    {new Date(participant.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToGroup(participant) }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600/10 text-green-400 hover:bg-green-600/20 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Adicionar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            checked={selectedIds.size === participants.length && participants.length > 0}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-xs text-stone-500">Selecionar todos</span>
        </div>

        {participants.map((participant) => {
          const podiumPosition = podiumPositionById.get(participant.id)
          const prizeKey = typeof podiumPosition === 'number' ? PODIUM_PRIZES[podiumPosition - 1] : null

          return (
            <div
              key={participant.id}
              onClick={() => onSelectParticipant(participant.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                selectedIds.has(participant.id)
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-stone-900 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(participant.id)}
                  onChange={(e) => { e.stopPropagation(); onToggleSelect(participant.id) }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-100 truncate">{participant.nome}</p>
                      <p className="text-[11px] text-stone-500 truncate">
                        {participant.igreja || 'Sem igreja registada'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {podiumPosition && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-bold rounded-full">
                          {podiumPosition}º
                        </span>
                      )}
                      {prizeKey && (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-full">
                          {PRIZE_NAMES[prizeKey]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-stone-950/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-400">{participant.convidadas_count}</p>
                      <p className="text-[10px] text-stone-500">Convidadas</p>
                    </div>
                    <div className="bg-stone-950/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-stone-100">{participant.total_links}</p>
                      <p className="text-[10px] text-stone-500">Links</p>
                    </div>
                    <div className="bg-stone-950/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-stone-100">{participant.total_clicks}</p>
                      <p className="text-[10px] text-stone-500">Cliques</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-stone-500 truncate">
                      {participant.email}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToGroup(participant) }}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/10 text-green-400 rounded-lg text-[10px] font-semibold flex-shrink-0"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Grupo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Participant Modal ---

function ParticipantModal({
  participantDetail,
  isDetailLoading,
  detailError,
  copyMessage,
  adminNotesDraft,
  onAdminNotesChange,
  isSavingNotes,
  isGeneratingLink,
  isSendingLink,
  podiumPositionById,
  onClose,
  onSaveNotes,
  onCopyLink,
  onResendLink,
  onGenerateLink,
  onCopyToClipboard,
  getReferralLink,
  onAddToGroup,
}: {
  participantDetail: ParticipantDetail | null
  isDetailLoading: boolean
  detailError: string
  copyMessage: string
  adminNotesDraft: string
  onAdminNotesChange: (v: string) => void
  isSavingNotes: boolean
  isGeneratingLink: boolean
  isSendingLink: boolean
  podiumPositionById: Map<string, number>
  onClose: () => void
  onSaveNotes: () => void
  onCopyLink: () => void
  onResendLink: () => void
  onGenerateLink: () => void
  onCopyToClipboard: (value: string, msg: string) => void
  getReferralLink: (token: string) => string
  onAddToGroup: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 sm:gap-4 border-b border-stone-800 bg-stone-950/95 px-4 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-amber-100 truncate">
                {participantDetail?.participant.nome || 'Participante'}
              </h3>
              {participantDetail?.click_summary && (
                <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                  {participantDetail.click_summary.total_clicks} cliques
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 mt-1 truncate">
              {participantDetail?.participant.email}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard label="Convidadas" value={participantDetail.participant.convidadas_count} />
                <MetricCard label="Links" value={participantDetail.click_summary.total_links} />
                <MetricCard label="Cliques" value={participantDetail.click_summary.total_clicks} />
                <MetricCard label="Podio" value={podiumPositionById.get(participantDetail.participant.id) ? `${podiumPositionById.get(participantDetail.participant.id)}o` : '--'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-amber-100">Dados do cadastro</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <DetailItem label="Email" value={participantDetail.participant.email} />
                    <DetailItem label="Telefone" value={participantDetail.participant.telefone} />
                    <DetailItem label="WhatsApp" value={participantDetail.participant.whatsapp} />
                    <DetailItem label="Morada" value={participantDetail.participant.morada} />
                    <DetailItem label="Localizacao" value={participantDetail.participant.localizacao || '--'} />
                    <DetailItem label="Igreja" value={participantDetail.participant.igreja || '--'} />
                    <DetailItem label="Recomendacao" value={participantDetail.participant.recomendacao || '--'} />
                    <DetailItem label="Faixa Etaria" value={participantDetail.participant.faixa_etaria} />
                    <DetailItem label="Como soube" value={participantDetail.participant.como_soube} />
                    <DetailItem label="Expectativa" value={participantDetail.participant.expectativa || '--'} />
                    <DetailItem label="Observacoes" value={participantDetail.participant.observacoes || '--'} />
                    <DetailItem label="Referencia" value={participantDetail.participant.referred_by_nome || '--'} />
                  </div>

                  <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="w-4 h-4 text-amber-400" />
                      <h5 className="text-sm font-bold text-stone-100">Notas internas do admin</h5>
                    </div>
                    <textarea
                      value={adminNotesDraft}
                      onChange={(e) => onAdminNotesChange(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-stone-800 bg-stone-900 px-4 py-3 text-sm text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                      placeholder="Notas internas, follow-up, estado do contacto..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={onSaveNotes}
                        disabled={isSavingNotes}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white text-sm font-bold disabled:opacity-50"
                      >
                        {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Guardar notas
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 sm:p-5 space-y-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={onCopyLink}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-200 hover:border-amber-500/30"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar link
                    </button>
                    <button
                      onClick={onResendLink}
                      disabled={isSendingLink}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {isSendingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Reenviar link
                    </button>
                    <button
                      onClick={onGenerateLink}
                      disabled={isGeneratingLink}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white text-sm font-bold disabled:opacity-50"
                    >
                      {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                      Gerar novo link
                    </button>
                    <button
                      onClick={onAddToGroup}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600/10 border border-green-600/30 text-green-400 hover:bg-green-600/20 text-sm font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Adicionar ao grupo
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-bold text-stone-100">Historico de links</h5>
                    {participantDetail.links.length === 0 ? (
                      <p className="text-sm text-stone-500">Ainda nao existem links extra.</p>
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
                                onClick={() => onCopyToClipboard(getReferralLink(link.token), 'Link copiado do historico.')}
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

              <section className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-amber-100">Notificacoes do participante</h4>
                </div>

                {participantDetail.notifications.length === 0 ? (
                  <p className="text-sm text-stone-500">Sem notificacoes registadas.</p>
                ) : (
                  <div className="space-y-3">
                    {participantDetail.notifications.map((notification) => (
                      <div key={notification.id} className="rounded-2xl border border-stone-800 bg-stone-950/60 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-sm text-stone-100 whitespace-pre-wrap break-words">{notification.message}</p>
                            <p className="text-[11px] text-stone-500">
                              {new Date(notification.created_at).toLocaleString('pt-PT')} · {notification.type}
                            </p>
                          </div>
                          {!notification.sent ? (
                            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
                              Pendente
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-300 text-[10px] font-bold uppercase tracking-wider flex-shrink-0">
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
  )
}

// --- Shared tiny components ---

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

function BulkSendModal({
  participants,
  whatsappGroupLink,
  onSend,
  onClose,
}: {
  participants: AdminParticipantOverview[]
  whatsappGroupLink: string
  onSend: (p: AdminParticipantOverview) => void
  onClose: () => void
}) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  const handleSend = (p: AdminParticipantOverview) => {
    onSend(p)
    setSentIds((prev) => new Set(prev).add(p.id))
  }

  const validParticipants = participants.filter((p) => (p.whatsapp || '').replace(/\D/g, ''))
  const invalidParticipants = participants.filter((p) => !(p.whatsapp || '').replace(/\D/g, ''))

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] flex flex-col rounded-2xl sm:rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-amber-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="truncate">Enviar convite</span>
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              {participants.length} selecionada(s) — {sentIds.size} enviada(s)
            </p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors flex-shrink-0 ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-2">
          {validParticipants.map((p) => {
            const digits = (p.whatsapp || '').replace(/\D/g, '')
            const isSent = sentIds.has(p.id)
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  isSent ? 'border-green-500/30 bg-green-500/5' : 'border-stone-800 bg-stone-900/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-100 truncate">{p.nome}</p>
                  <p className="text-[11px] text-stone-500">{p.whatsapp}</p>
                </div>
                {isSent ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-400 font-semibold whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" />
                    Enviado
                  </span>
                ) : (
                  <button
                    onClick={() => handleSend(p)}
                    disabled={!digits}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Enviar
                  </button>
                )}
              </div>
            )
          })}

          {invalidParticipants.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="text-xs font-semibold text-amber-300 mb-1">
                {invalidParticipants.length} participante(s) sem numero de WhatsApp:
              </p>
              {invalidParticipants.map((p) => (
                <p key={p.id} className="text-[11px] text-stone-500">{p.nome}</p>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-stone-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500 truncate">
            {sentIds.size === validParticipants.length && validParticipants.length > 0
              ? 'Todas enviadas!'
              : `Faltam ${validParticipants.length - sentIds.size}`}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 text-stone-200 text-sm font-semibold rounded-xl hover:bg-stone-700 transition-colors flex-shrink-0"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
