-- Recreate match_status enum to include new values
ALTER TABLE public.matches ALTER COLUMN status DROP DEFAULT;
ALTER TYPE public.match_status RENAME TO match_status_old;

CREATE TYPE public.match_status AS ENUM (
  'criada',
  'confirmacoes_abertas',
  'em_andamento',
  'encerrada',
  'scheduled',
  'in_progress',
  'finished'
);

ALTER TABLE public.matches
  ALTER COLUMN status TYPE public.match_status
  USING status::text::public.match_status;

-- Migrate existing rows to new status values
UPDATE public.matches
  SET status = 'confirmacoes_abertas'::public.match_status
  WHERE status::text = 'scheduled' AND open_for_confirmation = true;

UPDATE public.matches
  SET status = 'criada'::public.match_status
  WHERE status::text = 'scheduled';

UPDATE public.matches
  SET status = 'em_andamento'::public.match_status
  WHERE status::text = 'in_progress';

UPDATE public.matches
  SET status = 'encerrada'::public.match_status
  WHERE status::text = 'finished';

ALTER TABLE public.matches
  ALTER COLUMN status SET DEFAULT 'criada'::public.match_status;

DROP TYPE public.match_status_old;

-- Update RLS to respect status lifecycle
DROP POLICY IF EXISTS "Members can confirm own presence" ON public.match_participants;
CREATE POLICY "Members can confirm own presence"
ON public.match_participants
FOR INSERT
TO public
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_participants.match_id
      AND public.is_pelada_member(auth.uid(), m.pelada_id)
      AND m.status IN ('confirmacoes_abertas'::public.match_status)
  )
);

DROP POLICY IF EXISTS "Users can cancel own presence" ON public.match_participants;
CREATE POLICY "Users can cancel own presence"
ON public.match_participants
FOR DELETE
TO public
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_participants.match_id
      AND m.status IN (
        'criada'::public.match_status,
        'confirmacoes_abertas'::public.match_status
      )
  )
);