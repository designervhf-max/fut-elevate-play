-- Remove date column and add weekday column for recurring games
ALTER TABLE public.games DROP COLUMN date;

-- Add weekday column (0=Sunday, 1=Monday, ..., 6=Saturday)
ALTER TABLE public.games ADD COLUMN weekday integer NOT NULL DEFAULT 1;

-- Add constraint to validate weekday values
ALTER TABLE public.games ADD CONSTRAINT weekday_check CHECK (weekday >= 0 AND weekday <= 6);