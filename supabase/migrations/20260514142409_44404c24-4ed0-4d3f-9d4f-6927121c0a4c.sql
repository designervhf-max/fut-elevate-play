ALTER TABLE public.match_participants
ADD COLUMN IF NOT EXISTS confirmed_via_link boolean NOT NULL DEFAULT false;

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_participants;
ALTER TABLE public.match_participants REPLICA IDENTITY FULL;