-- =============================================
-- FASE 1: CRIAR ENUMS
-- =============================================

-- Role para membros da pelada (admin pode gerenciar, member apenas participa)
CREATE TYPE public.pelada_role AS ENUM ('admin', 'member');

-- Status da pelada
CREATE TYPE public.pelada_status AS ENUM ('active', 'inactive');

-- Status das partidas
CREATE TYPE public.match_status AS ENUM ('scheduled', 'in_progress', 'finished', 'cancelled');

-- =============================================
-- FASE 2: CRIAR TABELA PELADAS (Grupos Fixos)
-- =============================================

CREATE TABLE public.peladas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Pelada',
  location TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  time TIME WITHOUT TIME ZONE NOT NULL,
  game_type game_type NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 14,
  status pelada_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FASE 3: CRIAR TABELA PELADA_MEMBERS
-- =============================================

CREATE TABLE public.pelada_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pelada_id UUID NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role pelada_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (pelada_id, user_id)
);

-- =============================================
-- FASE 4: CRIAR TABELA MATCHES (Partidas)
-- =============================================

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pelada_id UUID NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  match_date DATE NOT NULL,
  match_time TIME WITHOUT TIME ZONE NOT NULL,
  location TEXT,
  status match_status NOT NULL DEFAULT 'scheduled',
  mvp_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  best_defender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  results_determined BOOLEAN DEFAULT false,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FASE 5: CRIAR TABELA MATCH_PARTICIPANTS
-- =============================================

CREATE TABLE public.match_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_position TEXT,
  status participant_status NOT NULL DEFAULT 'Pendente',
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  stats_submitted BOOLEAN DEFAULT false,
  rating NUMERIC,
  team INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_or_guest CHECK (user_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- =============================================
-- FASE 6: CRIAR TABELA MATCH_MVP_VOTES
-- =============================================

CREATE TABLE public.match_mvp_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (match_id, voter_id)
);

-- =============================================
-- FASE 7: CRIAR TABELA MATCH_DEFENDER_VOTES
-- =============================================

CREATE TABLE public.match_defender_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (match_id, voter_id)
);

-- =============================================
-- FASE 8: ENABLE RLS
-- =============================================

ALTER TABLE public.peladas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pelada_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_mvp_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_defender_votes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FASE 9: SECURITY DEFINER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.has_pelada_role(_user_id UUID, _pelada_id UUID, _role pelada_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pelada_members
    WHERE user_id = _user_id
      AND pelada_id = _pelada_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_pelada_member(_user_id UUID, _pelada_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pelada_members
    WHERE user_id = _user_id
      AND pelada_id = _pelada_id
  )
$$;

-- =============================================
-- FASE 10: RLS POLICIES - PELADAS
-- =============================================

-- Membros podem ver suas peladas
CREATE POLICY "Members can view their peladas"
ON public.peladas
FOR SELECT
USING (public.is_pelada_member(auth.uid(), id) OR creator_id = auth.uid());

-- Usuários podem criar peladas
CREATE POLICY "Users can create peladas"
ON public.peladas
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Admins podem atualizar peladas
CREATE POLICY "Admins can update peladas"
ON public.peladas
FOR UPDATE
USING (public.has_pelada_role(auth.uid(), id, 'admin') OR creator_id = auth.uid());

-- Criador pode deletar pelada
CREATE POLICY "Creator can delete pelada"
ON public.peladas
FOR DELETE
USING (creator_id = auth.uid());

-- =============================================
-- FASE 11: RLS POLICIES - PELADA_MEMBERS
-- =============================================

-- Membros podem ver outros membros da pelada
CREATE POLICY "Members can view pelada members"
ON public.pelada_members
FOR SELECT
USING (public.is_pelada_member(auth.uid(), pelada_id));

-- Admins podem adicionar membros
CREATE POLICY "Admins can add members"
ON public.pelada_members
FOR INSERT
WITH CHECK (
  public.has_pelada_role(auth.uid(), pelada_id, 'admin') 
  OR (SELECT creator_id FROM public.peladas WHERE id = pelada_id) = auth.uid()
);

-- Admins podem atualizar membros
CREATE POLICY "Admins can update members"
ON public.pelada_members
FOR UPDATE
USING (public.has_pelada_role(auth.uid(), pelada_id, 'admin'));

-- Admins podem remover membros (ou próprio usuário sair)
CREATE POLICY "Admins can remove members or self leave"
ON public.pelada_members
FOR DELETE
USING (
  public.has_pelada_role(auth.uid(), pelada_id, 'admin') 
  OR user_id = auth.uid()
);

-- =============================================
-- FASE 12: RLS POLICIES - MATCHES
-- =============================================

-- Membros podem ver partidas da pelada
CREATE POLICY "Members can view matches"
ON public.matches
FOR SELECT
USING (public.is_pelada_member(auth.uid(), pelada_id));

-- Admins podem criar partidas
CREATE POLICY "Admins can create matches"
ON public.matches
FOR INSERT
WITH CHECK (public.has_pelada_role(auth.uid(), pelada_id, 'admin'));

-- Admins podem atualizar partidas
CREATE POLICY "Admins can update matches"
ON public.matches
FOR UPDATE
USING (public.has_pelada_role(auth.uid(), pelada_id, 'admin'));

-- Admins podem deletar partidas
CREATE POLICY "Admins can delete matches"
ON public.matches
FOR DELETE
USING (public.has_pelada_role(auth.uid(), pelada_id, 'admin'));

-- =============================================
-- FASE 13: RLS POLICIES - MATCH_PARTICIPANTS
-- =============================================

-- Membros podem ver participantes
CREATE POLICY "Members can view match participants"
ON public.match_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.is_pelada_member(auth.uid(), m.pelada_id)
  )
);

-- Membros podem confirmar própria presença
CREATE POLICY "Members can confirm own presence"
ON public.match_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.is_pelada_member(auth.uid(), m.pelada_id)
  )
);

-- Admins podem adicionar guests
CREATE POLICY "Admins can add guest players"
ON public.match_participants
FOR INSERT
WITH CHECK (
  guest_name IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.has_pelada_role(auth.uid(), m.pelada_id, 'admin')
  )
);

-- Usuários podem atualizar própria participação
CREATE POLICY "Users can update own participation"
ON public.match_participants
FOR UPDATE
USING (user_id = auth.uid());

-- Admins podem atualizar qualquer participação
CREATE POLICY "Admins can update any participation"
ON public.match_participants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.has_pelada_role(auth.uid(), m.pelada_id, 'admin')
  )
);

-- Usuários podem cancelar própria presença
CREATE POLICY "Users can cancel own presence"
ON public.match_participants
FOR DELETE
USING (user_id = auth.uid());

-- Admins podem remover participantes
CREATE POLICY "Admins can remove participants"
ON public.match_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.has_pelada_role(auth.uid(), m.pelada_id, 'admin')
  )
);

-- =============================================
-- FASE 14: RLS POLICIES - VOTES
-- =============================================

-- MVP Votes
CREATE POLICY "Members can view mvp votes"
ON public.match_mvp_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.is_pelada_member(auth.uid(), m.pelada_id)
  )
);

CREATE POLICY "Confirmed participants can vote mvp"
ON public.match_mvp_votes
FOR INSERT
WITH CHECK (
  voter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.match_participants mp
    WHERE mp.match_id = match_mvp_votes.match_id
    AND mp.user_id = auth.uid()
    AND mp.status = 'Confirmado'
  )
);

-- Defender Votes
CREATE POLICY "Members can view defender votes"
ON public.match_defender_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND public.is_pelada_member(auth.uid(), m.pelada_id)
  )
);

CREATE POLICY "Confirmed participants can vote defender"
ON public.match_defender_votes
FOR INSERT
WITH CHECK (
  voter_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.match_participants mp
    WHERE mp.match_id = match_defender_votes.match_id
    AND mp.user_id = auth.uid()
    AND mp.status = 'Confirmado'
  )
);

-- =============================================
-- FASE 15: ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_pelada_members_user ON public.pelada_members(user_id);
CREATE INDEX idx_pelada_members_pelada ON public.pelada_members(pelada_id);
CREATE INDEX idx_matches_pelada ON public.matches(pelada_id);
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_match_participants_match ON public.match_participants(match_id);
CREATE INDEX idx_match_participants_user ON public.match_participants(user_id);