export interface Inscricao {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  morada: string;
  igreja?: string;
  faixa_etaria: '18-25' | '26-35' | '36-45' | '46+';
  como_soube: 'Instagram' | 'Facebook' | 'Indicação de amiga' | 'Igreja' | 'Outro';
  expectativa?: string;
  referral_code: string;
  meta_convidadas: 3 | 6 | 10 | 15;
  convidadas_count: number;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Oradora {
  id: string;
  nome: string;
  cargo: string;
  subtitulo?: string;
  fotoUrl?: string;
  isMain?: boolean;
}
