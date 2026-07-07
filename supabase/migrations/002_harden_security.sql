-- Harden public and admin access for WEX

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admins admins_row
    where admins_row.id = auth.uid()
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

create or replace function public.get_public_referrer_by_code(ref_code text)
returns table (
  id uuid,
  nome text,
  meta_convidadas integer,
  convidadas_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    inscricoes.id,
    inscricoes.nome,
    inscricoes.meta_convidadas,
    inscricoes.convidadas_count
  from public.inscricoes inscricoes
  where inscricoes.referral_code = ref_code
  limit 1;
$$;

revoke all on function public.get_public_referrer_by_code(text) from public;
grant execute on function public.get_public_referrer_by_code(text) to anon, authenticated;

create or replace function public.create_public_inscricao(
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
  p_meta_convidadas integer,
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

  if p_meta_convidadas not in (3, 6, 10, 15) then
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

revoke all on function public.create_public_inscricao(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text
) from public;
grant execute on function public.create_public_inscricao(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text
) to anon, authenticated;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.increment_referral_count(user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update public.inscricoes
  set convidadas_count = convidadas_count + 1,
      updated_at = now()
  where id = user_id;
end;
$$;

create or replace function public.check_prize_achievement(user_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_convidadas integer;
  v_meta integer;
  v_nome text;
  v_whatsapp text;
  v_email text;
  v_prize_level text;
  v_prize_name text;
  v_message text;
  v_whatsapp_digits text;
begin
  select convidadas_count, meta_convidadas, nome, whatsapp, email
  into v_convidadas, v_meta, v_nome, v_whatsapp, v_email
  from public.inscricoes
  where id = user_id;

  if v_convidadas is null then
    return;
  end if;

  if v_convidadas >= v_meta then
    if v_meta >= 15 then
      v_prize_level := 'pack_completo';
      v_prize_name := 'Pack Completo (Agenda + Camisa + Bíblia)';
    elsif v_meta >= 10 then
      v_prize_level := 'agenda_camisa';
      v_prize_name := 'Agenda + Camisa';
    elsif v_meta >= 6 then
      v_prize_level := 'agenda';
      v_prize_name := 'Agenda Personalizada';
    else
      v_prize_level := 'camisa';
      v_prize_name := 'Camisa Mulheres de Fogo';
    end if;

    insert into public.prize_claims (participant_id, prize_level, status)
    values (user_id, v_prize_level, 'pending')
    on conflict (participant_id) do nothing;

    v_message := format(
      E'🎉 Parabéns %s!\n\nVocê convidou %s amigas para a Imersão WEX Mulheres de Fogo!\n\nSeu prêmio: %s\n\n📍 Mediateca de Luanda\n📅 8 de Agosto de 2026\n\nApresente esta mensagem no local do evento para retirar seu prêmio.\n\nMulheres de Fogo 🔥',
      v_nome, v_convidadas, v_prize_name
    );

    v_whatsapp_digits := regexp_replace(coalesce(v_whatsapp, ''), '\D', '', 'g');

    insert into public.notifications (
      participant_id,
      type,
      message,
      whatsapp_link,
      email_link
    )
    values (
      user_id,
      'prize_achieved',
      v_message,
      case
        when v_whatsapp_digits <> ''
          then 'https://wa.me/' || v_whatsapp_digits || '?text=' || replace(replace(replace(v_message, ' ', '%20'), E'\r\n', '%0D%0A'), E'\n', '%0A')
        else null
      end,
      'mailto:' || v_email || '?subject=Parabens%20voce%20ganhou%20um%20premio%20WEX'
    );
  end if;
end;
$$;

create or replace function public.process_new_referral()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if new.referred_by is not null and new.referred_by != new.id then
    insert into public.referrals (referrer_id, referred_id)
    values (new.referred_by, new.id)
    on conflict (referred_id) do nothing;

    update public.inscricoes
    set convidadas_count = convidadas_count + 1,
        updated_at = now()
    where id = new.referred_by;

    perform public.check_prize_achievement(new.referred_by);
  end if;

  return new;
end;
$$;

create or replace function public.mark_notification_sent(notification_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target_participant_id uuid;
begin
  if not public.is_admin_user() then
    raise exception 'not_authorized';
  end if;

  select n.participant_id
  into target_participant_id
  from public.notifications n
  where n.id = notification_id;

  if target_participant_id is null then
    raise exception 'notification_not_found';
  end if;

  update public.notifications
  set sent = true,
      notified_at = now()
  where id = notification_id;

  update public.prize_claims
  set status = 'notified',
      notified_at = now()
  where participant_id = target_participant_id;
end;
$$;

revoke all on function public.mark_notification_sent(uuid) from public;
grant execute on function public.mark_notification_sent(uuid) to authenticated;

create or replace function public.get_referral_ranking()
returns table (
  id uuid,
  nome text,
  email text,
  whatsapp text,
  convidadas_count integer,
  meta_convidadas integer,
  percentage numeric,
  prize_achieved boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'not_authorized';
  end if;

  return query
  select
    inscricoes.id,
    inscricoes.nome,
    inscricoes.email,
    inscricoes.whatsapp,
    inscricoes.convidadas_count,
    inscricoes.meta_convidadas,
    case
      when inscricoes.meta_convidadas > 0
        then round((inscricoes.convidadas_count::numeric / inscricoes.meta_convidadas) * 100, 1)
      else 0
    end as percentage,
    exists (
      select 1
      from public.prize_claims prize_claims
      where prize_claims.participant_id = inscricoes.id
        and prize_claims.status != 'delivered'
    ) as prize_achieved
  from public.inscricoes inscricoes
  where inscricoes.convidadas_count > 0
  order by inscricoes.convidadas_count desc
  limit 50;
end;
$$;

revoke all on function public.get_referral_ranking() from public;
grant execute on function public.get_referral_ranking() to authenticated;

create or replace function public.get_dashboard_stats()
returns table (
  total_inscritos bigint,
  total_referrals bigint,
  total_prizes_achieved bigint,
  prizes_pending_delivery bigint,
  top_referrer_nome text,
  top_referrer_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then
    raise exception 'not_authorized';
  end if;

  return query
  select
    (select count(*) from public.inscricoes)::bigint,
    (select count(*) from public.referrals)::bigint,
    (select count(*) from public.prize_claims where status != 'delivered')::bigint,
    (select count(*) from public.prize_claims where status = 'pending')::bigint,
    coalesce((select inscricoes.nome from public.inscricoes inscricoes order by inscricoes.convidadas_count desc limit 1), ''),
    coalesce((select inscricoes.convidadas_count from public.inscricoes inscricoes order by inscricoes.convidadas_count desc limit 1), 0);
end;
$$;

revoke all on function public.get_dashboard_stats() from public;
grant execute on function public.get_dashboard_stats() to authenticated;

drop policy if exists "Permitir inscricao publica" on public.inscricoes;
drop policy if exists "Permitir leitura publica" on public.inscricoes;
drop policy if exists "Permitir atualizacao" on public.inscricoes;
drop policy if exists "Permitir criar referrals" on public.referrals;
drop policy if exists "Permitir leitura referrals" on public.referrals;
drop policy if exists "Admin pode ver premios" on public.prize_claims;
drop policy if exists "Sistema pode criar premios" on public.prize_claims;
drop policy if exists "Admin pode atualizar premios" on public.prize_claims;
drop policy if exists "Admin pode ver proprio perfil" on public.admins;
drop policy if exists "Admin pode ver notificacoes" on public.notifications;
drop policy if exists "Sistema pode criar notificacoes" on public.notifications;
drop policy if exists "Admin pode atualizar notificacoes" on public.notifications;

alter table public.inscricoes enable row level security;
alter table public.referrals enable row level security;
alter table public.prize_claims enable row level security;
alter table public.admins enable row level security;
alter table public.notifications enable row level security;

create policy "Admins read inscricoes" on public.inscricoes
for select
using (public.is_admin_user());

create policy "Admins update inscricoes" on public.inscricoes
for update
using (public.is_admin_user());

create policy "Admins read referrals" on public.referrals
for select
using (public.is_admin_user());

create policy "Admins read prize_claims" on public.prize_claims
for select
using (public.is_admin_user());

create policy "Admins update prize_claims" on public.prize_claims
for update
using (public.is_admin_user());

create policy "Admins read own row" on public.admins
for select
using (id = auth.uid());

create policy "Admins read notifications" on public.notifications
for select
using (public.is_admin_user());

create policy "Admins update notifications" on public.notifications
for update
using (public.is_admin_user());
