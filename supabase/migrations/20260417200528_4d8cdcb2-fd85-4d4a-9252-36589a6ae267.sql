-- Restrict phone column on profiles to owner only.
-- The existing RLS policy lets co-members SELECT all columns of a profile,
-- which exposes phone numbers. We revoke column-level SELECT on phone from
-- client roles, forcing them to use the get_my_phone() RPC for their own phone.

REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, name, age, position, shirt_number, dominant_foot, avatar_url,
  preferred_game_type, overall_rating, attack_rating, defense_rating,
  skill_rating, strength_rating, total_goals, total_assists, total_saves,
  total_mvps, total_best_defender, total_games, total_participations,
  calibration_completed, created_at
) ON public.profiles TO anon, authenticated;