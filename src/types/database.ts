export interface Inscricao {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  morada: string
  igreja?: string | null
  localizacao?: string | null
  recomendacao?: string | null
  observacoes?: string | null
  admin_notes?: string | null
  faixa_etaria: '18-25' | '26-35' | '36-45' | '46+'
  como_soube: 'Instagram' | 'Facebook' | 'Indicação de amiga' | 'Igreja' | 'Outro'
  expectativa?: string | null
  referral_code: string
  meta_convidadas: number | null
  convidadas_count: number
  referred_by?: string | null
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  created_at: string
}

export interface ReferralLink {
  id: string
  participant_id: string
  token: string
  label: string
  source: 'legacy' | 'admin' | 'manual' | 'share'
  created_by_admin?: string | null
  created_at: string
  total_clicks?: number
  facebook_clicks?: number
  instagram_clicks?: number
  whatsapp_clicks?: number
  direct_clicks?: number
}

export interface ReferralLinkClick {
  id: string
  referral_link_id: string
  participant_id: string
  source: 'direct' | 'facebook' | 'instagram' | 'whatsapp' | 'email' | 'admin' | 'other'
  user_agent?: string | null
  clicked_at: string
}

export interface PrizeClaim {
  id: string
  participant_id: string
  prize_level: 'camisa' | 'agenda' | 'pack_completo'
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

export interface Oradora {
  id: string
  nome: string
  cargo: string
  subtitulo?: string
  fotoUrl?: string
  isMain?: boolean
}

export interface ReferrerInfo {
  id: string
  nome: string
  meta_convidadas: number | null
  convidadas_count: number
  referral_code?: string
  referral_link_id?: string | null
  referral_link_token?: string | null
  referral_link_label?: string | null
  total_links?: number
  total_clicks?: number
  facebook_clicks?: number
  instagram_clicks?: number
  whatsapp_clicks?: number
  direct_clicks?: number
}

export interface DashboardStats {
  total_inscritos: number
  total_referrals: number
  total_prizes_achieved: number
  prizes_pending_delivery: number
  total_links: number
  total_clicks: number
  facebook_clicks: number
  instagram_clicks: number
  whatsapp_clicks: number
  direct_clicks: number
  top_referrer_nome: string
  top_referrer_count: number
}

export interface RankingEntry {
  id: string
  nome: string
  email: string
  whatsapp: string
  convidadas_count: number
  meta_convidadas: number | null
  percentage: number
  prize_achieved: boolean
}

export interface AdminParticipantOverview extends Inscricao {
  referred_by_nome?: string | null
  total_links: number
  total_clicks: number
  facebook_clicks: number
  instagram_clicks: number
  whatsapp_clicks: number
  direct_clicks: number
  latest_link_id?: string | null
  latest_link_token?: string | null
  latest_link_label?: string | null
  latest_link_created_at?: string | null
  prize_level?: string | null
  prize_achieved: boolean
}

export interface ParticipantDetailSummary {
  total_links: number
  total_clicks: number
  facebook_clicks: number
  instagram_clicks: number
  whatsapp_clicks: number
  direct_clicks: number
}

export interface ParticipantDetail {
  participant: Inscricao & {
    referred_by_nome?: string | null
    total_links?: number
    total_clicks?: number
    facebook_clicks?: number
    instagram_clicks?: number
    whatsapp_clicks?: number
    direct_clicks?: number
  }
  links: ReferralLink[]
  notifications: Notification[]
  click_summary: ParticipantDetailSummary
}

export type PrizeName = 'camisa' | 'agenda' | 'pack_completo'

export const PRIZE_NAMES: Record<PrizeName, string> = {
  pack_completo: '1º lugar - Bíblia',
  agenda: '2º lugar - Agenda',
  camisa: '3º lugar - T-shirt',
}
