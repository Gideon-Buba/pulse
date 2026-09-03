# Pulse API

NestJS API in front of the Supabase backend for the NRS TWG Initiative Tracker.
See the root `CLAUDE.md` for full project context.

## Setup

```bash
npm install
cp .env.example .env   # then fill in SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
npm run start:dev
```

- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs
- Static OpenAPI contract (regenerated on every boot): `backend/openapi.json`

## Layout

- `src/supabase/` — `SupabaseService`, the only place `createClient` is called.
  Exposes an anon client (unauthenticated flows), a per-request client scoped
  to the caller's JWT (RLS-enforced — use this for everything user-facing),
  and a service-role client (admin-only, bypasses RLS).
- `src/types/database.ts` — copy of `../db/types.ts`. Keep in sync; regenerate
  both from the live schema with `supabase gen types typescript` once a
  project ref is available.
- `src/config/env.validation.ts` — fails fast on boot if Supabase env vars
  are missing, rather than invoking Supabase with placeholder values.
