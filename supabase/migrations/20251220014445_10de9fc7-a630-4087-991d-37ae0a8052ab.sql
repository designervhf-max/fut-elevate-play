-- Adicionar novas colunas na tabela profiles para estatísticas de carreira
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_mvps INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_best_defender INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_participations INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_saves INTEGER DEFAULT 0;

-- Adicionar coluna saves em match_participants para goleiros
ALTER TABLE public.match_participants ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0;

-- Criar tabela player_ratings para sistema de notas 0-10
CREATE TABLE IF NOT EXISTS public.player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL,
  rated_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT player_ratings_rating_check CHECK (rating >= 0 AND rating <= 10),
  CONSTRAINT player_ratings_unique UNIQUE(match_id, rater_id, rated_id)
);

-- Enable RLS on player_ratings
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_ratings
CREATE POLICY "Members can view ratings" 
ON public.player_ratings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM matches m 
  WHERE m.id = player_ratings.match_id 
  AND is_pelada_member(auth.uid(), m.pelada_id)
));

CREATE POLICY "Confirmed participants can rate" 
ON public.player_ratings 
FOR INSERT 
WITH CHECK (
  rater_id = auth.uid() 
  AND rater_id != rated_id
  AND EXISTS (
    SELECT 1 FROM match_participants mp 
    WHERE mp.match_id = player_ratings.match_id 
    AND mp.user_id = auth.uid() 
    AND mp.status = 'Confirmado'::participant_status
  )
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_player_ratings_match_id ON public.player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated_id ON public.player_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rater_id ON public.player_ratings(rater_id);