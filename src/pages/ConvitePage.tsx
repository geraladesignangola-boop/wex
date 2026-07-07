import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { UserPlus, Flame, Loader2 } from 'lucide-react'
import InscricaoForm from '../components/InscricaoForm'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { ReferrerInfo } from '../types/database'

export default function ConvitePage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        if (error) throw error
        const foundReferrer = data?.[0] ?? null
        if (!foundReferrer) {
          throw new Error('not_found')
        }
        setReferrer(foundReferrer)
      } catch (err) {
        setError('Código de convite inválido ou expirado')
      } finally {
        setLoading(false)
      }
    }

    fetchReferrer()
  }, [refCode])

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
      {/* Banner do convidador */}
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
        
        {referrer && referrer.meta_convidadas !== null && (
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-500">
            <span>Meta dela: {referrer.meta_convidadas} amigas</span>
            <span>•</span>
            <span>Já trouxe: {referrer.convidadas_count}</span>
          </div>
        )}

        {/* Progresso do convidador */}
        {referrer && referrer.meta_convidadas !== null && (
          <div className="mt-6 p-4 bg-stone-900/50 rounded-2xl border border-stone-800/50 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-stone-500">Progresso</span>
              <span className="text-amber-400 font-bold">
                {referrer.convidadas_count}/{referrer.meta_convidadas}
              </span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((referrer.convidadas_count / referrer.meta_convidadas) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Formulário de inscrição */}
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
