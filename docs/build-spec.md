# TakeCare — Medicine Adherence PWA — Build Spec

## 1. Overview

A Progressive Web App that tracks a cardiac patient's medicine intake and notifies
all family members in real time when:
1. A dose is taken
2. A dose is missed (not logged within a grace window)
3. Any medicine's stock will run out within 7 days

The patient (or a caregiver) logs doses by tapping "Taken" in the app. Server-side
scheduled checks detect missed doses and low stock — this must NOT depend on the
app being open, since reminders need to fire even if no device has the tab active.

No paid services. No credit card required anywhere in the stack.

## 2. Goals / Non-goals

**Goals**
- Reliable push notifications on both Android (Chrome) and iOS (Safari, 16.4+, installed to home screen)
- Zero monthly cost
- Simple enough for a non-technical patient to use one-handed
- Family members only need to install the PWA and grant notification permission — no separate accounts to manage beyond a simple login

**Non-goals (out of scope for v1)**
- Actually calling the patient (family does this manually after a missed-dose alert)
- Multi-patient support (single patient per deployment is fine)
- Native app store distribution

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript (strict mode, no `any`, no `unknown`) |
| PWA tooling | `vite-plugin-pwa` (manifest + service worker generation) |
| Backend / DB | Supabase (Postgres, free tier) |
| Auth | Supabase Auth (email/password or magic link — keep simple, family-sized) |
| Serverless functions | Supabase Edge Functions (Deno + TypeScript) |
| Scheduling | Supabase `pg_cron` + `pg_net` extensions |
| Push delivery | Web Push API with VAPID keys, via the `web-push` npm package inside Edge Functions |
| Hosting | Vercel (free tier) |

## 4. Architecture (text diagram)

```
[Patient/Family PWA] --(mark taken)--> [Supabase Postgres: intake_logs]
        |                                        |
        | (subscribe to push)                    | triggers
        v                                        v
[push_subscriptions table]  <---- read ---- [Edge Function: log-intake]
        ^                                        |
        |                                        v
        |                              push confirmation to all
        |                              family push_subscriptions
        |
[pg_cron every 15 min] --> [Edge Function: check-missed-doses] --> push alerts
[pg_cron once daily]   --> [Edge Function: check-low-stock]    --> push alerts
```

## 5. Data Model (Postgres / Supabase)

```sql
-- patients: just one row for v1, but modeled as a table for future flexibility
create table patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Kolkata'
);

create table medicines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) not null,
  name text not null,
  dosage_per_intake integer not null,       -- pills per dose
  times_per_day text[] not null,            -- e.g. ARRAY['08:00','20:00']
  current_stock integer not null,
  refill_threshold_days integer not null default 7,
  low_stock_alert_sent_at timestamptz,      -- prevents repeat alerts in same cycle
  created_at timestamptz not null default now()
);

create table intake_logs (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid references medicines(id) not null,
  scheduled_time timestamptz not null,
  taken_time timestamptz,
  status text not null check (status in ('pending','taken','missed')) default 'pending',
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) not null,
  name text not null,
  auth_user_id uuid references auth.users(id) not null,
  created_at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid references family_members(id) not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: enable on all tables, restrict to authenticated family members
alter table patients enable row level security;
alter table medicines enable row level security;
alter table intake_logs enable row level security;
alter table family_members enable row level security;
alter table push_subscriptions enable row level security;

-- Policies: any authenticated family member can read/write data for their patient.
-- (Claude Code: write policies that check family_members.auth_user_id = auth.uid()
-- and join through patient_id for medicines/intake_logs/push_subscriptions.)
```

## 6. TypeScript Conventions

- `tsconfig.json`: `"strict": true`, `"noImplicitAny": true`. Never use `any` or `unknown` — define explicit interfaces/types for every data shape, including Supabase row types (use generated types via `supabase gen types typescript`).
- No implicit `any` in function params or returns.
- Prefer discriminated unions for `intake_logs.status` (`'pending' | 'taken' | 'missed'`) rather than plain strings where used in logic.

## 7. Frontend Spec

**Screens**
1. **Login** — Supabase Auth (magic link or email/password)
2. **Home / Medicine List** — today's doses with a big "Mark as Taken" button per dose, color-coded by status (pending/taken/missed)
3. **History** — timeline of past intake logs
4. **Medicines Admin** — add/edit medicines, dosage, schedule, current stock
5. **Family** — list of family members, invite link/QR to add more

**Push subscription flow**
- On login, request `Notification.requestPermission()`
- On grant, call `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
- Save the returned subscription (`endpoint`, `keys.p256dh`, `keys.auth`) to `push_subscriptions`, linked to the logged-in family member

**Service worker**
- Handle `push` event → show notification with title/body from payload
- Handle `notificationclick` → focus/open the app

## 8. Push Notification Flow (VAPID — cross-platform)

- Generate one VAPID key pair (`npx web-push generate-vapid-keys`) — used for both Android and iOS since Web Push is a browser standard, not vendor-specific.
- Public key goes in frontend env var, both keys stored as Supabase Edge Function secrets.
- Edge Functions use the `web-push` npm-compatible library (or `https://esm.sh/web-push` in Deno) to send notifications directly to each stored subscription's `endpoint`.
- **iOS requirement**: PWA must be added to Home Screen (Share → Add to Home Screen) on iOS 16.4+; push does not work from a Safari tab.

## 9. Edge Functions Spec

### `log-intake`
- Trigger: called directly from the frontend when the patient taps "Mark as Taken"
- Input: `{ intakeLogId: string }`
- Logic:
  1. Update `intake_logs` row: `status = 'taken'`, `taken_time = now()`
  2. Decrement `medicines.current_stock` by `dosage_per_intake`
  3. Fetch all `push_subscriptions` for the patient's family members
  4. Send push: `"{patientName} took their {time} dose of {medicineName}"`

### `check-missed-doses`
- Trigger: `pg_cron`, every 15–30 minutes
- Logic:
  1. Query `intake_logs` where `status = 'pending'` and `scheduled_time + grace_period < now()` (grace period e.g. 30 min, configurable constant)
  2. Update matching rows to `status = 'missed'`
  3. For each, push to all family: `"{patientName} missed their {time} dose of {medicineName} — please check in"`

### `check-low-stock`
- Trigger: `pg_cron`, once daily
- Logic:
  1. For each medicine, compute `daysRemaining = current_stock / (dosage_per_intake * times_per_day.length)`
  2. If `daysRemaining <= refill_threshold_days` and `low_stock_alert_sent_at` is null or older than current refill cycle, push: `"{medicineName} will run out in {daysRemaining} days — time to refill"`, then set `low_stock_alert_sent_at = now()`
  3. Reset `low_stock_alert_sent_at` to null whenever `current_stock` is manually topped up above the threshold (handled in the Medicines Admin screen's update logic)

## 10. Scheduling (pg_cron)

```sql
select cron.schedule(
  'check-missed-doses',
  '*/15 * * * *',
  $$ select net.http_post(
       url := '<EDGE_FUNCTION_URL>/check-missed-doses',
       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
     ); $$
);

select cron.schedule(
  'check-low-stock',
  '0 8 * * *',   -- once daily at 8 AM
  $$ select net.http_post(
       url := '<EDGE_FUNCTION_URL>/check-low-stock',
       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
     ); $$
);
```

## 11. Environment Variables / Secrets Needed

Frontend (`.env`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`

Supabase Edge Function secrets:
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions to bypass RLS when reading all subscriptions)

## 12. Deployment Steps (for Claude Code to execute)

1. `supabase init`, link to the remote project (`supabase link`)
2. `supabase db push` — apply schema from section 5
3. `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...`
4. `supabase functions deploy log-intake check-missed-doses check-low-stock`
5. Run the `pg_cron` SQL from section 10 via `supabase db execute` or the SQL editor
6. `vercel --prod` (or Netlify equivalent) to deploy the frontend, with env vars set in the Vercel dashboard

## 13. Testing Checklist

- [ ] Mark a dose as taken → confirmation push received by all family members (Android + iOS)
- [ ] Leave a dose unmarked past the grace period → missed-dose push received
- [ ] Manually lower a medicine's stock below the 7-day threshold → low-stock push received, and not repeated the next day
- [ ] Top up stock → low-stock alert flag resets, will fire again if it drops low later
- [ ] iOS: confirm push only works when installed via Add to Home Screen, not in a Safari tab
- [ ] Confirm no `any`/`unknown` types anywhere via `tsc --noEmit`

## 14. Suggested Folder Structure

```
takecare/
  src/
    components/
    screens/
    lib/
      supabaseClient.ts
      types.ts
    sw.ts
  supabase/
    functions/
      log-intake/index.ts
      check-missed-doses/index.ts
      check-low-stock/index.ts
    migrations/
      0001_init.sql
  vite.config.ts
  tsconfig.json
```
