-- Replace threshold-based prize logic with a final podium apuration.

CREATE OR REPLACE FUNCTION public.check_prize_achievement(user_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- The new business rule is resolved only at the end of the campaign.
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_podium_prizes()
RETURNS TABLE (
  participant_id uuid,
  podium_position integer,
  prize_level text,
  prize_name text,
  nome text,
  convidadas_count integer
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  winner record;
  v_prize_level text;
  v_prize_name text;
  v_message text;
  v_whatsapp_digits text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  DELETE FROM public.prize_claims;
  DELETE FROM public.notifications
  WHERE type = 'prize_achieved';

  FOR winner IN
    SELECT
      i.id,
      i.nome,
      i.whatsapp,
      i.email,
      i.convidadas_count,
      ROW_NUMBER() OVER (
        ORDER BY i.convidadas_count DESC, i.created_at ASC, i.nome ASC
      ) AS podium_position
    FROM public.inscricoes i
    WHERE i.convidadas_count > 0
    ORDER BY i.convidadas_count DESC, i.created_at ASC, i.nome ASC
    LIMIT 3
  LOOP
    IF winner.podium_position = 1 THEN
      v_prize_level := 'pack_completo';
      v_prize_name := 'Bíblia';
    ELSIF winner.podium_position = 2 THEN
      v_prize_level := 'agenda';
      v_prize_name := 'Agenda';
    ELSE
      v_prize_level := 'camisa';
      v_prize_name := 'T-shirt';
    END IF;

    INSERT INTO public.prize_claims (participant_id, prize_level, status)
    VALUES (winner.id, v_prize_level, 'pending');

    v_message := format(
      E'Parabéns %s!\n\nFicaste em %s.º lugar no ranking final da Imersão WEX.\n\nPrémio: %s\n\nMediateca de Luanda\n8 de Agosto de 2026\n\nApresenta esta mensagem no dia do evento para levantar o teu prémio.\n\nMulheres de Fogo',
      winner.nome,
      winner.podium_position,
      v_prize_name
    );

    v_whatsapp_digits := regexp_replace(coalesce(winner.whatsapp, ''), '\D', '', 'g');

    INSERT INTO public.notifications (
      participant_id,
      type,
      message,
      whatsapp_link,
      email_link
    )
    VALUES (
      winner.id,
      'prize_achieved',
      v_message,
      CASE
        WHEN v_whatsapp_digits <> ''
          THEN 'https://wa.me/' || v_whatsapp_digits || '?text=' || replace(replace(replace(v_message, E'\r\n', '%0D%0A'), E'\n', '%0A'), ' ', '%20')
        ELSE NULL
      END,
      'mailto:' || winner.email || '?subject=Resultado%20do%20pódio%20WEX'
    );

    RETURN QUERY
    SELECT winner.id, winner.podium_position, v_prize_level, v_prize_name, winner.nome, winner.convidadas_count;
  END LOOP;
END;
$$;

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
  ORDER BY inscricoes.convidadas_count DESC, inscricoes.created_at ASC, inscricoes.nome ASC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_inscritos bigint,
  total_referrals bigint,
  total_prizes_achieved bigint,
  prizes_pending_delivery bigint,
  top_referrer_nome text,
  top_referrer_count integer
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
    (SELECT COUNT(*) FROM public.inscricoes)::bigint,
    (SELECT COUNT(*) FROM public.referrals)::bigint,
    (SELECT COUNT(*) FROM public.prize_claims WHERE status != 'delivered')::bigint,
    (SELECT COUNT(*) FROM public.prize_claims WHERE status = 'pending')::bigint,
    (SELECT nome FROM public.inscricoes ORDER BY convidadas_count DESC, created_at ASC, nome ASC LIMIT 1),
    (SELECT convidadas_count FROM public.inscricoes ORDER BY convidadas_count DESC, created_at ASC, nome ASC LIMIT 1);
END;
$$;
