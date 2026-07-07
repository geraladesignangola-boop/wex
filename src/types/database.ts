export interface Oradora {
  id: string;
  nome: string;
  cargo: string;
  subtitulo?: string;
  fotoUrl?: string;
  isMain?: boolean;
}

export interface Inscricao {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  morada: string
  igreja?: string
  faixa_etaria: '18-25' | '26-35' | '36-45' | '46+'
  como_soube: 'Instagram' | 'Facebook' | 'Indicação de amiga' | 'Igreja' | 'Outro'
  expectativa?: string
  referral_code: string
  meta_convidadas: 3 | 6 | 10 | 15 | null
  convidadas_count: number
  referred_by?: string
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  created_at: string
}

export interface PrizeClaim {
  id: string
  participant_id: string
  prize_level: 'camisa' | 'agenda' | 'agenda_camisa' | 'pack_completo'
  status: 'pending' | 'notified' | 'delivered'
  notified_at?: string
  delivered_at?: string
  created_at: string
}

export interface Notification {
  id: string
  participant_id: string
  type: 'prize_achieved' | 'reminder'
  message: string
  whatsapp_link?: string
  email_link?: string
  read: boolean
  sent: boolean
  created_at: string
}

export interface Admin {
  id: string
  nome: string
  email: string
  role: 'admin' | 'super_admin'
  created_at: string
}

export interface ReferrerInfo {
  id: string
  nome: string
  meta_convidadas: number
  convidadas_count: number
}

export interface DashboardStats {
  total_inscritos: number
  total_referrals: number
  total_prizes_achieved: number
  prizes_pending_delivery: number
  top_referrer_nome: string
  top_referrer_count: number
}

export interface RankingEntry {
  id: string
  nome: string
  email: string
  whatsapp: string
  convidadas_count: number
  meta_convidadas: number
  percentage: number
  prize_achieved: boolean
}

export type PrizeName = 'camisa' | 'agenda' | 'agenda_camisa' | 'pack_completo'

export const PRIZE_NAMES: Record<PrizeName, string> = {
  camisa: 'Camisa Mulheres de Fogo',
  agenda: 'Agenda Personalizada',
  agenda_camisa: 'Agenda + Camisa',
  pack_completo: 'Pack Completo (Agenda + Camisa + Bíblia)',
}

export const META_OPTIONS = [
  { value: 3 as const, label: '3', prize: 'Camisa' },
  { value: 6 as const, label: '6', prize: 'Agenda' },
  { value: 10 as const, label: '10', prize: 'Agenda + Camisa' },
  { value: 15 as const, label: '15', prize: 'Pack Completo' },
]
