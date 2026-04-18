-- =====================================================================
-- Cron job: relatório diário de erros — todo dia às 07:00 BRT (10:00 UTC)
--
-- PRÉ-REQUISITOS (executar uma única vez no SQL Editor antes de aplicar):
--
--   1. Configure o CRON_SECRET como secret da Edge Function:
--      Supabase Dashboard → Edge Functions → daily-error-report → Secrets
--      Adicione: CRON_SECRET = <valor-secreto-que-você-escolher>
--
--   2. Registre o mesmo valor no banco para o pg_cron poder lê-lo:
--      ALTER DATABASE postgres SET app.cron_secret = '<valor-secreto-que-você-escolher>';
--
--   3. Adicione o SUPABASE_ACCESS_TOKEN nas secrets da Edge Function:
--      Crie um personal access token em: https://app.supabase.com/account/tokens
--      Adicione: SUPABASE_ACCESS_TOKEN = <token-gerado>
--
--   4. Adicione o RESEND nas secrets da Edge Function:
--      Adicione: RESEND = <sua-chave-resend>
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento anterior caso exista (idempotente)
SELECT cron.unschedule('daily-error-report')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-error-report'
);

-- Agenda às 10:00 UTC = 07:00 BRT
SELECT cron.schedule(
  'daily-error-report',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://brywlaqddkspxmkttwlb.supabase.co/functions/v1/daily-error-report',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
