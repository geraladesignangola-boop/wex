import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserPlus, Flame, Loader2 } from 'lucide-react'
import InscricaoForm from '../components/InscricaoForm'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { ReferrerInfo } from '../types/database'

export default function ConvitePage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')
  const source = searchParams.get('src') || 'direct'
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoggedClick = useRef(false)

  useEffect(() => {
    const fetchReferrer = async () => {
      if (!refCode || !isSupabaseConfigured) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('get_public_referrer_by_code', {
          ref_code: refCode,
        })

        let foundReferrer = data?.[0] ?? null
        if (error || !foundReferrer) {
          const { data: fallbackData } = await supabase
            .from('inscricoes')
            .select('id, nome, meta_convidadas, convidadas_count, referral_code')
            .eq('referral_code', refCode)
            .maybeSingle()
          foundReferrer = fallbackData || null
        }

        if (!foundReferrer) {
          throw new Error('not_found')
        }

        setReferrer(foundReferrer)

        if (!hasLoggedClick.current) {
          hasLoggedClick.current = true
          try {
            await supabase.rpc('log_referral_link_click', {
              ref_code: refCode,
              p_source: source,
              p_user_agent: navigator.userAgent,
            })
          } catch (clickError) {
            console.warn('Não foi possível registar o clique do link.', clickError)
          }
        }
      } catch {
        setError('Código de convite inválido ou expirado')
      } finally {
        setLoading(false)
      }
    }

    fetchReferrer()
  }, [refCode, source])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Flame className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-amber-100 mb-2">
            Configuração em falta
          </h1>
          <p className="text-stone-400 text-sm mb-6">
            As variáveis de ambiente do Supabase não estão configuradas. Contacta o administrador.
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

  if (error || !refCode) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Flame className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-amber-100 mb-2">
            Link inválido
          </h1>
          <p className="text-stone-400 text-sm">
            {error || 'Este link de convite não é válido.'}
          </p>
          <a
            href="/"
            className="mt-6 inline-block px-6 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-sm"
          >
            Voltar à página principal
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mb-8 text-center"
      >
        <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-amber-500" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-amber-100 font-serif">
          {referrer?.nome} convidou-te!
        </h1>

        <p className="mt-3 text-stone-400 text-sm">
          Junta-te a ela na Imersão WEX Mulheres de Fogo
        </p>

        {referrer && (
          <div className="mt-4 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/70 border border-stone-800 text-xs text-stone-400">
              <span>Total de convidadas:</span>
              <span className="font-bold text-amber-400">{referrer.convidadas_count}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-[10px] text-stone-500">
              <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                Cliques: {referrer.total_clicks ?? 0}
              </span>
              <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                WhatsApp: {referrer.whatsapp_clicks ?? 0}
              </span>
              <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                Facebook: {referrer.facebook_clicks ?? 0}
              </span>
              <span className="px-3 py-1 rounded-full bg-stone-900 border border-stone-800">
                Instagram: {referrer.instagram_clicks ?? 0}
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-stone-500">
          O pódio final é definido pelo total de convidadas no encerramento da campanha.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <InscricaoForm referredByCode={refCode} />
      </motion.div>
    </div>
  )
}
