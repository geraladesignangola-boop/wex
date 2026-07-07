import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useReferral() {
  const getReferralCodeFromURL = (): string | null => {
    const params = new URLSearchParams(window.location.search)
    return params.get('ref')
  }

  const generateReferralCode = (nome: string): string => {
    const cleanName = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const randomSuffix = crypto.randomUUID().replace(/-/g, '').substring(0, 8)
    return `${cleanName.substring(0, 20)}-${randomSuffix}`
  }

  const getReferralLink = (code: string): string => {
    const baseUrl = import.meta.env.VITE_APP_URL && import.meta.env.VITE_APP_URL !== 'http://localhost:3000'
      ? import.meta.env.VITE_APP_URL
      : window.location.origin
    return `${baseUrl}/convite?ref=${code}`
  }

  const getWhatsAppShareText = (nome: string, code: string): string => {
    const link = getReferralLink(code)
    return `Hey! Vai à Imersão WEX Mulheres de Fogo! 🔥\n\n${nome} está convidando você!\n\nInscreve-te aqui: ${link}`
  }

  return {
    generateReferralCode,
    getReferralLink,
    getWhatsAppShareText,
  }
}

export function useReferralStats(referralCode: string) {
  const [stats, setStats] = useState<{
    convidadas_count: number
    meta_convidadas: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await supabase.rpc('get_public_referrer_by_code', {
          ref_code: referralCode,
        })

        setStats(data?.[0] ?? null)
      } finally {
        setLoading(false)
      }
    }

    if (referralCode) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [referralCode])

  return { stats, loading }
}
