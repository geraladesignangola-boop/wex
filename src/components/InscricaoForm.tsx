import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Check,
  Flame,
  Users,
  ShieldCheck,
  Gift,
  Copy,
  MessageCircle,
  Loader2,
  Facebook,
  Instagram,
  Link2,
  Lock,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useReferral } from '../hooks/useReferral'

interface InscricaoFormProps {
  referredByCode?: string
}

type ComoSoubeOption = 'Instagram' | 'Facebook' | 'Indicação de amiga' | 'Igreja' | 'Outro'

export default function InscricaoForm({ referredByCode }: InscricaoFormProps = {}) {
  const { generateReferralCode, getReferralLink, getWhatsAppShareText } = useReferral()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [morada, setMorada] = useState('')
  const [igreja, setIgreja] = useState('')
  const [localizacao, setLocalizacao] = useState('')
  const [recomendacao, setRecomendacao] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [faixaEtaria, setFaixaEtaria] = useState<'18-25' | '26-35' | '36-45' | '46+'>('26-35')
  const [comoSoube, setComoSoube] = useState<ComoSoubeOption>('Instagram')
  const [expectativa, setExpectativa] = useState('')
  const [aceitouTermos, setAceitouTermos] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  const [referralCode, setReferralCode] = useState('')
  const [copiedSource, setCopiedSource] = useState<string | null>(null)
  const [inscricoesAbertas, setInscricoesAbertas] = useState<boolean | null>(null)

  useEffect(() => {
    if (referredByCode) {
      setComoSoube('Indicação de amiga')
    }
  }, [referredByCode])

  useEffect(() => {
    const fetchInscricoesStatus = async () => {
      if (!isSupabaseConfigured) {
        setInscricoesAbertas(true)
        return
      }
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'inscricoes_abertas')
          .single()
        setInscricoesAbertas(data?.value !== 'false')
      } catch {
        setInscricoesAbertas(true)
      }
    }
    fetchInscricoesStatus()
  }, [])

  const directLink = useMemo(() => getReferralLink(referralCode), [getReferralLink, referralCode])
  const whatsappLink = useMemo(() => getReferralLink(referralCode, 'whatsapp'), [getReferralLink, referralCode])
  const facebookLink = useMemo(() => getReferralLink(referralCode, 'facebook'), [getReferralLink, referralCode])
  const instagramLink = useMemo(() => getReferralLink(referralCode, 'instagram'), [getReferralLink, referralCode])

  if (!isSupabaseConfigured) {
    return (
      <section id="form-section" className="py-24 px-4 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
        <div className="max-w-xl mx-auto text-center">
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-8">
            <p className="text-amber-300 font-bold">Configuração em falta</p>
            <p className="text-stone-400 text-sm mt-2">
              As variáveis de ambiente do Supabase não estão configuradas no Vercel.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (inscricoesAbertas === false) {
    return (
      <section id="form-section" className="py-24 px-4 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-950/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
        <div className="max-w-xl mx-auto relative z-10 text-center">
          <div className="inline-flex p-4 bg-stone-900 border border-stone-800 rounded-full mb-6">
            <Lock className="w-8 h-8 text-stone-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-serif tracking-tight text-stone-300">
            Inscrições Encerradas
          </h2>
          <p className="mt-4 text-stone-400 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            As inscrições para a Imersão WEX Mulheres de Fogo estão encerradas.
            Acompanha as novidades nas nossas redes sociais.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <a
              href="https://www.instagram.com/muf.mulheresdefogo/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61583199112349"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-[#1877F2] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </section>
    )
  }

  if (inscricoesAbertas === null) {
    return (
      <section id="form-section" className="py-24 px-4 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950">
        <div className="max-w-xl mx-auto text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
        </div>
      </section>
    )
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!nome.trim()) nextErrors.nome = 'O nome completo é obrigatório'
    if (!email.trim()) nextErrors.email = 'O email é obrigatório'
    if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = 'Email inválido'
    if (email.includes('..')) nextErrors.email = 'Email inválido'
    if (!telefone.trim()) nextErrors.telefone = 'O número de telefone é obrigatório'
    if (!whatsapp.trim()) nextErrors.whatsapp = 'O número do WhatsApp é obrigatório'
    if (!morada.trim()) nextErrors.morada = 'A morada / bairro é obrigatória'
    if (!aceitouTermos) nextErrors.aceitouTermos = 'Deves aceitar os termos de participação'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const now = Date.now()
    if (now - lastSubmitTime < 10000) {
      setErrors({ submit: 'Aguarde 10 segundos antes de tentar novamente.' })
      return
    }

    setLastSubmitTime(now)
    setIsSubmitting(true)

    try {
      const newReferralCode = generateReferralCode(nome)
      const { data, error } = await supabase.rpc('create_public_inscricao', {
        p_nome: nome,
        p_email: email,
        p_telefone: telefone,
        p_whatsapp: whatsapp,
        p_morada: morada,
        p_igreja: igreja || null,
        p_localizacao: localizacao || null,
        p_recomendacao: recomendacao || null,
        p_observacoes: observacoes || null,
        p_faixa_etaria: faixaEtaria,
        p_como_soube: comoSoube,
        p_expectativa: expectativa || null,
        p_referral_code: newReferralCode,
        p_meta_convidadas: null,
        p_referred_by_code: referredByCode || null,
      })

      if (error) {
        if (error.message.includes('duplicate_registration')) {
          setErrors({ email: 'Este email já está registado' })
          setIsSubmitting(false)
          return
        }
        if (error.message.includes('inscricoes_fechadas')) {
          setErrors({ submit: 'As inscrições estão encerradas.' })
          setIsSubmitting(false)
          setInscricoesAbertas(false)
          return
        }
        throw error
      }

      const createdRow = Array.isArray(data) ? data[0] : data
      setReferralCode(createdRow?.referral_code || newReferralCode)
      setIsSubmitting(false)
      setIsSuccess(true)

      const element = document.getElementById('form-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Erro ao inscrever:', error)
      setErrors({ submit: 'Erro ao processar inscrição. Tenta novamente.' })
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (value: string, source: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedSource(source)
      setTimeout(() => setCopiedSource((current) => (current === source ? null : current)), 2000)
    } catch {
      setErrors({ submit: 'Não foi possível copiar o link agora.' })
    }
  }

  const shareOnFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookLink)}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  const shareOnInstagram = async () => {
    const instagramText = `Inscreve-te na Imersão WEX Mulheres de Fogo 🔥\n${instagramLink}`
    await copyToClipboard(instagramText, 'instagram')
  }

  const handleResetForm = () => {
    setNome('')
    setEmail('')
    setTelefone('')
    setWhatsapp('')
    setMorada('')
    setIgreja('')
    setLocalizacao('')
    setRecomendacao('')
    setObservacoes('')
    setFaixaEtaria('26-35')
    setComoSoube('Instagram')
    setExpectativa('')
    setAceitouTermos(false)
    setIsSuccess(false)
    setReferralCode('')
    setErrors({})
    setCopiedSource(null)
  }

  return (
    <section
      id="form-section"
      className="py-24 px-4 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-950/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-serif tracking-tight text-amber-100">
            Garante a Tua Vaga
          </h2>
          <p className="mt-3 text-sm text-stone-400 max-w-md mx-auto">
            O despertar está pronto para começar. Inscreve-te agora de forma gratuita. Vagas limitadas para a capacidade da Mediateca.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-stone-900/80 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400" />

              {referredByCode && (
                <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                  <p className="text-xs text-amber-300">
                    <Users className="w-4 h-4 inline mr-1" />
                    Foste convidada por uma amiga! 🎉
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Field label="Nome Completo" required htmlFor="nome-completo" error={errors.nome}>
                  <input
                    id="nome-completo"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Escreve o teu nome completo"
                    className={inputClass(errors.nome)}
                  />
                </Field>

                <Field label="Email" required htmlFor="email-contacto" error={errors.email}>
                  <input
                    id="email-contacto"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teu@email.com"
                    className={inputClass(errors.email)}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Telemóvel / Contacto" required htmlFor="telefone-contacto" error={errors.telefone}>
                    <input
                      id="telefone-contacto"
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Ex: 923 000 000"
                      className={inputClass(errors.telefone)}
                    />
                  </Field>

                  <Field label="WhatsApp" required htmlFor="whatsapp-contacto" error={errors.whatsapp}>
                    <input
                      id="whatsapp-contacto"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: 923 000 000"
                      className={inputClass(errors.whatsapp)}
                    />
                  </Field>
                </div>

                <Field label="Morada / Bairro" required htmlFor="morada-bairro" error={errors.morada}>
                  <input
                    id="morada-bairro"
                    type="text"
                    value={morada}
                    onChange={(e) => setMorada(e.target.value)}
                    placeholder="Onde resides? (Ex: Maianga, Talatona, Cacuaco...)"
                    className={inputClass(errors.morada)}
                  />
                </Field>

                <Field label="Localização" htmlFor="localizacao" help="Opcional — ajuda o admin a organizar o contacto">
                  <input
                    id="localizacao"
                    type="text"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    placeholder="Província, município ou zona"
                    className={baseInputClass}
                  />
                </Field>

                <Field label="Igreja / Denominação" htmlFor="igreja-denominacao" help="Opcional">
                  <input
                    id="igreja-denominacao"
                    type="text"
                    value={igreja}
                    onChange={(e) => setIgreja(e.target.value)}
                    placeholder="Se frequentas alguma igreja, qual?"
                    className={baseInputClass}
                  />
                </Field>

                <Field label="Quem te recomendou?" htmlFor="recomendacao" help="Opcional">
                  <input
                    id="recomendacao"
                    type="text"
                    value={recomendacao}
                    onChange={(e) => setRecomendacao(e.target.value)}
                    placeholder="Nome de quem te recomendou ou como chegaste até nós"
                    className={baseInputClass}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Faixa Etária" htmlFor="faixa-etaria">
                    <select
                      id="faixa-etaria"
                      value={faixaEtaria}
                      onChange={(e) => setFaixaEtaria(e.target.value as typeof faixaEtaria)}
                      className={baseInputClass}
                    >
                      <option value="18-25">18-25 anos</option>
                      <option value="26-35">26-35 anos</option>
                      <option value="36-45">36-45 anos</option>
                      <option value="46+">46+ anos</option>
                    </select>
                  </Field>

                  <Field label="Como soube do evento?" htmlFor="como-soube">
                    <select
                      id="como-soube"
                      value={comoSoube}
                      onChange={(e) => setComoSoube(e.target.value as ComoSoubeOption)}
                      className={baseInputClass}
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Indicação de amiga">Indicação de amiga</option>
                      <option value="Igreja">Igreja</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </Field>
                </div>

                <Field label="Observações" htmlFor="observacoes" help="Opcional — qualquer detalhe útil para o admin">
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Ex: alergias, necessidade especial, observação logística..."
                    rows={3}
                    className={`${baseInputClass} resize-none`}
                  />
                </Field>

                <Field label="O que esperas viver nesta imersão?" htmlFor="expectativa-texto" help="Opcional">
                  <textarea
                    id="expectativa-texto"
                    value={expectativa}
                    onChange={(e) => setExpectativa(e.target.value)}
                    placeholder="Partilha o teu coração ou o que procuras viver neste dia espiritual..."
                    rows={3}
                    className={`${baseInputClass} resize-none`}
                  />
                </Field>

                <div className="space-y-3 p-4 bg-stone-950/50 rounded-2xl border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Pódio de Prémios
                    </label>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Não existe meta fixa. No final, as 3 mulheres que trouxerem mais convidadas levam os prémios do pódio.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <span className="block text-[10px] uppercase tracking-wider text-amber-300">1º lugar</span>
                      <span className="block text-sm font-bold text-amber-100">Bíblia</span>
                    </div>
                    <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/50">
                      <span className="block text-[10px] uppercase tracking-wider text-stone-500">2º lugar</span>
                      <span className="block text-sm font-bold text-stone-200">Agenda</span>
                    </div>
                    <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/50">
                      <span className="block text-[10px] uppercase tracking-wider text-stone-500">3º lugar</span>
                      <span className="block text-sm font-bold text-stone-200">T-shirt</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="termo-aceitar" className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      id="termo-aceitar"
                      type="checkbox"
                      checked={aceitouTermos}
                      onChange={(e) => setAceitouTermos(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`mt-0.5 w-5 h-5 rounded border ${errors.aceitouTermos ? 'border-red-500 bg-red-950/20' : aceitouTermos ? 'border-orange-500 bg-orange-950/50' : 'border-stone-800 bg-stone-950'} flex items-center justify-center transition-all duration-200`}>
                      {aceitouTermos && <Check className="w-3.5 h-3.5 text-orange-400 stroke-[3]" />}
                    </div>
                    <span className="text-xs text-stone-400 leading-snug">
                      Confirmo a minha intenção de comparecer e dou autorização para o contacto de suporte via WhatsApp e chamadas.
                    </span>
                  </label>
                  {errors.aceitouTermos && <p className="text-xs text-red-400 mt-1">{errors.aceitouTermos}</p>}
                </div>

                {errors.submit && <p className="text-xs text-red-400 text-center">{errors.submit}</p>}

                <button
                  id="btn-confirmar-inscricao"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white font-bold uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(220,38,38,0.4)] relative overflow-hidden group flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>A Processar...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Minha Inscrição</span>
                      <Flame className="w-4 h-4 text-white animate-pulse" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 pt-2 border-t border-stone-800/50">
                  <ShieldCheck className="w-4 h-4 text-amber-500/60" />
                  <span>Inscrição Segura • Canal Oficial WEX 2026</span>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-stone-900 border-2 border-amber-500/40 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

              <div className="inline-flex p-4 bg-orange-950/50 border border-orange-500/30 rounded-full mb-6">
                <Flame className="w-10 h-10 text-orange-500 animate-bounce" />
              </div>

              <h3 className="text-2xl md:text-3xl font-black font-serif text-amber-100">
                A tua vaga está reservada!
              </h3>

              <p className="mt-4 text-stone-300 text-sm md:text-base leading-relaxed max-w-sm mx-auto">
                Glória a Deus, mulher! Em breve entraremos em contacto via WhatsApp com mais detalhes sobre a Imersão WEX.
              </p>

              <div className="mt-8 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  🔗 Teu link exclusivo
                </p>
                <div className="flex items-center gap-2 bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <input
                    readOnly
                    value={directLink}
                    className="flex-1 bg-transparent text-amber-200 text-xs font-mono focus:outline-none truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(directLink, 'direct')}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 rounded-lg transition-all cursor-pointer"
                  >
                    {copiedSource === 'direct' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="p-4 bg-white rounded-2xl">
                  <QRCodeSVG value={directLink} size={140} level="M" />
                </div>
              </div>

              <div className="mt-8 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  📋 Partilha este texto:
                </p>
                <p className="text-xs text-stone-400 bg-stone-900 p-3 rounded-xl text-left whitespace-pre-wrap">
                  {getWhatsAppShareText(nome, referralCode, 'whatsapp')}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppShareText(nome, referralCode, 'whatsapp'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={shareOnFacebook}
                  className="px-5 py-3 rounded-xl bg-[#1877F2] text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={shareOnInstagram}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>

                <button
                  onClick={() => copyToClipboard(directLink, 'copy')}
                  className="px-5 py-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/30 text-stone-300 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {copiedSource === 'copy' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  <span>{copiedSource === 'copy' ? 'Copiado' : 'Copiar link'}</span>
                </button>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleResetForm}
                  className="px-6 py-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/30 text-stone-300 font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Inscrever Outra Mulher
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  required = false,
  help,
  error,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  help?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-wider text-amber-300">
        {label} {required && <span className="text-red-500">*</span>}
        {help && <span className="ml-2 text-stone-500 text-[10px] normal-case">{help}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const baseInputClass = 'w-full bg-stone-950/90 border border-stone-800 focus:border-amber-500 text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600'

function inputClass(error?: string) {
  return `${baseInputClass} ${error ? 'border-red-500 focus:border-red-500' : ''}`
}
