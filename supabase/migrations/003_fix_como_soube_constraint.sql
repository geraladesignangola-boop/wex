-- Fix como_soube CHECK constraint and normalize existing data

-- 1. Normalize any existing records with unaccented values
UPDATE public.inscricoes
SET como_soube = 'Indicação de amiga'
WHERE como_soube = 'Indicacao de amiga';

-- 2. Add CHECK constraint to prevent future mismatches
ALTER TABLE public.inscricoes
ADD CONSTRAINT inscricoes_como_soube_check
CHECK (como_soube IN ('Instagram', 'Facebook', 'Indicação de amiga', 'Igreja', 'Outro'));
