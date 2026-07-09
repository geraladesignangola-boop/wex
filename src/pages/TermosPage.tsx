import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Shield } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-stone-400 hover:text-amber-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à página principal
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold font-serif text-amber-100">
            Termos de Participação & Política de Privacidade
          </h1>
        </div>

        <div className="space-y-8 text-sm text-stone-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-amber-200 mb-3">1. Sobre o Evento</h2>
            <p>
              A Imersão WEX — Woman Experience é um evento espiritual e emocional feminino, 
              organizado pela Mulheres de Fogo, que ocorrerá no dia 8 de Agosto de 2026, 
              das 9h às 17h, na Mediateca de Luanda, Angola. A participação é gratuita.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-amber-200 mb-3">2. Inscrição</h2>
            <p className="mb-2">
              Ao inscrever-se no evento, o utilizador declara que:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Tem 18 anos ou mais;</li>
              <li>Forneceu informações verdadeiras e exatas;</li>
              <li>Deseja comparecer voluntariamente ao evento;</li>
              <li>Autoriza o contacto via WhatsApp e chamadas telefónicas para fins relacionados ao evento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-amber-200 mb-3">3. Dados Pessoais</h2>
            <p className="mb-2">
              Os dados pessoais recolhidos (nome, email, telefone, WhatsApp, morada) são utilizados exclusivamente para:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Gestão de inscrições e organização do evento;</li>
              <li>Contacto de suporte e informações sobre o evento;</li>
              <li>Envio de notificações relacionadas com o sistema de referrals e prémios.</li>
            </ul>
            <p className="mt-2">
              Os dados não são partilhados com terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-amber-200 mb-3">4. Sistema de Referrals</h2>
            <p>
              O sistema de referrals é voluntário. Ao partilhar o seu link exclusivo, 
              o utilizador autoriza que o seu nome seja exibido publicamente no ranking de convidadoras. 
              O pódio final é apurado pelo total de convidadas no encerramento da campanha e os prémios são entregues presencialmente no dia do evento, mediante apresentação da notificação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-amber-200 mb-3">5. Cancelamento</h2>
            <p>
              O utilizador pode solicitar a remoção dos seus dados pessoais contactando 
              o email geral@womanexperience.ao. A remoção será processada em até 7 dias úteis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-amber-200 mb-3">6. Contacto</h2>
            <p>
              Para questões sobre privacidade ou dados pessoais: 
              <a href="mailto:geral@womanexperience.ao" className="text-amber-400 hover:text-amber-300 ml-1">
                geral@womanexperience.ao
              </a>
            </p>
          </section>

          <p className="text-xs text-stone-600 pt-4 border-t border-stone-800">
            Última actualização: Julho 2026
          </p>
        </div>
      </motion.div>
    </div>
  )
}
