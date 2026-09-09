# TakeCare — front-end export for Claude Code

Real React + TypeScript source for all five screens, matching the approved mockups
(`TakeCare.dc.html` in this project) pixel-for-pixel. No CSS framework, no npm additions:
every value is either an inline style object or a token from `styles/tokens.css`.

## Drop-in

```
cp -r frontend-export/src/* <repo>/src/
```

Then in `src/main.tsx`:

```ts
import './styles/tokens.css';
```

and render `<TakeCareApp />` (from `src/TakeCareApp.tsx`) inside your existing
`AuthContext`/router. It ships with mock data so it runs standalone first.

## Wiring to the real backend

`src/data/mockData.ts` is the ONLY place fake data lives. Replace each export with a Supabase
query and the screens need no changes:

| Mock | Real source |
|---|---|
| `todaysDoses` | `intake_logs` joined to `medicines`, `scheduled_time::date = today` (rows are created by `generate_todays_doses()` via pg_cron — if the list is empty, check the cron job, not the Edge Functions) |
| `historyDays` | same table grouped by `scheduled_time::date desc` |
| `medicines` | `medicines` for `my_patient_id()` |
| `familyMembers` | `family_members` |

`onMarkTaken` must go through the Edge Function, never a direct table write — `intake_logs` is
SELECT-only under RLS:

```ts
await supabase.functions.invoke('log-intake', { body: { intake_log_id: id } });
```

Missed doses and low stock are decided server-side (`check-missed-doses`, `check-low-stock`);
the client only renders the status it is given.

## File map

```
src/
  TakeCareApp.tsx          app shell: screen state, bottom tab bar, toast host
  TakeCareLogo.tsx         inline mark / wordmark (direction A)
  screens/
    LoginScreen.tsx        magic-link entry
    HomeScreen.tsx         today's doses — the primary screen
    HistoryScreen.tsx      past doses grouped by day
    MedicinesScreen.tsx    medicine list + stock bars
    AddMedicineSheet.tsx   bottom sheet form
    FamilyScreen.tsx       notification recipients
  ui/
    Button.tsx             primary 64px CTA, secondary, amber recovery, dark
    DoseCard.tsx           pending / taken / missed card
    StatusBadge.tsx        icon + word + weight badge
    StockBar.tsx           stock progress + low-stock nudge
    Toast.tsx              "family notified" confirmation
    icons.tsx              stroke icon set
  data/
    types.ts  mockData.ts
  styles/tokens.css
```

## Non-negotiables from the design

1. `Mark as Taken` is 64px tall, lima 400, and the loudest element on any screen it appears on.
2. Status = icon + word + font weight. Colour is the third signal; never the only one.
3. Missed / low stock use the amber tokens (`--tc-warn-*`). Never red.
4. Nothing interactive below 48px.
5. Copy stays warm and non-clinical ("This one slipped by. No harm done.").
6. Bottom tab bar has 26px of bottom padding for the iOS home indicator; it never scrolls away.
