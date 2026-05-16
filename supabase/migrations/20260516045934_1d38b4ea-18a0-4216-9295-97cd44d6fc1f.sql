CREATE OR REPLACE FUNCTION public.auto_confirm_match_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user uuid;
BEGIN
  -- Find the admin of the pelada (prefer pelada_members admin, fallback to creator)
  SELECT user_id INTO admin_user
  FROM public.pelada_members
  WHERE pelada_id = NEW.pelada_id AND role = 'admin'
  ORDER BY joined_at ASC
  LIMIT 1;

  IF admin_user IS NULL THEN
    SELECT creator_id INTO admin_user
    FROM public.peladas
    WHERE id = NEW.pelada_id;
  END IF;

  IF admin_user IS NOT NULL THEN
    INSERT INTO public.match_participants (match_id, user_id, status)
    VALUES (NEW.id, admin_user, 'Confirmado')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_match_admin ON public.matches;
CREATE TRIGGER trg_auto_confirm_match_admin
AFTER INSERT ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_match_admin();