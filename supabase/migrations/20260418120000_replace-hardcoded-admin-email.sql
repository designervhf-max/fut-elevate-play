-- =====================================================================
-- Substitui email hardcoded na trigger de subscription por tabela
-- admin_emails. A trigger é SECURITY DEFINER e pode ler a tabela
-- diretamente; clientes autenticados não têm nenhuma política de acesso.
-- =====================================================================

-- 1) Criar tabela de emails admin
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
-- Nenhuma política criada intencionalmente:
-- clientes autenticados NÃO conseguem ler nem escrever esta tabela.
-- Somente funções SECURITY DEFINER e o service_role têm acesso.

-- 2) Semear com o email atual (pode ser gerenciado via SQL Editor no painel)
INSERT INTO public.admin_emails (email)
VALUES ('designervhf@gmail.com')
ON CONFLICT DO NOTHING;

-- 3) Substituir a função — sem email hardcoded
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  user_email text;
  sub_role   text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = user_email) THEN
    sub_role := 'admin';
  ELSE
    sub_role := 'pro';
  END IF;

  INSERT INTO public.user_subscriptions
    (user_id, role, subscription_status, trial_started_at, trial_ends_at)
  VALUES
    (NEW.id, sub_role, 'trialing', now(), now() + interval '15 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
