-- Close registrations: add setting and enforce in RPC.

-- Seed default: registrations are open
insert into public.app_settings (key, value)
values ('inscricoes_abertas', 'true')
on conflict (key) do nothing;

-- Update RPC to check if registrations are open before allowing insert
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
  inscricoes_abertas text;
begin
  -- Check if registrations are open
  select value into inscricoes_abertas
  from public.app_settings
  where key = 'inscricoes_abertas';

  if inscricoes_abertas = 'false' then
    raise exception 'inscricoes_fechadas';
  end if;

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
