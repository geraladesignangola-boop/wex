-- Add versioned referral links, click tracking, and richer admin tooling.

alter table public.inscricoes
  add column if not exists localizacao text,
  add column if not exists recomendacao text,
  add column if not exists observacoes text,
  add column if not exists admin_notes text;

create table if not exists public.referral_links (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid not null references public.inscricoes(id) on delete cascade,
  token text not null unique,
  label text not null default 'Link principal',
  source text not null default 'legacy' check (source in ('legacy', 'admin', 'manual', 'share')),
  created_by_admin uuid references public.admins(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_links_participant_id on public.referral_links(participant_id);
create index if not exists idx_referral_links_created_at on public.referral_links(created_at desc);

create table if not exists public.referral_link_clicks (
  id uuid default gen_random_uuid() primary key,
  referral_link_id uuid not null references public.referral_links(id) on delete cascade,
  participant_id uuid not null references public.inscricoes(id) on delete cascade,
  source text not null default 'direct' check (source in ('direct', 'facebook', 'instagram', 'whatsapp', 'email', 'admin', 'other')),
  user_agent text,
  clicked_at timestamptz not null default now()
);

create index if not exists idx_referral_link_clicks_participant_id on public.referral_link_clicks(participant_id);
create index if not exists idx_referral_link_clicks_link_id on public.referral_link_clicks(referral_link_id);
create index if not exists idx_referral_link_clicks_source on public.referral_link_clicks(source);
create index if not exists idx_referral_link_clicks_clicked_at on public.referral_link_clicks(clicked_at desc);

insert into public.referral_links (participant_id, token, label, source, created_at)
select
  i.id,
  i.referral_code,
  'Link principal',
  'legacy',
  i.created_at
from public.inscricoes i
where i.referral_code is not null
on conflict (token) do nothing;

create or replace function public.ensure_primary_referral_link()
returns trigger
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  insert into public.referral_links (participant_id, token, label, source, created_at)
  values (new.id, new.referral_code, 'Link principal', 'legacy', coalesce(new.created_at, now()))
  on conflict (token) do nothing;

  return new;
end;
$$;

drop trigger if exists trigger_inscricoes_primary_referral_link on public.inscricoes;
create trigger trigger_inscricoes_primary_referral_link
  after insert on public.inscricoes
  for each row execute function public.ensure_primary_referral_link();

create or replace function public.get_public_referrer_by_code(ref_code text)
returns table (
  id uuid,
  nome text,
  meta_convidadas integer,
  convidadas_count integer,
  referral_code text,
  referral_link_id uuid,
  referral_link_token text,
  referral_link_label text,
  total_links bigint,
  total_clicks bigint,
  facebook_clicks bigint,
  instagram_clicks bigint,
  whatsapp_clicks bigint,
  direct_clicks bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  with matched_participant as (
    select i.id, i.nome, i.meta_convidadas, i.convidadas_count, i.referral_code
    from public.inscricoes i
    where i.referral_code = ref_code
       or exists (
         select 1
         from public.referral_links rl
         where rl.participant_id = i.id
           and rl.token = ref_code
       )
    order by i.created_at asc
    limit 1
  ),
  matched_link as (
    select rl.id, rl.token, rl.label
    from public.referral_links rl
    inner join matched_participant mp on mp.id = rl.participant_id
    where rl.token = ref_code
    order by rl.created_at desc
    limit 1
  ),
  link_counts as (
    select
      rl.participant_id,
      count(*)::bigint as total_links
    from public.referral_links rl
    inner join matched_participant mp on mp.id = rl.participant_id
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
    inner join matched_participant mp on mp.id = rl.participant_id
    group by rl.participant_id
  )
  select
    mp.id,
    mp.nome,
    mp.meta_convidadas,
    mp.convidadas_count,
    mp.referral_code,
    ml.id,
    coalesce(ml.token, mp.referral_code),
    coalesce(ml.label, 'Link principal'),
    coalesce(lc.total_links, 1),
    coalesce(cc.total_clicks, 0),
    coalesce(cc.facebook_clicks, 0),
    coalesce(cc.instagram_clicks, 0),
    coalesce(cc.whatsapp_clicks, 0),
    coalesce(cc.direct_clicks, 0)
  from matched_participant mp
  left join matched_link ml on true
  left join link_counts lc on lc.participant_id = mp.id
  left join click_counts cc on cc.participant_id = mp.id;
end;
$$;

revoke all on function public.get_public_referrer_by_code(text) from public;
grant execute on function public.get_public_referrer_by_code(text) to anon, authenticated;

create or replace function public.log_referral_link_click(
  ref_code text,
  p_source text default 'direct',
  p_user_agent text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  resolved_link_id uuid;
  resolved_participant_id uuid;
  normalized_source text;
begin
  normalized_source := lower(coalesce(nullif(btrim(p_source), ''), 'direct'));
  if normalized_source not in ('direct', 'facebook', 'instagram', 'whatsapp', 'email', 'admin', 'other') then
    normalized_source := 'other';
  end if;

  select rl.id, rl.participant_id
  into resolved_link_id, resolved_participant_id
  from public.referral_links rl
  where rl.token = ref_code
  order by rl.created_at desc
  limit 1;

  if resolved_link_id is null then
    select rl.id, rl.participant_id
    into resolved_link_id, resolved_participant_id
    from public.referral_links rl
    inner join public.inscricoes i on i.id = rl.participant_id
    where i.referral_code = ref_code
    order by rl.created_at asc
    limit 1;
  end if;

  if resolved_link_id is null then
    return;
  end if;

  insert into public.referral_link_clicks (
    referral_link_id,
    participant_id,
    source,
    user_agent
  )
  values (
    resolved_link_id,
    resolved_participant_id,
    normalized_source,
    nullif(btrim(p_user_agent), '')
  );
end;
$$;

revoke all on function public.log_referral_link_click(text, text, text) from public;
grant execute on function public.log_referral_link_click(text, text, text) to anon, authenticated;

create or replace function public.create_public_inscricao(
  p_nome text,
  p_email text,
  p_telefone text,
  p_whatsapp text,
  p_morada text,
  p_igreja text,
  p_localizacao text,
  p_recomendacao text,
  p_observacoes text,
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

  if p_meta_convidadas is not null and p_meta_convidadas not in (3, 6, 10, 15) then
    raise exception 'meta_convidadas_invalid';
  end if;

  if p_referred_by_code is not null and btrim(p_referred_by_code) <> '' then
    select rl.participant_id
    into resolved_referred_by
    from public.referral_links rl
    where rl.token = p_referred_by_code
    order by rl.created_at desc
    limit 1;

    if resolved_referred_by is null then
      select i.id
      into resolved_referred_by
      from public.inscricoes i
      where i.referral_code = p_referred_by_code
      limit 1;
    end if;
  end if;

  insert into public.inscricoes (
    nome,
    email,
    telefone,
    whatsapp,
    morada,
    igreja,
    localizacao,
    recomendacao,
    observacoes,
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
    nullif(btrim(p_localizacao), ''),
    nullif(btrim(p_recomendacao), ''),
    nullif(btrim(p_observacoes), ''),
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
  text,
  text,
  text,
  integer,
  text
) to anon, authenticated;

create or replace function public.admin_generate_referral_link(
  p_participant_id uuid,
  p_label text default null
)
returns table (
  id uuid,
  participant_id uuid,
  token text,
  label text,
  source text,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  inserted_row public.referral_links%rowtype;
  candidate_token text;
  normalized_label text;
begin
  if not public.is_admin_user() then
    raise exception 'not_authorized';
  end if;

  if not exists (select 1 from public.inscricoes where id = p_participant_id) then
    raise exception 'participant_not_found';
  end if;

  normalized_label := coalesce(nullif(btrim(p_label), ''), 'Link extra');

  loop
    candidate_token := replace(gen_random_uuid()::text, '-', '');
    begin
      insert into public.referral_links (
        participant_id,
        token,
        label,
        source,
        created_by_admin
      )
      values (
        p_participant_id,
        candidate_token,
        normalized_label,
        'admin',
        auth.uid()
      )
      returning * into inserted_row;
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  return query
  select
    inserted_row.id,
    inserted_row.participant_id,
    inserted_row.token,
    inserted_row.label,
    inserted_row.source,
    inserted_row.created_at;
end;
$$;

revoke all on function public.admin_generate_referral_link(uuid, text) from public;
grant execute on function public.admin_generate_referral_link(uuid, text) to authenticated;

create or replace function public.admin_send_referral_link(
  p_participant_id uuid,
  p_referral_link_id uuid default null,
  p_link_url text default null
)
returns table (
  notification_id uuid,
  participant_id uuid,
  referral_link_id uuid,
  referral_link_token text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target_participant record;
  target_link record;
  v_message text;
  v_whatsapp_digits text;
  inserted_notification_id uuid;
begin
  if not public.is_admin_user() then
    raise exception 'not_authorized';
  end if;

  select i.id, i.nome, i.email, i.whatsapp
  into target_participant
  from public.inscricoes i
  where i.id = p_participant_id;

  if target_participant.id is null then
    raise exception 'participant_not_found';
  end if;

  if p_referral_link_id is not null then
    select rl.id, rl.token
    into target_link
    from public.referral_links rl
    where rl.id = p_referral_link_id
      and rl.participant_id = p_participant_id;
  end if;

  if target_link.id is null then
    select rl.id, rl.token
    into target_link
    from public.referral_links rl
    where rl.participant_id = p_participant_id
    order by rl.created_at desc
    limit 1;
  end if;

  if target_link.id is null then
    raise exception 'referral_link_not_found';
  end if;

  v_message := format(
    E'Olá %s!\n\nO teu novo link da Imersão WEX já está disponível:\n%s\n\nPartilha com as tuas amigas e acompanha o teu progresso no painel.\n\nMulheres de Fogo',
    target_participant.nome,
    coalesce(nullif(btrim(p_link_url), ''), '/convite?ref=' || target_link.token)
  );

  v_whatsapp_digits := regexp_replace(coalesce(target_participant.whatsapp, ''), '\D', '', 'g');

  insert into public.notifications (
    participant_id,
    type,
    message,
    whatsapp_link,
    email_link
  )
  values (
    target_participant.id,
    'reminder',
    v_message,
    case
      when v_whatsapp_digits <> ''
        then 'https://wa.me/' || v_whatsapp_digits || '?text=' || replace(replace(replace(v_message, E'\r\n', '%0D%0A'), E'\n', '%0A'), ' ', '%20')
      else null
    end,
    'mailto:' || target_participant.email || '?subject=Novo%20link%20de%20convite%20WEX'
  )
  returning id into inserted_notification_id;

  return query
  select
    inserted_notification_id,
    target_participant.id,
    target_link.id,
    target_link.token;
end;
$$;

revoke all on function public.admin_send_referral_link(uuid, uuid, text) from public;
grant execute on function public.admin_send_referral_link(uuid, uuid, text) to authenticated;

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
    i.created_at,
    i.updated_at
  from public.inscricoes i
  left join public.inscricoes parent on parent.id = i.referred_by
  left join link_counts lc on lc.participant_id = i.id
  left join click_counts cc on cc.participant_id = i.id
  left join latest_links ll on ll.participant_id = i.id
  left join current_prizes cp on cp.participant_id = i.id
  order by i.created_at desc, i.nome asc;
end;
$$;

revoke all on function public.get_admin_participants_overview() from public;
grant execute on function public.get_admin_participants_overview() to authenticated;

create or replace function public.get_admin_participant_detail(target_id uuid)
returns table (
  participant jsonb,
  links jsonb,
  notifications jsonb,
  click_summary jsonb
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
  with participant_row as (
    select
      i.*,
      parent.nome as referred_by_nome,
      coalesce(lc.total_links, 0) as total_links,
      coalesce(cc.total_clicks, 0) as total_clicks,
      coalesce(cc.facebook_clicks, 0) as facebook_clicks,
      coalesce(cc.instagram_clicks, 0) as instagram_clicks,
      coalesce(cc.whatsapp_clicks, 0) as whatsapp_clicks,
      coalesce(cc.direct_clicks, 0) as direct_clicks
    from public.inscricoes i
    left join public.inscricoes parent on parent.id = i.referred_by
    left join (
      select rl.participant_id, count(*)::bigint as total_links
      from public.referral_links rl
      group by rl.participant_id
    ) lc on lc.participant_id = i.id
    left join (
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
    ) cc on cc.participant_id = i.id
    where i.id = target_id
    limit 1
  ),
  link_clicks as (
    select
      c.referral_link_id,
      count(c.id)::bigint as total_clicks,
      count(c.id) filter (where c.source = 'facebook')::bigint as facebook_clicks,
      count(c.id) filter (where c.source = 'instagram')::bigint as instagram_clicks,
      count(c.id) filter (where c.source = 'whatsapp')::bigint as whatsapp_clicks,
      count(c.id) filter (where c.source = 'direct')::bigint as direct_clicks
    from public.referral_link_clicks c
    group by c.referral_link_id
  )
  select
    jsonb_build_object(
      'id', pr.id,
      'nome', pr.nome,
      'email', pr.email,
      'telefone', pr.telefone,
      'whatsapp', pr.whatsapp,
      'morada', pr.morada,
      'igreja', pr.igreja,
      'localizacao', pr.localizacao,
      'recomendacao', pr.recomendacao,
      'observacoes', pr.observacoes,
      'admin_notes', pr.admin_notes,
      'faixa_etaria', pr.faixa_etaria,
      'como_soube', pr.como_soube,
      'expectativa', pr.expectativa,
      'referral_code', pr.referral_code,
      'meta_convidadas', pr.meta_convidadas,
      'convidadas_count', pr.convidadas_count,
      'referred_by', pr.referred_by,
      'referred_by_nome', pr.referred_by_nome,
      'total_links', pr.total_links,
      'total_clicks', pr.total_clicks,
      'facebook_clicks', pr.facebook_clicks,
      'instagram_clicks', pr.instagram_clicks,
      'whatsapp_clicks', pr.whatsapp_clicks,
      'direct_clicks', pr.direct_clicks,
      'created_at', pr.created_at,
      'updated_at', pr.updated_at
    ),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', rl.id,
          'participant_id', rl.participant_id,
          'token', rl.token,
          'label', rl.label,
          'source', rl.source,
          'created_by_admin', rl.created_by_admin,
          'created_at', rl.created_at,
          'total_clicks', coalesce(lc.total_clicks, 0),
          'facebook_clicks', coalesce(lc.facebook_clicks, 0),
          'instagram_clicks', coalesce(lc.instagram_clicks, 0),
          'whatsapp_clicks', coalesce(lc.whatsapp_clicks, 0),
          'direct_clicks', coalesce(lc.direct_clicks, 0)
        )
        order by rl.created_at desc
      )
      from public.referral_links rl
      left join link_clicks lc on lc.referral_link_id = rl.id
      where rl.participant_id = pr.id
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at desc)
      from public.notifications n
      where n.participant_id = pr.id
    ), '[]'::jsonb),
    jsonb_build_object(
      'total_links', pr.total_links,
      'total_clicks', pr.total_clicks,
      'facebook_clicks', pr.facebook_clicks,
      'instagram_clicks', pr.instagram_clicks,
      'whatsapp_clicks', pr.whatsapp_clicks,
      'direct_clicks', pr.direct_clicks
    )
  from participant_row pr;
end;
$$;

revoke all on function public.get_admin_participant_detail(uuid) from public;
grant execute on function public.get_admin_participant_detail(uuid) to authenticated;

create or replace function public.get_dashboard_stats()
returns table (
  total_inscritos bigint,
  total_referrals bigint,
  total_prizes_achieved bigint,
  prizes_pending_delivery bigint,
  total_links bigint,
  total_clicks bigint,
  facebook_clicks bigint,
  instagram_clicks bigint,
  whatsapp_clicks bigint,
  direct_clicks bigint,
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
    coalesce((select count(*) from public.referral_links)::bigint, 0),
    coalesce((select count(*) from public.referral_link_clicks)::bigint, 0),
    coalesce((select count(*) from public.referral_link_clicks where source = 'facebook')::bigint, 0),
    coalesce((select count(*) from public.referral_link_clicks where source = 'instagram')::bigint, 0),
    coalesce((select count(*) from public.referral_link_clicks where source = 'whatsapp')::bigint, 0),
    coalesce((select count(*) from public.referral_link_clicks where source = 'direct')::bigint, 0),
    coalesce((select nome from public.inscricoes order by convidadas_count desc, created_at asc, nome asc limit 1), ''),
    coalesce((select convidadas_count from public.inscricoes order by convidadas_count desc, created_at asc, nome asc limit 1), 0);
end;
$$;

revoke all on function public.get_dashboard_stats() from public;
grant execute on function public.get_dashboard_stats() to authenticated;

alter table public.referral_links enable row level security;
alter table public.referral_link_clicks enable row level security;

drop policy if exists "Admins read referral_links" on public.referral_links;
drop policy if exists "Admins read referral_link_clicks" on public.referral_link_clicks;

create policy "Admins read referral_links" on public.referral_links
for select
using (public.is_admin_user());

create policy "Admins read referral_link_clicks" on public.referral_link_clicks
for select
using (public.is_admin_user());
