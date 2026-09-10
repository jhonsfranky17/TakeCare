# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TakeCare is a single-patient medicine-adherence PWA. A patient/caregiver marks doses "Taken" in the app; server-side scheduled checks (not the client) detect missed doses and low stock and push notifications to every family member, on Android and iOS home-screen installs. Original spec: `docs/build-spec.md`. Visual design spec: `frontend-export/README.md` (see "Design system" below) — several product decisions (copy tone, color semantics, tap-target sizes) live there, not in the build spec.

Stack: Vite + React + TS (strict) frontend, Supabase (Postgres + Auth + Edge Functions + pg_cron) backend, Web Push via VAPID, deployed to Vercel (frontend) + Supabase (backend). No paid tiers anywhere — do not enable features that require a Supabase paid plan (e.g. `storage.analytics` / Iceberg catalog).

## Commands

```bash
npm run dev         # vite dev server
npm run build        # tsc --noEmit (main tsconfig) then vite build
npm run typecheck    # tsc --noEmit against BOTH tsconfig.json and tsconfig.sw.json
npm run lint          # eslint .
```

There is no test runner configured.

`typecheck`/`build` only cover `tsconfig.json` (the app, DOM lib) and `tsconfig.sw.json` (`src/sw.ts`, WebWorker lib — deliberately excluded from the app tsconfig because DOM and WebWorker lib types conflict). `supabase/functions/**` is Deno code and is checked separately with `deno check`/`deno lint`, not by anything in `package.json` — there's a `supabase/functions/deno.json` for that, and ESLint's flat config explicitly ignores `supabase/functions/**` for the same reason (no Deno globals in the Node/browser ESLint setup).

## Architecture

### Auth: no email, no login screen -- anonymous sign-in + "pick your name"

There is no email/password/magic-link flow anywhere in this app (there used to be; it was removed). `AuthContext.tsx` signs every device in with `supabase.auth.signInAnonymously()` automatically on first load, no user interaction -- this is a real Supabase session (`role: authenticated`, RLS applies normally), it's just not tied to an email. That anonymous session then has to *claim* one `family_members` row to identify itself:

- `family_members.auth_user_id` is **nullable** -- a row with `auth_user_id = null` is an unclaimed placeholder. There is exactly one way to create a `family_members` row: the Family screen's "Add someone to the family" form (name + relationship, no email, always unclaimed). `WhoAreYou` (the picker) deliberately has **no** way to create a row itself, only to claim one -- it used to also offer a free-text "not listed? add yourself" path, but two devices racing that independently is exactly what produced duplicate rows for the same real person (fixed by removing the path, not by de-duplicating after the fact).
- `App.tsx`'s `RequireAuth` renders `WhoAreYou` (not a route, just a conditional render) whenever the signed-in device hasn't claimed a row yet. It's a `<select>` of every unclaimed row's name + relationship, plus a "This is me" button that calls `AuthContext`'s `claimFamilyMember(id)` (an `UPDATE ... SET auth_user_id = <this device's uid> WHERE auth_user_id IS NULL`). If the list is empty, it tells the viewer to ask a family member to add them from the Family screen instead of offering a form.
- Once claimed, the device's session (in `localStorage`, same as any Supabase session) *is* the login. "Log out" (Family screen, `AuthContext`'s `logout()`) doesn't sign out of anything -- there's no email/password session to sign out of -- it **releases the claim** (`auth_user_id` back to `null`) and leaves the row in place. That's the only way "logging back in" can mean "re-pick the same row" instead of creating a new one: the row has to still exist, just unclaimed. `logout()` also cleans up that row's `push_subscriptions` first (both the DB row and the browser's own `PushManager` subscription via `unsubscribeFromPush` in `push.ts`) so a released row doesn't keep pushing to the device that gave it up.
- There is exactly one row in `patients` for the whole deployment (see spec §2 non-goals); `AuthContext` fetches it in parallel with the claim lookup. If `patients` is empty, `WhoAreYou` shows a static "ask whoever's setting up TakeCare" message instead of a form -- always make sure a patient row exists before testing auth end to end.

Two RLS consequences worth knowing: `family_members` is `select`-able by any authenticated (including not-yet-claimed anonymous) session with `using (true)` -- needed so the picker can show names before the viewer has claimed anything; this is a deliberate, low-sensitivity exposure (names/relationships only) matching what `patients_select_authenticated` already did. And claiming, self-editing, and releasing are three separate `UPDATE` policies rather than one trying to cover all three — Postgres RLS lets multiple permissive policies on the same command coexist and OR's their `USING`/`WITH CHECK` clauses, which is simpler here than one combined condition:
  - `family_members_claim`: `null` → `auth.uid()` (`using (auth_user_id is null)`)
  - `family_members_update_self`: `auth.uid()` → `auth.uid()` (editing your own row's other fields)
  - `family_members_release`: `auth.uid()` → `null` (logout)

Anywhere the app names "other family members" to explain who got notified (`Home`'s mark-taken toast, `MedicinesAdmin`'s low-stock nudge), it filters to `auth_user_id is not null` -- an unclaimed placeholder can't have a push subscription, so it can't have actually been notified.

### The migration adds two things the spec never actually created

`docs/build-spec.md` section 9 defines exactly 3 Edge Functions (`log-intake`, `check-missed-doses`, `check-low-stock`), all of which only *update* `intake_logs` rows. Nothing in the spec creates the `pending` row for each scheduled dose in the first place. `supabase/migrations/0001_init.sql` adds `generate_todays_doses()` (a plpgsql function, not an Edge Function) to do this, scheduled daily via pg_cron in `0002_cron.sql`. If doses aren't appearing on the Home screen, check this cron job ran, not the Edge Functions.

The same migration also adds a `my_patient_id()` SQL function (`SECURITY DEFINER`) that every RLS policy calls to resolve "the patient this user belongs to." It's `SECURITY DEFINER` specifically to read `family_members` without recursing through that table's own RLS policy (which itself calls `my_patient_id()`).

Later migrations: `0003` tightened the missed-dose check from a 30-min grace period / 15-min sweep to a 15-min grace period / 5-min sweep (both matter together — a short grace period masked by an infrequent sweep buys nothing). `0004` added `family_members.relationship`. `0005` added `medicines.notes` (optional, shown on both the Medicines list and today's dose card). `0006` replaced email auth with the anonymous-sign-in "pick your name" flow described above, and unclaimed every row that existed under the old flow (names/relationships preserved) since their `auth_user_id`s pointed at email identities that no longer mean anything. `0007` added the `family_members_release` policy that logout depends on.

### RLS: client never mutates `intake_logs` directly

`intake_logs` has a `SELECT`-only RLS policy for authenticated users. All writes to it (`status`/`taken_time` on mark-as-taken or undo, `status='missed'` on the cron sweep) happen inside Edge Functions using the service-role key, which bypasses RLS. The frontend always goes through `supabase.functions.invoke("log-intake", { body: { intakeLogId, action } })` — `action` is `"taken"` (default) or `"undo"` — never `supabase.from("intake_logs").update(...)`.

### Cron auth: Vault, not a hardcoded secret

`0002_cron.sql`'s `net.http_post` calls read the service-role key from Supabase Vault at execution time (`vault.decrypted_secrets`), not from the migration file — the key is never committed. Before the cron jobs will actually authenticate, someone has to run this once in the SQL editor (not in a migration):
```sql
select vault.create_secret('<service-role-key>', 'service_role_key');
```
`SUPABASE_SERVICE_ROLE_KEY` itself is a reserved name auto-injected into every Edge Function's env — never `supabase secrets set` it.

### Env var split

`.env` at the repo root deliberately mixes two audiences on one file:
- `VITE_*` — bundled into client JS by Vite. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` belong here.
- everything else (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`) is server-only — used for Edge Function secrets / CLI operations, never imported from `src/`.

`src/vite-env.d.ts` declares the `ImportMetaEnv` shape for the `VITE_*` set. To point the frontend at a local Supabase stack instead of production (e.g. to test an Edge Function change against real request/response flow), create `.env.local` with `VITE_SUPABASE_URL=http://127.0.0.1:54321` and the local anon key from `supabase status` — Vite picks it up automatically and it's gitignored. Delete it when done; there's no code-level indicator of which backend the frontend is pointed at.

### `supabase-js` typing gotcha: `type`, never `interface`

`src/lib/types.ts`'s `Database` type (and every row type it references — `Patient`, `Medicine`, `IntakeLog`, etc.) must be declared with `type`, not `interface`. With the `@supabase/supabase-js`/`@supabase/postgrest-js` versions pinned here, an `interface`-typed `Row` silently breaks the generic inference used by `.insert()`/`.update()` — TS reports the argument type as `never`/`never[]` with no indication why. If you add a table and insert/update calls start rejecting valid objects with a `never[]` error, check this first. Each table entry also needs an explicit `Relationships: Relationship[]` field (even if empty) — omitting it causes the same failure mode.

### Theme override: `src/lib/theme.ts`, stamped in three places

`tokens.css` already themes via `prefers-color-scheme`; the light/dark toggle on the Family screen (`ThemeToggle.tsx`) layers an explicit override on top, stored in `localStorage["tc-theme"]` as `"light" | "dark" | "system"`. Because that override has to apply before first paint in three different contexts that don't share code, the same key gets read three separate times: `index.html`'s inline `<script>` (before the static splash renders), `main.tsx`'s `initTheme()` call (before React's first render), and `ThemeToggle`'s own `resolveIsDark()` (to show the right icon on mount). If you ever rename the storage key, all three need the edit, not just `theme.ts`.

### Design system: `frontend-export/` is the source, `src/ui/` + `src/styles/tokens.css` is the integration

`frontend-export/` is a standalone reference build (mock data, no Supabase) delivered as the approved visual design — colors, type scale, copy tone, and every screen's exact layout live there, documented in its own `README.md`. It is **not** wired to the backend and isn't part of the shipped app; don't import from it at runtime. The real screens (`src/screens/*.tsx`) reimplement that layout against live Supabase data, converting real rows into the *view-model* shapes in `src/ui/viewTypes.ts` (`Dose`, `ViewMedicine`, etc. — deliberately distinct from the DB row types in `src/lib/types.ts`) immediately before rendering. `src/ui/*` (`Button`, `DoseCard`, `StatusBadge`, `StockBar`, `Toast`, `icons.tsx`) and `src/styles/tokens.css` were copied over close to verbatim; `src/TakeCareLogo.tsx` and `public/icons/*` likewise (there's a duplicate, byte-identical copy of the brand assets under `public/icons/brand/` — leave it, it's not consumed by the build). When the design changes, re-diff against `frontend-export/`, don't invent variations.

Two real bugs surfaced integrating this design under this repo's strict TS config, both in `src/ui/icons.tsx`: a custom `d: string[]` prop and a custom `width` prop each collided with the same-named attributes `SVGProps<SVGSVGElement>` already provides (React's `SVGAttributes` includes `d`/`width` as generic presentation attributes on every SVG element type, not just the ones that use them) — TS silently resolved the intersection to a type nothing could satisfy. Renamed to `paths`/`strokeW` internally. Any new SVG icon prop should avoid colliding with a real SVG/HTML attribute name for the same reason, even where it wouldn't otherwise make sense on that element.

Some real data doesn't map cleanly onto the design's mock shapes: `ViewMedicine.stockCapacity` (used only to size the stock progress bar) is estimated as `3 × refill_threshold_days × dailyDoses` since the schema never stored an original pack size; `Family` shows a generic "Family member" fallback for rows with no `relationship` set (pre-onboarding-flow rows) rather than fabricating one.

### Loading state: two copies, kept in sync by hand

`src/components/LoadingScreen.tsx` (the pulse-mark loading indicator, shown by every screen's own `loading` branch and by `App.tsx`'s auth-check gate) has a twin in `index.html` (`#tc-splash`) — inline SVG with hardcoded colors, since it has to paint before any JS or `tokens.css` has loaded, covering the gap on a cold PWA launch. `main.tsx` removes `#tc-splash` via `requestAnimationFrame` right after the first React render; because the two look identical, the handoff is invisible. If the mark's geometry or animation ever changes, both copies need the edit — there's no shared source between them by design (the splash can't import React/CSS-in-JS).

### Nested-flex `min-width` gotcha (already fixed once, watch for it elsewhere)

A flex item's `min-width` defaults to `auto`, which resolves to its content's min-content size — for an item that is *itself* a flex container (e.g. a labeled `<input>` wrapped in a `flex:1` column div inside a `flex` row), setting `min-width: 0` on the leaf input is **not enough**; the wrapping div also needs `minWidth: 0` explicitly, or it won't shrink below its own content's natural width and silently overflows its row. `tokens.css` sets `input { min-width: 0 }` globally, but that only fixes the leaf; every `flex: 1` wrapper that can contain long/wide content (see the two-column row in `AddMedicineSheet.tsx`) needs its own `minWidth: 0`. Also global in `tokens.css`: `* { box-sizing: border-box }` and `body { overflow-wrap: break-word }` (the latter because a single long unbroken word — a real medicine or patient name — has no break opportunity otherwise, and silently overflows past the app shell's `overflow: hidden`).

### `toLocaleTimeString` needs `hour12: true` explicitly

Every dose-time display (`src/lib/format.ts`'s `formatTime`, and the push-notification body text in `log-intake`/`check-missed-doses`) passes `hour12: true` explicitly. Without it, `toLocaleTimeString([], {...})` silently follows the runtime's locale default, which is 24-hour on plenty of real devices/browsers — and since `StatusBadge`'s "Due" label does string surgery on the formatted time (stripping a literal `:00`), a 24h string breaks that too, not just the display.

### Service worker: `injectManifest`, not `generateSW`

`vite.config.ts` uses `vite-plugin-pwa` in `injectManifest` mode because push notifications need custom `push`/`notificationclick` handlers (`src/sw.ts`), which the default `generateSW` strategy doesn't support. `src/sw.ts` is excluded from the main `tsconfig.json` (see Commands section) and precached via `self.__WB_MANIFEST` + `workbox-precaching`.

### Deployment state

- Supabase project ref: `ovbnrofebdfkoabemkvg` (linked via `supabase link`).
- Vercel project: `jhonsfranky17s-projects/takecare`, production URL `https://takecare-steel.vercel.app`.
- GitHub remote: `origin` → `git@github.com:jhonsfranky17/TakeCare.git`. Nothing has been pushed there yet as of this writing — the repo has commits pending, not yet made.
- Supabase Auth's `site_url`/`additional_redirect_urls`/email-related settings (rate limits, SMTP) are leftover from the removed email flow and no longer affect anything the app does — `enable_anonymous_sign_ins = true` is the only auth setting the current flow depends on.

**Careful with `supabase config push`**: it pushes the *entire* `supabase/config.toml`, not just the field you changed. The file still carries several `supabase init` local-dev defaults (shorter email rate limits, disabled email confirmation, disabled MFA, etc.) that are *not* what's live in production — always run `supabase config diff` first and check every field it would change, not just the one you intended.
