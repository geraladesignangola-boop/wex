-- Check-in system for event day
-- Adds check-in columns to inscricoes and creates RPC functions for search/mark/undo/stats

-- Enable unaccent extension for accent-tolerant search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Enable pg_trgm for fuzzy search (must be before GIN indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add check-in columns to inscricoes
ALTER TABLE public.inscricoes
  ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by text;

-- Index for faster check-in queries
CREATE INDEX IF NOT EXISTS idx_inscricoes_checked_in ON public.inscricoes (checked_in);
CREATE INDEX IF NOT EXISTS idx_inscricoes_nome_trgm ON public.inscricoes USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inscricoes_email_trgm ON public.inscricoes USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inscricoes_telefone_trgm ON public.inscricoes USING gin (telefone gin_trgm_ops);

-- =============================================================================
-- SEARCH FOR CHECK-IN
-- Search by name, email, or phone with accent tolerance
-- =============================================================================
CREATE OR REPLACE FUNCTION public.search_for_checkin(p_search text)
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  telefone text,
  whatsapp text,
  checked_in boolean,
  checked_in_at timestamptz,
  checked_in_by text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized text;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_search IS NULL OR btrim(p_search) = '' THEN
    RETURN;
  END IF;

  -- Normalize: lowercase, trim, remove accents
  v_normalized := lower(btrim(unaccent(p_search)));

  RETURN QUERY
  SELECT
    i.id,
    i.nome,
    i.email,
    i.telefone,
    i.whatsapp,
    i.checked_in,
    i.checked_in_at,
    i.checked_in_by
  FROM public.inscricoes i
  WHERE
    unaccent(lower(i.nome)) ILIKE '%' || v_normalized || '%'
    OR lower(i.email) ILIKE '%' || v_normalized || '%'
    OR i.telefone ILIKE '%' || p_search || '%'
  ORDER BY
    CASE
      WHEN unaccent(lower(i.nome)) = v_normalized THEN 0
      WHEN unaccent(lower(i.nome)) ILIKE v_normalized || '%' THEN 1
      WHEN lower(i.email) ILIKE v_normalized || '%' THEN 2
      ELSE 3
    END,
    i.nome
  LIMIT 10;
END;
$$;

REVOKE ALL ON FUNCTION public.search_for_checkin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_for_checkin(text) TO authenticated;

-- =============================================================================
-- MARK CHECK-IN
-- Mark a participant as checked in
-- =============================================================================
CREATE OR REPLACE FUNCTION public.mark_checkin(p_participant_id uuid, p_staff_name text)
RETURNS TABLE (
  id uuid,
  nome text,
  checked_in boolean,
  checked_in_at timestamptz,
  checked_in_by text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.inscricoes inscricoes
    WHERE inscricoes.id = p_participant_id AND inscricoes.checked_in = true
  ) THEN
    RAISE EXCEPTION 'already_checked_in';
  END IF;

  UPDATE public.inscricoes inscricoes
  SET
    inscricoes.checked_in = true,
    inscricoes.checked_in_at = now(),
    inscricoes.checked_in_by = btrim(p_staff_name)
  WHERE inscricoes.id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'participant_not_found';
  END IF;

  RETURN QUERY
  SELECT inscricoes.id, inscricoes.nome, inscricoes.checked_in, inscricoes.checked_in_at, inscricoes.checked_in_by
  FROM public.inscricoes inscricoes
  WHERE inscricoes.id = p_participant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_checkin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_checkin(uuid, text) TO authenticated;

-- =============================================================================
-- UNDO CHECK-IN
-- Revert a check-in (dashboard only, not for door staff)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.undo_checkin(p_participant_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.inscricoes
  SET
    checked_in = false,
    checked_in_at = NULL,
    checked_in_by = NULL
  WHERE id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'participant_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.undo_checkin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.undo_checkin(uuid) TO authenticated;

-- =============================================================================
-- GET CHECK-IN STATS
-- Returns total registered and total checked in
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_checkin_stats()
RETURNS TABLE (
  total_inscritos bigint,
  total_checked_in bigint,
  percentual numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.inscricoes)::bigint,
    (SELECT count(*) FROM public.inscricoes WHERE checked_in = true)::bigint,
    CASE
      WHEN (SELECT count(*) FROM public.inscricoes) > 0
        THEN round((SELECT count(*)::numeric FROM public.inscricoes WHERE checked_in = true) * 100.0 / (SELECT count(*)::numeric FROM public.inscricoes), 1)
      ELSE 0
    END;
$$;

REVOKE ALL ON FUNCTION public.get_checkin_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_checkin_stats() TO authenticated;

-- =============================================================================
-- GET CHECK-IN REPORT
-- Full list with check-in status for export
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_checkin_report()
RETURNS TABLE (
  id uuid,
  nome text,
  email text,
  telefone text,
  whatsapp text,
  checked_in boolean,
  checked_in_at timestamptz,
  checked_in_by text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.nome,
    i.email,
    i.telefone,
    i.whatsapp,
    i.checked_in,
    i.checked_in_at,
    i.checked_in_by,
    i.created_at
  FROM public.inscricoes i
  ORDER BY
    i.checked_in DESC,
    i.checked_in_at ASC NULLS LAST,
    i.nome ASC;
$$;

REVOKE ALL ON FUNCTION public.get_checkin_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_checkin_report() TO authenticated;
