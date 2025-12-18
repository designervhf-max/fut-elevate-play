-- Create table for MVP votes
CREATE TABLE public.mvp_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  voter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  voted_for_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(game_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.mvp_votes ENABLE ROW LEVEL SECURITY;

-- Participants can vote (only confirmed players)
CREATE POLICY "Participants can vote" ON public.mvp_votes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_id = mvp_votes.game_id
    AND user_id = auth.uid()
    AND status = 'Confirmado'
  )
);

-- Anyone can view votes
CREATE POLICY "Anyone can view votes" ON public.mvp_votes FOR SELECT
USING (true);

-- Add stats_submitted column to game_participants
ALTER TABLE public.game_participants
ADD COLUMN stats_submitted boolean DEFAULT false;

-- Add mvp_id column to games
ALTER TABLE public.games
ADD COLUMN mvp_id uuid REFERENCES profiles(id);