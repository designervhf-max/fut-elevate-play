-- Adicionar coluna name na tabela games
ALTER TABLE public.games ADD COLUMN name text NOT NULL DEFAULT 'Pelada';