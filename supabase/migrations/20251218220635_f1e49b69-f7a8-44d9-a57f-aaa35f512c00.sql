-- Etapa 2: Tabela para votos de melhor defensor
CREATE TABLE public.defender_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_for_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(game_id, voter_id)
);

-- Enable RLS
ALTER TABLE public.defender_votes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view defender votes" 
ON public.defender_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Confirmed participants can vote for defender" 
ON public.defender_votes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = defender_votes.game_id 
    AND game_participants.user_id = auth.uid() 
    AND game_participants.status = 'Confirmado'::participant_status
  )
);

-- Etapa 2 & 3: Adicionar campos em games
ALTER TABLE public.games 
ADD COLUMN best_defender_id uuid REFERENCES public.profiles(id),
ADD COLUMN ended_at timestamp with time zone,
ADD COLUMN results_determined boolean DEFAULT false;

-- Etapa 4: Tabela para histórico de ratings
CREATE TABLE public.rating_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  overall_before integer NOT NULL,
  overall_after integer NOT NULL,
  attack_before integer NOT NULL,
  attack_after integer NOT NULL,
  defense_before integer NOT NULL,
  defense_after integer NOT NULL,
  skill_before integer NOT NULL,
  skill_after integer NOT NULL,
  strength_before integer NOT NULL,
  strength_after integer NOT NULL,
  goals integer DEFAULT 0,
  assists integer DEFAULT 0,
  was_mvp boolean DEFAULT false,
  was_best_defender boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE public.rating_history ENABLE ROW LEVEL SECURITY;

-- Policies for rating_history
CREATE POLICY "Users can view all rating history" 
ON public.rating_history 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert rating history" 
ON public.rating_history 
FOR INSERT 
WITH CHECK (true);

-- Etapa 5: Adicionar campo de calibração concluída
ALTER TABLE public.profiles 
ADD COLUMN calibration_completed boolean DEFAULT false;

-- Atualizar perfis existentes como calibrados (já jogam há tempo)
UPDATE public.profiles SET calibration_completed = true WHERE id IS NOT NULL;