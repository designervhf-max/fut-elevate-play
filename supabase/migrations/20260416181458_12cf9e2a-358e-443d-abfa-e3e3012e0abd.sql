-- 1. Restrict user_subscriptions INSERT to service role / trigger only
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.user_subscriptions;

-- (No INSERT policy = no client inserts. The handle_new_subscription trigger 
--  is SECURITY DEFINER and bypasses RLS, so signup flow continues working.)

-- 2. Protect phone column on profiles via column-level privileges.
-- Co-members can read profiles but NOT the phone column. Users can still read
-- their own phone because RLS allows the row, and we add a SECURITY DEFINER
-- function for self-phone access if needed.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, age, position, shirt_number, dominant_foot, avatar_url,
  preferred_game_type, overall_rating, attack_rating, defense_rating,
  skill_rating, strength_rating, total_goals, total_assists, total_saves,
  total_mvps, total_best_defender, total_games, total_participations,
  calibration_completed, created_at
) ON public.profiles TO anon, authenticated;

-- Allow users to read their OWN phone via a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Storage: prevent listing of avatars bucket while keeping public URL access.
-- Public URL fetches go through the storage CDN and don't require this SELECT policy.
-- Removing it stops anonymous bulk listing via the API.
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Allow authenticated users to read avatar metadata only for their own files
-- (still keeps direct public URLs working since the bucket is public).
CREATE POLICY "Users can view own avatar metadata"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);