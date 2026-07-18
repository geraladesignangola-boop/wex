import React from 'react'
import {
  LayoutDashboard,
  Crown,
  Bell,
  Users,
  Gift,
  Settings,
  Trophy,
  Menu,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export type AdminTab = 'dashboard' | 'ranking' | 'notifications' | 'participants' | 'prizes' | 'settings'

interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  isMobileOpen: boolean
  onMobileToggle: () => void
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType; group?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ranking', label: 'Ranking', icon: Crown },
  { id: 'notifications', label: 'Notificacoes', icon: Bell },
  { id: 'participants', label: 'Participantes', icon: Users },
  { id: 'prizes', label: 'Premios', icon: Gift, group: 'Configuracao' },
  { id: 'settings', label: 'Definicoes', icon: Settings },
]

export default function AdminSidebar({ activeTab, onTabChange, isMobileOpen, onMobileToggle }: AdminSidebarProps) {
  let lastGroup: string | undefined

  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab)
    if (isMobileOpen) onMobileToggle()
  }

  const sidebarContent = (
    <aside className="w-[220px] min-h-screen bg-stone-900 border-r border-stone-800 flex flex-col">
      <div className="px-4 py-5 border-b border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-sm font-bold text-stone-100">WEX Admin</span>
            </div>
          </div>
          <button
            onClick={onMobileToggle}
            className="md:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const showGroup = item.group && item.group !== lastGroup
          if (item.group) lastGroup = item.group

          return (
            <React.Fragment key={item.id}>
              {showGroup && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 px-3 pt-4 pb-1">
                  {item.group}
                </p>
              )}
              <button
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-amber-500/10 text-amber-500 font-semibold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </React.Fragment>
          )
        })}
      </nav>
    </aside>
  )

  return (
    <>
      <button
        onClick={onMobileToggle}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden md:block">
        {sidebarContent}
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={onMobileToggle}
            />
            <motion.div
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
