-- 1. Visibility enum
CREATE TYPE public.pelada_visibility AS ENUM ('public', 'private');

-- 2. Add fields to peladas
ALTER TABLE public.peladas
  ADD COLUMN visibility public.pelada_visibility NOT NULL DEFAULT 'private',
  ADD COLUMN address text,
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision;

CREATE INDEX idx_peladas_visibility ON public.peladas(visibility);
CREATE INDEX idx_peladas_geo ON public.peladas(latitude, longitude) WHERE visibility = 'public';

-- 3. Allow authenticated users to view public peladas (added policy alongside existing)
CREATE POLICY "Anyone authenticated can view public peladas"
ON public.peladas
FOR SELECT
TO authenticated
USING (visibility = 'public');

-- 4. Join requests table
CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.pelada_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelada_id uuid NOT NULL REFERENCES public.peladas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status public.join_request_status NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  responded_by uuid,
  UNIQUE (pelada_id, user_id)
);

CREATE INDEX idx_join_requests_pelada ON public.pelada_join_requests(pelada_id, status);
CREATE INDEX idx_join_requests_user ON public.pelada_join_requests(user_id);

ALTER TABLE public.pelada_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can create own request only for public peladas
CREATE POLICY "Users can create own join request"
ON public.pelada_join_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.peladas p
    WHERE p.id = pelada_id AND p.visibility = 'public'
  )
);

-- Users can view their own requests; pelada admins can view requests of their pelada
CREATE POLICY "Users view own or admin views pelada requests"
ON public.pelada_join_requests
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_pelada_role(auth.uid(), pelada_id, 'admin'::pelada_role)
  OR EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.creator_id = auth.uid())
);

-- Users can cancel (delete) own pending request
CREATE POLICY "Users can cancel own request"
ON public.pelada_join_requests
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');

-- Admins can update (approve/reject)
CREATE POLICY "Admins can update join requests"
ON public.pelada_join_requests
FOR UPDATE
TO authenticated
USING (
  public.has_pelada_role(auth.uid(), pelada_id, 'admin'::pelada_role)
  OR EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.creator_id = auth.uid())
)
WITH CHECK (
  public.has_pelada_role(auth.uid(), pelada_id, 'admin'::pelada_role)
  OR EXISTS (SELECT 1 FROM public.peladas p WHERE p.id = pelada_id AND p.creator_id = auth.uid())
);

-- 5. Trigger: when a request is approved, add user as pelada_member
CREATE OR REPLACE FUNCTION public.handle_join_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    INSERT INTO public.pelada_members (pelada_id, user_id, role)
    VALUES (NEW.pelada_id, NEW.user_id, 'member')
    ON CONFLICT DO NOTHING;
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status <> 'rejected') THEN
    NEW.responded_at := now();
    NEW.responded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_join_request_status_change
  BEFORE UPDATE ON public.pelada_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_join_request_approval();