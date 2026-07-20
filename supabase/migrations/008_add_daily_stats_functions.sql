-- Add daily registration and click stats functions for dashboard charts

CREATE OR REPLACE FUNCTION public.get_daily_registrations(p_days integer DEFAULT 7)
RETURNS TABLE (
  date text,
  day_of_week text,
  count bigint
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
  WITH date_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (p_days - 1) * INTERVAL '1 day')::date,
      CURRENT_DATE::date,
      INTERVAL '1 day'
    )::date AS day
  ),
  daily_counts AS (
    SELECT
      ds.day,
      COUNT(i.id) AS count
    FROM date_series ds
    LEFT JOIN public.inscricoes i ON DATE(i.created_at) = ds.day
    GROUP BY ds.day
  )
  SELECT
    dc.day::text AS date,
    CASE EXTRACT(DOW FROM dc.day)
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Seg'
      WHEN 2 THEN 'Ter'
      WHEN 3 THEN 'Qua'
      WHEN 4 THEN 'Qui'
      WHEN 5 THEN 'Sex'
      WHEN 6 THEN 'Sab'
    END AS day_of_week,
    dc.count
  FROM daily_counts dc
  ORDER BY dc.day ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_daily_registrations(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_registrations(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_daily_clicks(p_days integer DEFAULT 7)
RETURNS TABLE (
  date text,
  day_of_week text,
  total bigint,
  whatsapp bigint,
  facebook bigint,
  instagram bigint,
  direct bigint
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
  WITH date_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (p_days - 1) * INTERVAL '1 day')::date,
      CURRENT_DATE::date,
      INTERVAL '1 day'
    )::date AS day
  ),
  daily_clicks AS (
    SELECT
      ds.day,
      COUNT(c.id) AS total,
      COUNT(c.id) FILTER (WHERE c.source = 'whatsapp') AS whatsapp,
      COUNT(c.id) FILTER (WHERE c.source = 'facebook') AS facebook,
      COUNT(c.id) FILTER (WHERE c.source = 'instagram') AS instagram,
      COUNT(c.id) FILTER (WHERE c.source = 'direct') AS direct
    FROM date_series ds
    LEFT JOIN public.referral_link_clicks c ON DATE(c.clicked_at) = ds.day
    GROUP BY ds.day
  )
  SELECT
    dc.day::text AS date,
    CASE EXTRACT(DOW FROM dc.day)
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Seg'
      WHEN 2 THEN 'Ter'
      WHEN 3 THEN 'Qua'
      WHEN 4 THEN 'Qui'
      WHEN 5 THEN 'Sex'
      WHEN 6 THEN 'Sab'
    END AS day_of_week,
    dc.total,
    dc.whatsapp,
    dc.facebook,
    dc.instagram,
    dc.direct
  FROM daily_clicks dc
  ORDER BY dc.day ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_daily_clicks(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_clicks(integer) TO authenticated;
