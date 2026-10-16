ALTER TABLE public.match_participants
  ADD CONSTRAINT match_participants_goals_range CHECK (goals IS NULL OR (goals >= 0 AND goals <= 30)),
  ADD CONSTRAINT match_participants_assists_range CHECK (assists IS NULL OR (assists >= 0 AND assists <= 30)),
  ADD CONSTRAINT match_participants_saves_range CHECK (saves IS NULL OR (saves >= 0 AND saves <= 50));