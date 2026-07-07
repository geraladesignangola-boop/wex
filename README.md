# Imersão WEX — Woman Experience

Landing page oficial da Imersão WEX, um evento de transformação espiritual e emocional feminina.

**Data:** 8 de Agosto • **Local:** Mediateca de Luanda • **Entrada:** Gratuita

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS 4
- **Animações:** Motion (Framer Motion)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel / Netlify

## Estrutura

```
src/
├── components/     # Secções da landing page
├── hooks/          # useReferral
├── lib/            # supabase client, auth
├── pages/          # AdminPanel, ConvitePage, TermosPage
└── types/          # database.ts (tipos centralizados)
supabase/
└── migrations/     # Schema, RLS, functions
```

## Desenvolvimento Local

**Pré-requisitos:** Node.js >= 20

```bash
npm install
```

Configura as variáveis de ambiente no `.env`:
```
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-aqui"
VITE_APP_URL="http://localhost:3000"
```

```bash
npm run dev      # http://localhost:3000
npm run build    # build de produção para dist/
npm run lint     # verificação TypeScript
```

## Funcionalidades

- Formulário de inscrição com validação server-side (Supabase RPC)
- Sistema de referrals com links exclusivos e QR codes
- Prémios por metas de convidadas (3, 6, 10, 15)
- Painel administrativo com dashboard, ranking e notificações
- Notificações automáticas via WhatsApp e Email ao atingir metas
