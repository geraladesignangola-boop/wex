import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  UserCheck,
  CheckCircle2,
  Circle,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  X,
  Users,
  Clock,
  LogOut,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getCurrentAdmin, signOut } from '../lib/auth'
import {
  addToQueue,
  getQueue,
  getQueueCount,
  syncQueue,
  cacheParticipants,
  searchCache,
  isOnline,
  onOnlineStatusChange,
} from '../lib/offlineSync'
import type { CheckInParticipant, CheckInStats, OfflineCheckIn } from '../types/database'

const STAFF_NAME_KEY = 'wex-checkin-staff-name'

export default function CheckInPage() {
  const [staffName, setStaffName] = useState(() => localStorage.getItem(STAFF_NAME_KEY) || '')
  const [staffNameInput, setStaffNameInput] = useState('')
  const [isStaffSet, setIsStaffSet] = useState(!!localStorage.getItem(STAFF_NAME_KEY))

  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<CheckInParticipant[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [stats, setStats] = useState<CheckInStats | null>(null)
  const [online, setOnline] = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const [selectedParticipant, setSelectedParticipant] = useState<CheckInParticipant | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const admin = await getCurrentAdmin()
        if (admin) {
          setIsAuthenticated(true)
        } else {
          setAuthError('Acesso negado. Faz login no painel admin primeiro.')
        }
      } catch {
        setAuthError('Erro ao verificar autenticacao.')
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Load stats
  const loadStats = useCallback(async () => {
    if (!isAuthenticated || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.rpc('get_checkin_stats')
      if (!error && data && data.length > 0) {
        setStats(data[0])
      }
    } catch {
      // Silent fail
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      loadStats()
      const interval = setInterval(loadStats, 10000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, loadStats])

  // Load pending count
  const loadPendingCount = useCallback(async () => {
    const count = await getQueueCount()
    setPendingCount(count)
  }, [])

  useEffect(() => {
    loadPendingCount()
    const interval = setInterval(loadPendingCount, 5000)
    return () => clearInterval(interval)
  }, [loadPendingCount])

  // Online/offline listener + auto-sync
  useEffect(() => {
    const unsub = onOnlineStatusChange(async (isOnlineNow) => {
      setOnline(isOnlineNow)
      if (isOnlineNow) {
        setIsSyncing(true)
        await syncQueue()
        await loadPendingCount()
        await loadStats()
        setIsSyncing(false)
      }
    })
    return unsub
  }, [loadPendingCount, loadStats])

  // Cache participants on mount
  useEffect(() => {
    const cacheAll = async () => {
      if (!isAuthenticated || !isSupabaseConfigured) return
      try {
        const { data, error } = await supabase
          .from('inscricoes')
          .select('id, nome, email, telefone, whatsapp')
        if (!error && data) {
          await cacheParticipants(data)
        }
      } catch {
        // Silent fail
      }
    }
    if (isAuthenticated) cacheAll()
  }, [isAuthenticated])

  // Staff name handlers
  const handleSetStaffName = () => {
    const name = staffNameInput.trim()
    if (name) {
      localStorage.setItem(STAFF_NAME_KEY, name)
      setStaffName(name)
      setIsStaffSet(true)
    }
  }

  const handleChangeStaff = () => {
    localStorage.removeItem(STAFF_NAME_KEY)
    setStaffName('')
    setIsStaffSet(false)
    setStaffNameInput('')
  }

  // Search
  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setSearchError('')
      return
    }

    setIsSearching(true)
    setSearchError('')

    try {
      if (online && isSupabaseConfigured) {
        const { data, error } = await supabase.rpc('search_for_checkin', {
          p_search: term.trim(),
        })
        if (error) throw error
        setResults(data || [])
      } else {
        const cached = await searchCache(term)
        const queue = await getQueue()
        const checkedInIds = new Set(queue.map(q => q.participant_id))
        const mapped: CheckInParticipant[] = cached.map(p => ({
          ...p,
          whatsapp: p.whatsapp || '',
          checked_in: checkedInIds.has(p.id),
          checked_in_at: null,
          checked_in_by: null,
        }))
        setResults(mapped)
      }
    } catch {
      // Fallback to cache
      try {
        const cached = await searchCache(term)
        const mapped: CheckInParticipant[] = cached.map(p => ({
          ...p,
          whatsapp: p.whatsapp || '',
          checked_in: false,
          checked_in_at: null,
          checked_in_by: null,
        }))
        setResults(mapped)
      } catch {
        setSearchError('Erro ao pesquisar. Tenta novamente.')
      }
    } finally {
      setIsSearching(false)
    }
  }, [online])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchTerm)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchTerm, handleSearch])

  // Mark check-in
  const handleConfirmCheckIn = async () => {
    if (!selectedParticipant) return
    setIsMarking(true)

    try {
      if (online && isSupabaseConfigured) {
        const { data, error } = await supabase.rpc('mark_checkin', {
          p_participant_id: selectedParticipant.id,
          p_staff_name: staffName,
        })
        if (error) {
          console.error('[WEX Check-in] mark_checkin error:', error)
          if (error.message === 'already_checked_in') {
            setResults(prev => prev.map(r =>
              r.id === selectedParticipant.id ? { ...r, checked_in: true } : r
            ))
            setShowConfirmModal(false)
            setSearchError('Este participante ja fez check-in.')
            return
          }
          setSearchError(`Erro: ${error.message}`)
          return
        }
      } else {
        const offlineItem: OfflineCheckIn = {
          participant_id: selectedParticipant.id,
          participant_nome: selectedParticipant.nome,
          staff_name: staffName,
          timestamp: new Date().toISOString(),
        }
        await addToQueue(offlineItem)
      }

      setResults(prev => prev.map(r =>
        r.id === selectedParticipant.id
          ? { ...r, checked_in: true, checked_in_at: new Date().toISOString(), checked_in_by: staffName }
          : r
      ))

      setSuccessMessage(`${selectedParticipant.nome} - Check-in registado!`)
      setTimeout(() => setSuccessMessage(''), 3000)

      await loadPendingCount()
      await loadStats()

      // Vibrate on success
      if (navigator.vibrate) navigator.vibrate(100)
    } catch (err) {
      console.error('[WEX Check-in] Unexpected error:', err)
      setSearchError(`Erro inesperado: ${err instanceof Error ? err.message : 'desconhecido'}`)
    } finally {
      setIsMarking(false)
      setShowConfirmModal(false)
      setSelectedParticipant(null)
    }
  }

  // Logout
  const handleLogout = async () => {
    await signOut()
    window.location.href = '/admin'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  // Auth error
  if (authError) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-stone-100 mb-2">Acesso Negado</h1>
          <p className="text-stone-400 text-sm mb-6">{authError}</p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 text-amber-500 font-semibold text-sm hover:bg-amber-500/20 transition-colors"
          >
            Ir para o Admin
          </a>
        </div>
      </div>
    )
  }

  // Staff name selection
  if (!isStaffSet) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="p-3 bg-amber-500/10 rounded-2xl w-fit mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black font-serif text-stone-100">Check-in WEX</h1>
            <p className="text-stone-400 text-sm mt-2">Qual e o teu nome para o registo?</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={staffNameInput}
              onChange={(e) => setStaffNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetStaffName()}
              placeholder="Ex: Maria"
              className="w-full px-4 py-3.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
              autoFocus
            />
            <button
              onClick={handleSetStaffName}
              disabled={!staffNameInput.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-bold text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <UserCheck className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Check-in</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleChangeStaff}
                className="text-[10px] text-stone-500 hover:text-stone-300 transition-colors"
                title="Mudar nome"
              >
                {staffName}
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-black text-amber-500">{stats.total_checked_in}</p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-500">Presentes</p>
                </div>
                <div className="w-px h-8 bg-stone-800" />
                <div className="text-center">
                  <p className="text-lg font-black text-stone-300">{stats.total_inscritos}</p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-500">Inscritos</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-orange-500/15 text-orange-400 text-[10px] font-bold rounded-full">
                    {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                  </span>
                )}
                <span className={`flex items-center gap-1 text-[10px] font-bold ${online ? 'text-green-400' : 'text-red-400'}`}>
                  {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {stats && stats.total_inscritos > 0 && (
            <div className="mt-2 h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentual}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, email ou telefone..."
            className="w-full pl-11 pr-4 py-3.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/25 transition-colors"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setResults([]); searchInputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-500 hover:text-stone-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-lg mx-auto px-4">
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-400 text-sm font-medium">{successMessage}</p>
            </motion.div>
          )}
          {searchError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">{searchError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="max-w-lg mx-auto px-4 pb-24">
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        )}

        {!isSearching && searchTerm && results.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-stone-700 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">Nenhum resultado para "{searchTerm}"</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2">
            {results.map((participant) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border transition-colors ${
                  participant.checked_in
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-stone-900 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {participant.checked_in ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-600 flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-sm text-stone-100 truncate">{participant.nome}</h3>
                    </div>
                    <div className="mt-1.5 ml-6 space-y-0.5">
                      <p className="text-xs text-stone-400 truncate">{participant.email}</p>
                      <p className="text-xs text-stone-500">{participant.telefone}</p>
                      {participant.checked_in && participant.checked_in_at && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-green-500/70" />
                          <p className="text-[10px] text-green-500/70">
                            Check-in: {new Date(participant.checked_in_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                            {participant.checked_in_by && ` por ${participant.checked_in_by}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {!participant.checked_in && (
                    <button
                      onClick={() => { setSelectedParticipant(participant); setShowConfirmModal(true) }}
                      className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-lg transition-colors flex-shrink-0 active:scale-95"
                    >
                      Entrada
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-16">
            <div className="p-4 bg-stone-900 rounded-2xl w-fit mx-auto mb-4">
              <Search className="w-8 h-8 text-stone-700" />
            </div>
            <p className="text-stone-500 text-sm">Pesquisa por nome, email ou telefone</p>
            <p className="text-stone-600 text-xs mt-1">para registar a entrada dos participantes</p>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {showConfirmModal && selectedParticipant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowConfirmModal(false); setSelectedParticipant(null) }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="p-3 bg-amber-500/10 rounded-2xl w-fit mx-auto mb-3">
                  <UserCheck className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-stone-100">Confirmar Entrada</h2>
              </div>

              <div className="bg-stone-800/50 rounded-xl p-4 mb-6 space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Nome</p>
                  <p className="text-sm font-semibold text-stone-100">{selectedParticipant.nome}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Email</p>
                  <p className="text-sm text-stone-300">{selectedParticipant.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Telefone</p>
                  <p className="text-sm text-stone-300">{selectedParticipant.telefone}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowConfirmModal(false); setSelectedParticipant(null) }}
                  className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-400 font-semibold text-sm hover:bg-stone-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmCheckIn}
                  disabled={isMarking}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-bold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  {isMarking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syncing indicator */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 z-40"
          >
            <div className="max-w-lg mx-auto px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
              <p className="text-amber-400 text-xs font-medium">Sincronizando check-ins pendentes...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
