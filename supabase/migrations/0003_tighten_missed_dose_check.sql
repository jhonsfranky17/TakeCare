-- Missed-dose grace period was reduced from 30 to 15 minutes (see
-- check-missed-doses Edge Function). Tighten the sweep interval to match --
-- otherwise the 15-min grace period is masked by a 15-min cron interval,
-- giving the same ~30 min worst-case detection latency as before.
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'check-missed-doses'),
  schedule := '*/5 * * * *'
);
