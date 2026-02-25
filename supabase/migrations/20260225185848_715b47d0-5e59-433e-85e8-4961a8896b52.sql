
-- Fix 1: Restrict profiles SELECT to own profile or pelada co-members
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

CREATE POLICY "Users can view own or co-member profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM pelada_members pm1
      JOIN pelada_members pm2 ON pm1.pelada_id = pm2.pelada_id
      WHERE pm1.user_id = auth.uid()
        AND pm2.user_id = profiles.id
    )
  );

-- Fix 2: Restrict rating_history SELECT to own history or pelada co-members
DROP POLICY IF EXISTS "Users can view all rating history" ON rating_history;

CREATE POLICY "Users can view own or co-member rating history" ON rating_history
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pelada_members pm1
      JOIN pelada_members pm2 ON pm1.pelada_id = pm2.pelada_id
      WHERE pm1.user_id = auth.uid()
        AND pm2.user_id = rating_history.user_id
    )
  );
