-- =============================================
-- FIX: Remove FK constraint before dropping games table
-- =============================================

-- First, drop the foreign key constraint from rating_history
ALTER TABLE public.rating_history DROP CONSTRAINT IF EXISTS rating_history_game_id_fkey;

-- Now we can safely drop the legacy tables
DROP TABLE IF EXISTS public.defender_votes;
DROP TABLE IF EXISTS public.mvp_votes;
DROP TABLE IF EXISTS public.game_participants;
DROP TABLE IF EXISTS public.games;

-- Note: The rating_history.game_id column is kept for historical data
-- but no longer references the games table (which is being replaced by matches)