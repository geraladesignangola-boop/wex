import React from 'react'
import {
  Settings,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Users,
  Link2,
  Bell,
  Shield,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { DashboardStats } from '../../types/database'

interface DefinicoesPageProps {
  stats: DashboardStats | null
  whatsappGroupLink: string
  onWhatsappGroupLinkChange: (value: string) => void
}

export default function DefinicoesPage({ stats, whatsappGroupLink, onWhatsappGroupLinkChange }: DefinicoesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          Definicoes da Campanha
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Informacoes gerais e configuracoes da campanha de inscricao.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Detalhes do evento
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Data" value="8 de Agosto de 2026" />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Horario" value="9h as 17h" />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Local" value="Mediateca de Luanda" />
            <InfoRow icon={<Ticket className="w-4 h-4" />} label="Entrada" value="Gratuita (vagas limitadas)" />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            Metricas da campanha
          </h3>
          <div className="space-y-3">
            <InfoRow icon={<Users className="w-4 h-4" />} label="Total inscritas" value={String(stats?.total_inscritos || 0)} />
            <InfoRow icon={<Link2 className="w-4 h-4" />} label="Links gerados" value={String(stats?.total_links || 0)} />
            <InfoRow icon={<Bell className="w-4 h-4" />} label="Total referrals" value={String(stats?.total_referrals || 0)} />
            <InfoRow icon={<Shield className="w-4 h-4" />} label="Premios atribuidos" value={String(stats?.total_prizes_achieved || 0)} />
          </div>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-stone-100">Links de partilha</h3>
        <p className="text-[13px] text-stone-400">
          Partilha estes links para promover a campanha de inscricao.
        </p>
        <div className="space-y-2">
          <LinkRow
            label="Pagina principal"
            url={typeof window !== 'undefined' ? window.location.origin : ''}
          />
          <LinkRow
            label="Pagina de convite"
            url={typeof window !== 'undefined' ? `${window.location.origin}/convite` : ''}
          />
          <LinkRow
            label="Painel administrativo"
            url={typeof window !== 'undefined' ? `${window.location.origin}/admin` : ''}
          />
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-stone-100">Canais de comunicacao</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-800 bg-stone-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1">WhatsApp</p>
            <p className="text-[13px] text-stone-200">+244 932 583 167</p>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1">Email</p>
            <p className="text-[13px] text-stone-200">geral@womanexperience.ao</p>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1">Instagram</p>
            <p className="text-[13px] text-stone-200">@mulheresdefogo.ao</p>
          </div>
          <div className="rounded-xl border border-stone-800 bg-stone-950/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold mb-1">Facebook</p>
            <p className="text-[13px] text-stone-200">Mulheres de Fogo AO</p>
          </div>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-500" />
          Grupo de WhatsApp
        </h3>
        <p className="text-[13px] text-stone-400">
          Insere o link de convite do grupo de WhatsApp. Este link sera enviado quando clicares em "Adicionar" na tabela de participantes.
        </p>
        <input
          type="url"
          value={whatsappGroupLink}
          onChange={(e) => onWhatsappGroupLinkChange(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full px-4 py-2.5 rounded-xl border border-stone-800 bg-stone-950/50 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-green-500/50 transition-colors"
        />
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-stone-600">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold">{label}</p>
        <p className="text-[13px] text-stone-200">{value}</p>
      </div>
    </div>
  )
}

function LinkRow({ label, url }: { label: string; url: string }) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-950/50 px-3 py-2">
      <span className="text-[11px] text-stone-500 w-36 flex-shrink-0">{label}</span>
      <span className="text-[12px] text-stone-300 flex-1 truncate font-mono">{url}</span>
      <button
        onClick={copyToClipboard}
        className="text-[11px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
      >
        <ExternalLink className="w-3 h-3" />
        Copiar
      </button>
    </div>
  )
}
