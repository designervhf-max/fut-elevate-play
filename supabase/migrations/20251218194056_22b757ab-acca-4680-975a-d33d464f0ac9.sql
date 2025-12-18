-- Create enum for positions
CREATE TYPE public.player_position AS ENUM ('Goleiro', 'Fixo', 'Ala', 'Pivô', 'Zagueiro', 'Meia', 'Atacante');

-- Create enum for dominant foot
CREATE TYPE public.dominant_foot AS ENUM ('Destro', 'Canhoto', 'Ambos');

-- Create enum for game type
CREATE TYPE public.game_type AS ENUM ('Futsal', 'Society', 'Campo');

-- Create enum for game status
CREATE TYPE public.game_status AS ENUM ('Confirmado', 'Pendente', 'Cancelado', 'Finalizado');

-- Create enum for participant status
CREATE TYPE public.participant_status AS ENUM ('Confirmado', 'Pendente', 'Recusado');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 10),
  position player_position NOT NULL,
  shirt_number INTEGER NOT NULL CHECK (shirt_number >= 1 AND shirt_number <= 99),
  dominant_foot dominant_foot NOT NULL,
  preferred_game_type game_type,
  avatar_url TEXT,
  total_goals INTEGER DEFAULT 0,
  total_assists INTEGER DEFAULT 0,
  overall_rating INTEGER DEFAULT 50 CHECK (overall_rating >= 0 AND overall_rating <= 99),
  attack_rating INTEGER DEFAULT 50 CHECK (attack_rating >= 0 AND attack_rating <= 99),
  defense_rating INTEGER DEFAULT 50 CHECK (defense_rating >= 0 AND defense_rating <= 99),
  skill_rating INTEGER DEFAULT 50 CHECK (skill_rating >= 0 AND skill_rating <= 99),
  strength_rating INTEGER DEFAULT 50 CHECK (strength_rating >= 0 AND strength_rating <= 99),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  game_type game_type NOT NULL,
  max_players INTEGER NOT NULL CHECK (max_players >= 2 AND max_players <= 30),
  status game_status DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game participants table
CREATE TABLE public.game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status participant_status DEFAULT 'Pendente',
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Games policies
CREATE POLICY "Users can view all games" ON public.games
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create games" ON public.games
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their games" ON public.games
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their games" ON public.games
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Game participants policies
CREATE POLICY "Users can view all participants" ON public.game_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join games" ON public.game_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.game_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can leave games" ON public.game_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, age, position, shirt_number, dominant_foot)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Jogador'),
    COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 18),
    COALESCE((NEW.raw_user_meta_data ->> 'position')::player_position, 'Meia'),
    COALESCE((NEW.raw_user_meta_data ->> 'shirt_number')::integer, 10),
    COALESCE((NEW.raw_user_meta_data ->> 'dominant_foot')::dominant_foot, 'Destro')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();