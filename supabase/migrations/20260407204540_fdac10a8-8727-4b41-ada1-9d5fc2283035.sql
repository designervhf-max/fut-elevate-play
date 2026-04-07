
-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'pro' CHECK (role IN ('admin', 'pro', 'free')),
  trial_started_at timestamp with time zone DEFAULT now(),
  trial_ends_at timestamp with time zone DEFAULT (now() + interval '15 days'),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert subscriptions (via trigger)
CREATE POLICY "System can insert subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create trigger function to auto-create subscription on profile insert
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
  -- Get the user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  -- Assign admin role if email matches
  IF user_email = 'designervhf@gmail.com' THEN
    sub_role := 'admin';
  ELSE
    sub_role := 'pro';
  END IF;

  INSERT INTO public.user_subscriptions (user_id, role, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    sub_role,
    now(),
    now() + interval '15 days'
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table (fires after insert)
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_subscription();
