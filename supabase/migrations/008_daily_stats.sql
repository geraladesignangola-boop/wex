-- Daily registration and click stats for admin dashboard charts.

create or replace function public.get_daily_registrations(p_days int default 7)
returns table (
  date text,
  day_of_week text,
  count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select
      d::date as date,
      case extract(dow from d)
        when 0 then 'Dom'
        when 1 then 'Seg'
        when 2 then 'Ter'
        when 3 then 'Qua'
        when 4 then 'Qui'
        when 5 then 'Sex'
        when 6 then 'Sab'
      end as day_of_week
    from generate_series(
      (current_date - (p_days - 1) * interval '1 day')::date,
      current_date::date,
      interval '1 day'
    ) d
  ),
  counts as (
    select
      created_at::date as date,
      count(*)::bigint as count
    from public.inscricoes
    where created_at >= current_date - (p_days - 1) * interval '1 day'
    group by created_at::date
  )
  select
    to_char(d.date, 'YYYY-MM-DD') as date,
    d.day_of_week,
    coalesce(c.count, 0) as count
  from days d
  left join counts c on c.date = d.date
  order by d.date asc;
$$;

revoke all on function public.get_daily_registrations(int) from public;
grant execute on function public.get_daily_registrations(int) to authenticated;

create or replace function public.get_daily_clicks(p_days int default 7)
returns table (
  date text,
  day_of_week text,
  total bigint,
  whatsapp bigint,
  facebook bigint,
  instagram bigint,
  direct bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select
      d::date as date,
      case extract(dow from d)
        when 0 then 'Dom'
        when 1 then 'Seg'
        when 2 then 'Ter'
        when 3 then 'Qua'
        when 4 then 'Qui'
        when 5 then 'Sex'
        when 6 then 'Sab'
      end as day_of_week
    from generate_series(
      (current_date - (p_days - 1) * interval '1 day')::date,
      current_date::date,
      interval '1 day'
    ) d
  ),
  clicks as (
    select
      c.clicked_at::date as date,
      count(*)::bigint as total,
      count(*) filter (where c.source = 'whatsapp')::bigint as whatsapp,
      count(*) filter (where c.source = 'facebook')::bigint as facebook,
      count(*) filter (where c.source = 'instagram')::bigint as instagram,
      count(*) filter (where c.source = 'direct')::bigint as direct
    from public.referral_link_clicks c
    where c.clicked_at >= current_date - (p_days - 1) * interval '1 day'
    group by c.clicked_at::date
  )
  select
    to_char(d.date, 'YYYY-MM-DD') as date,
    d.day_of_week,
    coalesce(cl.total, 0) as total,
    coalesce(cl.whatsapp, 0) as whatsapp,
    coalesce(cl.facebook, 0) as facebook,
    coalesce(cl.instagram, 0) as instagram,
    coalesce(cl.direct, 0) as direct
  from days d
  left join clicks cl on cl.date = d.date
  order by d.date asc;
$$;

revoke all on function public.get_daily_clicks(int) from public;
grant execute on function public.get_daily_clicks(int) to authenticated;
