# Spartan League 2

Hosted PWA rebuild of the Spartan League 2 cricket league manager. See `../spartan-league-2.jsx`
(the original claude.ai artifact) for the feature/scoring spec this is being ported from, and
`DEPLOY.md` for how to set up the free accounts this needs.

## Status

Data layer, business logic, and Supabase backend are built and verified (`npm run build` passes,
`npm run dev` renders correctly). Tab UIs beyond navigation are being built out phase by phase —
each placeholder tab says what's coming.

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

## Project layout

- `src/lib/` — pure business logic (scoring, NRR, records, CSV stats import) ported verbatim
  from the original artifact, plus the Supabase/photo/export helpers that replace `window.storage`
- `src/hooks/` — `useSeasonData` (live season document + realtime), `useAdmin` (PIN-based admin session)
- `src/components/layout`, `src/components/shared` — theme-matched UI primitives
- `src/components/tabs/*` — one folder per app tab
- `supabase/migrations/0001_init.sql` — database schema + row-level security policies
- `supabase/functions/admin-login/` — Edge Function that turns a correct PIN into an admin session
