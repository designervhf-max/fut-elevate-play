-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cron job to call determine-game-results every 5 minutes
SELECT cron.schedule(
  'process-game-results',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://brywlaqddkspxmkttwlb.supabase.co/functions/v1/determine-game-results',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeXdsYXFkZGtzcHhta3R0d2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzg3OTcsImV4cCI6MjA4MTY1NDc5N30.8ekXltxr2ZaY5uXX8FzzjYwC4mUF0WKz4Ij-KP69L7M"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);