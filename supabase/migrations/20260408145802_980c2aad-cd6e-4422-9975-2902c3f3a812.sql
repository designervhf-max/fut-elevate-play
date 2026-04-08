
-- Add subscription_status column to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing' 
CHECK (subscription_status IN ('trialing', 'active', 'expired'));

-- Fix handle_new_subscription to use ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_email text;
  sub_role text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  IF user_email = 'designervhf@gmail.com' THEN
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
