ALTER TABLE public.game_participants 
  DROP CONSTRAINT game_participants_rating_check;

ALTER TABLE public.game_participants 
  ADD CONSTRAINT game_participants_rating_check 
  CHECK (rating >= 0 AND rating <= 100);