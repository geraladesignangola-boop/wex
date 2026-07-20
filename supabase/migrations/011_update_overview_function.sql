-- Migration 011: Atualizar funções RPC
-- Objetivo: Incluir campos de controle de grupo

-- Dropar funções existentes
DROP FUNCTION IF EXISTS public.get_admin_participants_overview();
DROP FUNCTION IF EXISTS public.get_admin_participant_detail(uuid);

-- Recriar get_admin_participants_overview
create or replace function public.get_admin_participants_overview()
returns table (
  id uuid,
  nome text,
  email text,
  telefone text,
  whatsapp text,
  morada text,
  igreja text,
  localizacao text,
  recomendacao text,
  observacoes text,
  admin_notes text,
  faixa_etaria text,
  como_soube text,
  expectativa text,
  referral_code text,
  meta_convidadas integer,
  convidadas_count integer,
  referred_by uuid,
  referred_by_nome text,
  total_links bigint,
  total_clicks bigint,
  facebook_clicks bigint,
  instagram_clicks bigint,
  whatsapp_clicks bigint,
  direct_clicks bigint,
  latest_link_id uuid,
  latest_link_token text,
  latest_link_label text,
  latest_link_created_at timestamptz,
  prize_level text,
  prize_achieved boolean,
  group_added_at timestamptz,
  group_added_by uuid,
  group_added_by_nome text,
  created_at timestamptz,
  updated_at timestamptz
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
  with link_counts as (
    select
      rl.participant_id,
      count(*)::bigint as total_links
    from public.referral_links rl
    group by rl.participant_id
  ),
  click_counts as (
    select
      rl.participant_id,
      count(c.id)::bigint as total_clicks,
      count(c.id) filter (where c.source = 'facebook')::bigint as facebook_clicks,
      count(c.id) filter (where c.source = 'instagram')::bigint as instagram_clicks,
      count(c.id) filter (where c.source = 'whatsapp')::bigint as whatsapp_clicks,
      count(c.id) filter (where c.source = 'direct')::bigint as direct_clicks
    from public.referral_links rl
    left join public.referral_link_clicks c on c.referral_link_id = rl.id
    group by rl.participant_id
  ),
  latest_links as (
    select distinct on (rl.participant_id)
      rl.participant_id,
      rl.id,
      rl.token,
      rl.label,
      rl.created_at
    from public.referral_links rl
    order by rl.participant_id, rl.created_at desc, rl.id desc
  ),
  current_prizes as (
    select pc.participant_id, pc.prize_level
    from public.prize_claims pc
    where pc.status <> 'delivered'
  )
  select
    i.id,
    i.nome,
    i.email,
    i.telefone,
    i.whatsapp,
    i.morada,
    i.igreja,
    i.localizacao,
    i.recomendacao,
    i.observacoes,
    i.admin_notes,
    i.faixa_etaria,
    i.como_soube,
    i.expectativa,
    i.referral_code,
    i.meta_convidadas,
    i.convidadas_count,
    i.referred_by,
    parent.nome as referred_by_nome,
    coalesce(lc.total_links, 1),
    coalesce(cc.total_clicks, 0),
    coalesce(cc.facebook_clicks, 0),
    coalesce(cc.instagram_clicks, 0),
    coalesce(cc.whatsapp_clicks, 0),
    coalesce(cc.direct_clicks, 0),
    ll.id,
    ll.token,
    ll.label,
    ll.created_at,
    cp.prize_level,
    exists (
      select 1
      from public.prize_claims prize_claims
      where prize_claims.participant_id = i.id
        and prize_claims.status <> 'delivered'
    ) as prize_achieved,
    i.group_added_at,
    i.group_added_by,
    admin.nome as group_added_by_nome,
    i.created_at,
    i.updated_at
  from public.inscricoes i
  left join public.inscricoes parent on parent.id = i.referred_by
  left join link_counts lc on lc.participant_id = i.id
  left join click_counts cc on cc.participant_id = i.id
  left join latest_links ll on ll.participant_id = i.id
  left join current_prizes cp on cp.participant_id = i.id
  left join public.admins admin on admin.id = i.group_added_by
  order by i.created_at desc, i.nome asc;
end;
$$;

-- Recriar get_admin_participant_detail (versão simplificada que funciona)
create or replace function public.get_admin_participant_detail(target_id uuid)
returns table(participant jsonb, links jsonb, notifications jsonb, click_summary jsonb)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  return query
  select
    jsonb_build_object(
      'id', i.id,
      'nome', i.nome,
      'email', i.email,
      'telefone', i.telefone,
      'whatsapp', i.whatsapp,
      'morada', i.morada,
      'igreja', i.igreja,
      'localizacao', i.localizacao,
      'recomendacao', i.recomendacao,
      'observacoes', i.observacoes,
      'admin_notes', i.admin_notes,
      'faixa_etaria', i.faixa_etaria,
      'como_soube', i.como_soube,
      'expectativa', i.expectativa,
      'referral_code', i.referral_code,
      'meta_convidadas', i.meta_convidadas,
      'convidadas_count', i.convidadas_count,
      'referred_by', i.referred_by,
      'referred_by_nome', parent.nome,
      'group_added_at', i.group_added_at,
      'group_added_by', i.group_added_by,
      'group_added_by_nome', admin.nome,
      'created_at', i.created_at,
      'updated_at', i.updated_at
    ),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rl.id,
        'token', rl.token,
        'label', rl.label,
        'source', rl.source,
        'created_at', rl.created_at
      ))
      from public.referral_links rl
      where rl.participant_id = i.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id,
        'type', n.type,
        'message', n.message,
        'whatsapp_link', n.whatsapp_link,
        'email_link', n.email_link,
        'read', n.read,
        'sent', n.sent,
        'created_at', n.created_at
      ))
      from public.notifications n
      where n.participant_id = i.id
    ), '[]'::jsonb),
    jsonb_build_object(
      'total_links', (select count(*) from public.referral_links rl where rl.participant_id = i.id),
      'total_clicks', 0,
      'facebook_clicks', 0,
      'instagram_clicks', 0,
      'whatsapp_clicks', 0,
      'direct_clicks', 0
    )
  from public.inscricoes i
  left join public.inscricoes parent on parent.id = i.referred_by
  left join public.admins admin on admin.id = i.group_added_by
  where i.id = target_id;
end;
$function$;
