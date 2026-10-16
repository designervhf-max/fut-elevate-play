CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY
);

GRANT ALL ON public.admin_emails TO service_role;

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
-- Sem políticas intencionalmente: apenas funções SECURITY DEFINER e service_role acessam.

INSERT INTO public.admin_emails (email)
VALUES ('designervhf@gmail.com')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  sub_role text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = lower(user_email)) THEN
    sub_role := 'admin';
  ELSE
    sub_role := 'pro';
  END IF;

  INSERT INTO public.user_subscriptions (user_id, role, subscription_status, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    sub_role,
    'trialing',
    now(),
    now() + interval '15 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;