-- ============================================
-- MIGRAÇÃO INICIAL: SISTEMA DE CONVIDADAS WEX
-- Imersão Mulheres de Fogo 2026
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

CREATE TABLE IF NOT EXISTS inscricoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  morada TEXT NOT NULL,
  igreja TEXT,
  faixa_etaria TEXT NOT NULL CHECK (faixa_etaria IN ('18-25', '26-35', '36-45', '46+')),
  como_soube TEXT NOT NULL,
  expectativa TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  meta_convidadas INTEGER NOT NULL DEFAULT 3 CHECK (meta_convidadas IN (3, 6, 10, 15)),
  convidadas_count INTEGER NOT NULL DEFAULT 0,
  referred_by UUID REFERENCES inscricoes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE TABLE IF NOT EXISTS prize_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
  prize_level TEXT NOT NULL CHECK (prize_level IN ('camisa', 'agenda', 'agenda_camisa', 'pack_completo')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'delivered')),
  notified_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prize_achieved', 'reminder')),
  message TEXT NOT NULL,
  whatsapp_link TEXT,
  email_link TEXT,
  read BOOLEAN DEFAULT FALSE,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_inscricoes_referral_code ON inscricoes(referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscricoes_email ON inscricoes(email);
CREATE INDEX IF NOT EXISTS idx_inscricoes_referred_by ON inscricoes(referred_by);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_participant_id ON notifications(participant_id);

-- ============================================
-- 3. CRIAR FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_referral_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE inscricoes 
  SET convidadas_count = convidadas_count + 1, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_prize_achievement(user_id UUID)
RETURNS void AS $$
DECLARE
  v_convidadas INTEGER;
  v_meta INTEGER;
  v_nome TEXT;
  v_whatsapp TEXT;
  v_email TEXT;
  v_prize_level TEXT;
  v_prize_name TEXT;
  v_message TEXT;
BEGIN
  SELECT convidadas_count, meta_convidadas, nome, whatsapp, email
  INTO v_convidadas, v_meta, v_nome, v_whatsapp, v_email
  FROM inscricoes WHERE id = user_id;
  
  IF v_convidadas >= v_meta THEN
    IF v_meta >= 15 THEN
      v_prize_level := 'pack_completo';
      v_prize_name := 'Pack Completo (Agenda + Camisa + Bíblia)';
    ELSIF v_meta >= 10 THEN
      v_prize_level := 'agenda_camisa';
      v_prize_name := 'Agenda + Camisa';
    ELSIF v_meta >= 6 THEN
      v_prize_level := 'agenda';
      v_prize_name := 'Agenda Personalizada';
    ELSE
      v_prize_level := 'camisa';
      v_prize_name := 'Camisa Mulheres de Fogo';
    END IF;
    
    INSERT INTO prize_claims (participant_id, prize_level, status)
    VALUES (user_id, v_prize_level, 'pending')
    ON CONFLICT (participant_id) DO NOTHING;
    
    v_message := format(
      E'🎉 Parabéns %s!\n\nVocê convidou %s amigas para a Imersão WEX Mulheres de Fogo!\n\nSeu prêmio: %s\n\n📍 Mediateca de Luanda\n📅 8 de Agosto de 2026\n\nApresente esta mensagem no local do evento para retirar seu prêmio.\n\nMulheres de Fogo 🔥',
      v_nome, v_convidadas, v_prize_name
    );
    
    INSERT INTO notifications (participant_id, type, message, whatsapp_link, email_link)
    VALUES (
      user_id, 
      'prize_achieved', 
      v_message,
      'https://wa.me/' || REPLACE(REPLACE(v_whatsapp, ' ', ''), '+', '') || '?text=' || encode(v_message::bytea, 'url'),
      'mailto:' || v_email || '?subject=Parabéns! Você ganhou um prêmio WEX'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_new_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL AND NEW.referred_by != NEW.id THEN
    INSERT INTO referrals (referrer_id, referred_id)
    VALUES (NEW.referred_by, NEW.id)
    ON CONFLICT (referred_id) DO NOTHING;
    
    UPDATE inscricoes 
    SET convidadas_count = convidadas_count + 1
    WHERE id = NEW.referred_by;
    
    PERFORM check_prize_achievement(NEW.referred_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_notification_sent(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications SET sent = true, notified_at = NOW() WHERE id = notification_id;
  UPDATE prize_claims SET status = 'notified', notified_at = NOW()
  WHERE participant_id = (SELECT participant_id FROM notifications WHERE id = notification_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_referral_ranking()
RETURNS TABLE (
  id UUID, nome TEXT, email TEXT, whatsapp TEXT,
  convidadas_count INTEGER, meta_convidadas INTEGER,
  percentage NUMERIC, prize_achieved BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.nome, i.email, i.whatsapp,
    i.convidadas_count, i.meta_convidadas,
    CASE WHEN i.meta_convidadas > 0 
      THEN ROUND((i.convidadas_count::NUMERIC / i.meta_convidadas) * 100, 1)
      ELSE 0 END as percentage,
    EXISTS (SELECT 1 FROM prize_claims pc WHERE pc.participant_id = i.id AND pc.status != 'delivered') as prize_achieved
  FROM inscricoes i
  WHERE i.convidadas_count > 0
  ORDER BY i.convidadas_count DESC LIMIT 50;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_inscritos BIGINT, total_referrals BIGINT,
  total_prizes_achieved BIGINT, prizes_pending_delivery BIGINT,
  top_referrer_nome TEXT, top_referrer_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM inscricoes)::BIGINT,
    (SELECT COUNT(*) FROM referrals)::BIGINT,
    (SELECT COUNT(*) FROM prize_claims WHERE status != 'delivered')::BIGINT,
    (SELECT COUNT(*) FROM prize_claims WHERE status = 'pending')::BIGINT,
    (SELECT nome FROM inscricoes ORDER BY convidadas_count DESC LIMIT 1),
    (SELECT convidadas_count FROM inscricoes ORDER BY convidadas_count DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CRIAR TRIGGERS
-- ============================================

CREATE TRIGGER trigger_update_inscricoes_updated_at
  BEFORE UPDATE ON inscricoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_process_new_referral
  AFTER INSERT ON inscricoes FOR EACH ROW EXECUTE FUNCTION process_new_referral();

-- ============================================
-- 5. HABILITAR RLS
-- ============================================

ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CRIAR POLÍTICAS RLS
-- ============================================

CREATE POLICY "Permitir inscricao publica" ON inscricoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura publica" ON inscricoes FOR SELECT USING (true);
CREATE POLICY "Permitir atualizacao" ON inscricoes FOR UPDATE USING (true);

CREATE POLICY "Permitir criar referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir leitura referrals" ON referrals FOR SELECT USING (true);

CREATE POLICY "Admin pode ver premios" ON prize_claims FOR SELECT USING (true);
CREATE POLICY "Sistema pode criar premios" ON prize_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin pode atualizar premios" ON prize_claims FOR UPDATE USING (true);

CREATE POLICY "Admin pode ver proprio perfil" ON admins FOR SELECT USING (true);

CREATE POLICY "Admin pode ver notificacoes" ON notifications FOR SELECT USING (true);
CREATE POLICY "Sistema pode criar notificacoes" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin pode atualizar notificacoes" ON notifications FOR UPDATE USING (true);

-- ============================================
-- 7. CRIAR VIEW PARA ADMIN
-- ============================================

CREATE OR REPLACE VIEW admin_dashboard AS
SELECT 
  i.id, i.nome, i.email, i.whatsapp, i.morada, i.igreja,
  i.faixa_etaria, i.como_soube, i.referral_code,
  i.meta_convidadas, i.convidadas_count, i.created_at,
  CASE WHEN i.convidadas_count >= i.meta_convidadas THEN true ELSE false END as meta_atingida,
  pc.prize_level, pc.status as prize_status
FROM inscricoes i
LEFT JOIN prize_claims pc ON pc.participant_id = i.id
ORDER BY i.convidadas_count DESC, i.created_at DESC;
