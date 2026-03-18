-- Run this once in the Supabase SQL editor to schedule the resolver hourly.
-- Requires pg_cron + pg_net (enabled by default on Supabase projects).
-- Also requires these Vault secrets:
--  - project_url  (e.g. https://<project-ref>.supabase.co)
--  - service_role_key

select
  cron.schedule(
    'resolve-open-challenges-hourly',
    '0 * * * *',
    $$
    select
      net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
          || '/functions/v1/resolve-challenges',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := '{}'::jsonb
      ) as request_id;
    $$
  );
