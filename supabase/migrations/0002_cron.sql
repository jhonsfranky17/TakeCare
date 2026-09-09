-- Scheduling for TakeCare's background checks. See docs/build-spec.md section 10.
--
-- The service role key is never written into a migration file. Instead it is
-- stored once via Supabase Vault (run in the SQL editor, NOT checked in):
--
--   select vault.create_secret('<service-role-key>', 'service_role_key');
--
-- and read back here at cron-execution time through vault.decrypted_secrets.
--
-- Replace <PROJECT_REF> below with this project's ref (ovbnrofebdfkoabemkvg,
-- from VITE_SUPABASE_URL) before applying, or edit after the fact with:
--   select cron.alter_job(job_id, command := '...');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'generate-todays-doses',
  '5 0 * * *',
  $$ select generate_todays_doses(); $$
);

select cron.schedule(
  'check-missed-doses',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://ovbnrofebdfkoabemkvg.supabase.co/functions/v1/check-missed-doses',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);

select cron.schedule(
  'check-low-stock',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://ovbnrofebdfkoabemkvg.supabase.co/functions/v1/check-low-stock',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
