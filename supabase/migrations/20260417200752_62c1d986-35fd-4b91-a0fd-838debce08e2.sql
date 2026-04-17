-- =====================================================================
-- 1) Move phone numbers out of profiles into a private table
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_contact_info (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact info"
  ON public.user_contact_info FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contact info"
  ON public.user_contact_info FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contact info"
  ON public.user_contact_info FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Backfill existing phone data
INSERT INTO public.user_contact_info (user_id, phone)
SELECT id, phone FROM public.profiles WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Phone validation trigger on the new table
CREATE OR REPLACE FUNCTION public.validate_contact_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+?[0-9]{10,15}$' THEN
    RAISE EXCEPTION 'Invalid phone format. Expected 10-15 digits with optional + prefix';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_contact_phone_trigger ON public.user_contact_info;
CREATE TRIGGER validate_contact_phone_trigger
  BEFORE INSERT OR UPDATE ON public.user_contact_info
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_phone();

-- Update get_my_phone to read from new table
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.user_contact_info WHERE user_id = auth.uid();
$$;

-- Update handle_new_user trigger to write phone to new table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, age, position, shirt_number, dominant_foot)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Jogador'),
    COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 18),
    COALESCE((NEW.raw_user_meta_data ->> 'position')::player_position, 'Meia'),
    COALESCE((NEW.raw_user_meta_data ->> 'shirt_number')::integer, 10),
    COALESCE((NEW.raw_user_meta_data ->> 'dominant_foot')::dominant_foot, 'Destro')
  );

  IF NEW.raw_user_meta_data ->> 'phone' IS NOT NULL THEN
    INSERT INTO public.user_contact_info (user_id, phone)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'phone')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the old phone column and its validation trigger from profiles
DROP TRIGGER IF EXISTS validate_phone_trigger ON public.profiles;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- =====================================================================
-- 2) Restrict match_participants self-update to status only
-- =====================================================================

DROP POLICY IF EXISTS "Users can update own participation" ON public.match_participants;

-- Users may only toggle their own status; stats and payment fields stay admin-only
CREATE POLICY "Users can update own status"
  ON public.match_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND goals IS NOT DISTINCT FROM (SELECT mp.goals FROM public.match_participants mp WHERE mp.id = match_participants.id)
    AND assists IS NOT DISTINCT FROM (SELECT mp.assists FROM public.match_participants mp WHERE mp.id = match_participants.id)
    AND saves IS NOT DISTINCT FROM (SELECT mp.saves FROM public.match_participants mp WHERE mp.id = match_participants.id)
    AND rating IS NOT DISTINCT FROM (SELECT mp.rating FROM public.match_participants mp WHERE mp.id = match_participants.id)
    AND paid IS NOT DISTINCT FROM (SELECT mp.paid FROM public.match_participants mp WHERE mp.id = match_participants.id)
    AND stats_submitted IS NOT DISTINCT FROM (SELECT mp.stats_submitted FROM public.match_participants mp WHERE mp.id = match_participants.id)
    AND team IS NOT DISTINCT FROM (SELECT mp.team FROM public.match_participants mp WHERE mp.id = match_participants.id)
  );