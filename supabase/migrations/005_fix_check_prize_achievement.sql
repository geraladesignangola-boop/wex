-- Fix check_prize_achievement broken by migration 004
-- Migration 004 changed type to 'prize' which violates the CHECK constraint ('prize_achieved' or 'reminder')
-- It also dropped whatsapp_link and email_link columns from the notification insert

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
      E'🎉 Parabéns %s!\n\nVocê convidou %s amigas para a Imersão WEX Mulheres de Fogo!\n\nSeu prêmio: %s\n\n📍 Mediateca de Luanda\n📅 8 de Agosto de 2026\n\nApresente esta mensagem no local do evento para retirar seu prêmio.\n\nMulheres de Fogo 🔥',
      v_nome, v_convidadas, v_prize_name
    );

    v_whatsapp_digits := regexp_replace(coalesce(v_whatsapp, ''), '\D', '', 'g');

    INSERT INTO public.notifications (
      participant_id,
      type,
      message,
      whatsapp_link,
      email_link
    )
    VALUES (
      user_id,
      'prize_achieved',
      v_message,
      CASE
        WHEN v_whatsapp_digits <> ''
          THEN 'https://wa.me/' || v_whatsapp_digits || '?text=' || replace(replace(replace(v_message, ' ', '%20'), E'\r\n', '%0D%0A'), E'\n', '%0A')
        ELSE NULL
      END,
      'mailto:' || v_email || '?subject=Parabens%20voce%20ganhou%20um%20premio%20WEX'
    );
  END IF;
END;
$$;
