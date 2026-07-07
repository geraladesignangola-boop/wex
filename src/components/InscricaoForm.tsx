import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, Users, Download, Trash2, ShieldCheck, Gift, Copy, MessageCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useReferral } from '../hooks/useReferral';
import { META_OPTIONS } from '../types/database';

interface InscricaoFormProps {
  referredByCode?: string;
}

export default function InscricaoForm({ referredByCode }: InscricaoFormProps = {}) {
  const { generateReferralCode, getReferralLink, getWhatsAppShareText } = useReferral();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [morada, setMorada] = useState('');
  const [igreja, setIgreja] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState<'18-25' | '26-35' | '36-45' | '46+'>('26-35');
  const [comoSoube, setComoSoube] = useState<'Instagram' | 'Facebook' | 'Indicação de amiga' | 'Igreja' | 'Outro'>('Instagram');
  const [expectativa, setExpectativa] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [metaConvidadas, setMetaConvidadas] = useState<3 | 6 | 10 | 15>(3);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (referredByCode) {
      setComoSoube('Indicação de amiga');
    }
  }, [referredByCode]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nome.trim()) newErrors.nome = 'O nome completo é obrigatório';
    if (!email.trim()) newErrors.email = 'O email é obrigatório';
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (email.includes('..')) newErrors.email = 'Email inválido';
    if (!telefone.trim()) newErrors.telefone = 'O número de telefone é obrigatório';
    if (!whatsapp.trim()) newErrors.whatsapp = 'O número do WhatsApp é obrigatório';
    if (!morada.trim()) newErrors.morada = 'A morada / bairro é obrigatória';
    if (!aceitouTermos) newErrors.aceitouTermos = 'Deves aceitar os termos de participação';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = Date.now();
    if (now - lastSubmitTime < 10000) {
      setErrors({ submit: 'Aguarde 10 segundos antes de tentar novamente.' });
      return;
    }
    setLastSubmitTime(now);
    setIsSubmitting(true);

    try {
      const newReferralCode = generateReferralCode(nome);
      const { data, error } = await supabase.rpc('create_public_inscricao', {
        p_nome: nome,
        p_email: email,
        p_telefone: telefone,
        p_whatsapp: whatsapp,
        p_morada: morada,
        p_igreja: igreja || null,
        p_faixa_etaria: faixaEtaria,
        p_como_soube: comoSoube,
        p_expectativa: expectativa || null,
        p_referral_code: newReferralCode,
        p_meta_convidadas: metaConvidadas,
        p_referred_by_code: referredByCode || null,
      });

      if (error) {
        if (error.message.includes('duplicate_registration')) {
          setErrors({ email: 'Este email já está registado' });
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      const createdRow = Array.isArray(data) ? data[0] : data;
      setReferralCode(createdRow?.referral_code || newReferralCode);
      setIsSubmitting(false);
      setIsSuccess(true);
      
      const element = document.getElementById('form-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error: any) {
      console.error('Erro ao inscrever:', error);
      setErrors({ submit: 'Erro ao processar inscrição. Tenta novamente.' });
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = getReferralLink(referralCode);
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrors({ submit: 'Não foi possível copiar o link agora.' });
    }
  };

  const handleResetForm = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setWhatsapp('');
    setMorada('');
    setIgreja('');
    setFaixaEtaria('26-35');
    setComoSoube('Instagram');
    setExpectativa('');
    setAceitouTermos(false);
    setMetaConvidadas(3);
    setIsSuccess(false);
    setReferralCode('');
    setErrors({});
  };

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
            O despertar está pronto para começar. Inscreve-te agora de forma gratuita. Vagas estritamente limitadas para a capacidade da Mediateca.
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
                
                <div className="space-y-1.5">
                  <label htmlFor="nome-completo" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nome-completo"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Escreve o teu nome completo"
                    className={`w-full bg-stone-950/90 border ${errors.nome ? 'border-red-500' : 'border-stone-800 focus:border-amber-500'} text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600 shadow-inner`}
                  />
                  {errors.nome && <p className="text-xs text-red-400">{errors.nome}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email-contacto" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email-contacto"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teu@email.com"
                    className={`w-full bg-stone-950/90 border ${errors.email ? 'border-red-500' : 'border-stone-800 focus:border-amber-500'} text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600`}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5">
                    <label htmlFor="telefone-contacto" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                      Telemóvel / Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="telefone-contacto"
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Ex: 923 000 000"
                      className={`w-full bg-stone-950/90 border ${errors.telefone ? 'border-red-500' : 'border-stone-800 focus:border-amber-500'} text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600`}
                    />
                    {errors.telefone && <p className="text-xs text-red-400">{errors.telefone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="whatsapp-contacto" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                      WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="whatsapp-contacto"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: 923 000 000"
                      className={`w-full bg-stone-950/90 border ${errors.whatsapp ? 'border-red-500' : 'border-stone-800 focus:border-amber-500'} text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600`}
                    />
                    {errors.whatsapp && <p className="text-xs text-red-400">{errors.whatsapp}</p>}
                  </div>

                </div>

                <div className="space-y-1.5">
                  <label htmlFor="morada-bairro" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                    Morada / Bairro <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="morada-bairro"
                    type="text"
                    value={morada}
                    onChange={(e) => setMorada(e.target.value)}
                    placeholder="Onde resides? (Ex: Maianga, Talatona, Cacuaco...)"
                    className={`w-full bg-stone-950/90 border ${errors.morada ? 'border-red-500' : 'border-stone-800 focus:border-amber-500'} text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600`}
                  />
                  {errors.morada && <p className="text-xs text-red-400">{errors.morada}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="igreja-denominacao" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                    Igreja / Denominação <span className="text-stone-500 text-[10px]">(Opcional)</span>
                  </label>
                  <input
                    id="igreja-denominacao"
                    type="text"
                    value={igreja}
                    onChange={(e) => setIgreja(e.target.value)}
                    placeholder="Se frequentas alguma igreja, qual?"
                    className="w-full bg-stone-950/90 border border-stone-800 focus:border-amber-500 text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="space-y-1.5">
                    <label htmlFor="faixa-etaria" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                      Faixa Etária
                    </label>
                    <select
                      id="faixa-etaria"
                      value={faixaEtaria}
                      onChange={(e) => setFaixaEtaria(e.target.value as any)}
                      className="w-full bg-stone-950/90 border border-stone-800 focus:border-amber-500 text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300"
                    >
                      <option value="18-25">18-25 anos</option>
                      <option value="26-35">26-35 anos</option>
                      <option value="36-45">36-45 anos</option>
                      <option value="46+">46+ anos</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="como-soube" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                      Como soube do evento?
                    </label>
                    <select
                      id="como-soube"
                      value={comoSoube}
                      onChange={(e) => setComoSoube(e.target.value as any)}
                      className="w-full bg-stone-950/90 border border-stone-800 focus:border-amber-500 text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Indicação de amiga">Indicação de amiga</option>
                      <option value="Igreja">Igreja</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                </div>

                <div className="space-y-1.5">
                  <label htmlFor="expectativa-texto" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                    O que esperas viver nesta imersão? <span className="text-stone-500 text-[10px]">(Opcional)</span>
                  </label>
                  <textarea
                    id="expectativa-texto"
                    value={expectativa}
                    onChange={(e) => setExpectativa(e.target.value)}
                    placeholder="Partilha o teu coração ou o que procuras curar/viver neste dia espiritual..."
                    rows={3}
                    className="w-full bg-stone-950/90 border border-stone-800 focus:border-amber-500 text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-300 placeholder-stone-600 resize-none"
                  />
                </div>

                {/* SEÇÃO: CONVIDAR AMIGAS */}
                <div className="space-y-3 p-4 bg-stone-950/50 rounded-2xl border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Queres ganhar brindes? Convida amigas!
                    </label>
                  </div>
                  
                  <p className="text-[11px] text-stone-400">
                    Selecione quantas amigas vais convidar. Receberás um link exclusivo para partilhar!
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {META_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMetaConvidadas(option.value)}
                        className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                          metaConvidadas === option.value
                            ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(234,88,12,0.2)]'
                            : 'border-stone-800 bg-stone-950/50 hover:border-stone-700'
                        }`}
                      >
                        <span className={`block text-lg font-bold ${
                          metaConvidadas === option.value ? 'text-amber-400' : 'text-stone-300'
                        }`}>
                          {option.label}
                        </span>
                        <span className="block text-[9px] text-stone-500 uppercase mt-1">
                          {option.prize}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-stone-900/50 rounded-xl border border-stone-800/50">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                      🎁 Níveis de Prêmios
                    </p>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between text-stone-400">
                        <span>3 amigas</span>
                        <span className="text-amber-300">Camisa Mulheres de Fogo</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>6 amigas</span>
                        <span className="text-amber-300">Agenda Personalizada</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>10 amigas</span>
                        <span className="text-amber-300">Agenda + Camisa</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>15 amigas</span>
                        <span className="text-amber-300 font-bold">Agenda + Camisa + Bíblia ★</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-500 italic">
                    * Não te preocupes se não atingires a meta. O importante é o coração de convidar!
                  </p>
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

                {errors.submit && (
                  <p className="text-xs text-red-400 text-center">{errors.submit}</p>
                )}

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

              {/* Link exclusivo */}
              <div className="mt-8 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  🔗 Teu Link Exclusivo de Convidada
                </p>
                <div className="flex items-center gap-2 bg-stone-900 p-3 rounded-xl border border-stone-800">
                  <input
                    readOnly
                    value={getReferralLink(referralCode)}
                    className="flex-1 bg-transparent text-amber-200 text-xs font-mono focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-stone-950 rounded-lg transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              <div className="mt-6 flex justify-center">
                <div className="p-4 bg-white rounded-2xl">
                  <QRCodeSVG
                    value={getReferralLink(referralCode)}
                    size={140}
                    level="M"
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-stone-950 rounded-2xl border border-stone-800">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  📋 Partilha este texto:
                </p>
                <p className="text-xs text-stone-400 bg-stone-900 p-3 rounded-xl text-left">
                  {getWhatsAppShareText(nome, referralCode)}
                </p>
              </div>

              <div className="mt-8 flex flex-col md:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppShareText(nome, referralCode))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:brightness-110 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Compartilhar no WhatsApp</span>
                </a>
                
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
  );
}
