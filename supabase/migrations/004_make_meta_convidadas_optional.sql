-- Allow meta_convidadas to be NULL (opt-in system)
-- Users should actively choose to participate in the referral/invitation system

-- 1. Alter the table column to allow NULL and remove the DEFAULT 3
ALTER TABLE inscricoes
  ALTER COLUMN meta_convidadas DROP NOT NULL,
  ALTER COLUMN meta_convidadas DROP DEFAULT;

-- 2. Update the create_public_inscricao function to accept NULL p_meta_convidadas
CREATE OR REPLACE FUNCTION public.create_public_inscricao(
  p_nome text,
  p_email text,
  p_telefone text,
  p_whatsapp text,
  p_morada text,
  p_igreja text,
  p_faixa_etaria text,
  p_como_soube text,
  p_expectativa text,
  p_referral_code text,
  p_meta_convidadas integer default null,
  p_referred_by_code text default null
)
returns table (
  id uuid,
  referral_code text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  resolved_referred_by uuid;
  inserted_id uuid;
  inserted_referral_code text;
begin
  if coalesce(btrim(p_nome), '') = '' then
    raise exception 'nome_required';
  end if;

  if coalesce(btrim(p_email), '') = '' or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'email_invalid';
  end if;

  if coalesce(btrim(p_telefone), '') = '' then
    raise exception 'telefone_required';
  end if;

  if coalesce(btrim(p_whatsapp), '') = '' then
    raise exception 'whatsapp_required';
  end if;

  if coalesce(btrim(p_morada), '') = '' then
    raise exception 'morada_required';
  end if;

  if p_faixa_etaria not in ('18-25', '26-35', '36-45', '46+') then
    raise exception 'faixa_etaria_invalid';
  end if;

  if p_como_soube not in ('Instagram', 'Facebook', 'Indicação de amiga', 'Igreja', 'Outro') then
    raise exception 'como_soube_invalid';
  end if;

  -- Allow NULL or valid values for meta_convidadas (opt-in)
  if p_meta_convidadas is not null and p_meta_convidadas not in (3, 6, 10, 15) then
    raise exception 'meta_convidadas_invalid';
  end if;

  if p_referred_by_code is not null and btrim(p_referred_by_code) <> '' then
    select inscricoes.id
    into resolved_referred_by
    from public.inscricoes inscricoes
    where inscricoes.referral_code = p_referred_by_code
    limit 1;
  end if;

  insert into public.inscricoes (
    nome,
    email,
    telefone,
    whatsapp,
    morada,
    igreja,
    faixa_etaria,
    como_soube,
    expectativa,
    referral_code,
    meta_convidadas,
    convidadas_count,
    referred_by
  ) values (
    btrim(p_nome),
    lower(btrim(p_email)),
    btrim(p_telefone),
    btrim(p_whatsapp),
    btrim(p_morada),
    nullif(btrim(p_igreja), ''),
    p_faixa_etaria,
    p_como_soube,
    nullif(btrim(p_expectativa), ''),
    btrim(p_referral_code),
    p_meta_convidadas,
    0,
    resolved_referred_by
  )
  returning inscricoes.id, inscricoes.referral_code
  into inserted_id, inserted_referral_code;

  return query
  select inserted_id, inserted_referral_code;
exception
  when unique_violation then
    raise exception 'duplicate_registration';
end;
$$;

-- Update get_referral_ranking to handle NULL meta_convidadas
CREATE OR REPLACE FUNCTION public.get_referral_ranking()
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  whatsapp text,
  convidadas_count integer,
  meta_convidadas integer,
  percentage numeric,
  prize_achieved boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    inscricoes.id,
    inscricoes.nome,
    inscricoes.email,
    inscricoes.whatsapp,
    inscricoes.convidadas_count,
    inscricoes.meta_convidadas,
    CASE
      WHEN inscricoes.meta_convidadas IS NOT NULL AND inscricoes.meta_convidadas > 0
        THEN ROUND((inscricoes.convidadas_count::NUMERIC / inscricoes.meta_convidadas) * 100, 1)
      ELSE 0
    END AS percentage,
    EXISTS (
      SELECT 1
      FROM public.prize_claims prize_claims
      WHERE prize_claims.participant_id = inscricoes.id
        AND prize_claims.status != 'delivered'
    ) AS prize_achieved
  FROM public.inscricoes inscricoes
  WHERE inscricoes.convidadas_count > 0
  ORDER BY inscricoes.convidadas_count DESC
  LIMIT 50;
END;
$$;

-- Update check_prize_achievement to handle NULL meta_convidadas
CREATE OR REPLACE FUNCTION public.check_prize_achievement(user_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convidadas integer;
  v_meta integer;
  v_nome text;
  v_whatsapp text;
  v_email text;
  v_prize_level text;
  v_prize_name text;
  v_message text;
  v_whatsapp_digits text;
BEGIN
  SELECT convidadas_count, meta_convidadas, nome, whatsapp, email
  INTO v_convidadas, v_meta, v_nome, v_whatsapp, v_email
  FROM public.inscricoes
  WHERE id = user_id;

  IF v_convidadas IS NULL OR v_meta IS NULL THEN
    RETURN;
  END IF;

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

    INSERT INTO public.prize_claims (participant_id, prize_level, status)
    VALUES (user_id, v_prize_level, 'pending')
    ON CONFLICT (participant_id) DO NOTHING;

    v_message := format(
      E'Parabens %s!\n\nVoce convidou %s amigas para a Imersao WEX Mulheres de Fogo!\n\nSeu premio: %s\n\nMediateca de Luanda\n8 de Agosto de 2026\n\nApresente esta mensagem no local do evento para retirar seu premio.\n\nMulheres de Fogo',
      v_nome, v_convidadas, v_prize_name
    );

    v_whatsapp_digits := regexp_replace(v_whatsapp, '[^0-9]', '', 'g');

    INSERT INTO public.notifications (participant_id, message, type, sent)
    VALUES (user_id, v_message, 'prize', false);
  END IF;
END;
$$;

-- Update admin_dashboard view to handle NULL meta_convidadas
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT
  i.id, i.nome, i.email, i.whatsapp, i.morada, i.igreja,
  i.faixa_etaria, i.como_soube, i.referral_code,
  i.meta_convidadas, i.convidadas_count, i.created_at,
  CASE WHEN i.meta_convidadas IS NOT NULL AND i.convidadas_count >= i.meta_convidadas THEN true ELSE false END as meta_atingida,
  pc.prize_level, pc.status as prize_status
FROM inscricoes i
LEFT JOIN prize_claims pc ON pc.participant_id = i.id
ORDER BY i.convidadas_count DESC, i.created_at DESC;
