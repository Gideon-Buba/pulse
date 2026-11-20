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
- Static OpenAPI contract: `backend/openapi.json` — rewritten on every boot,
  and regenerable without credentials or a free port via `npm run openapi`.
  Run it after any DTO/route change; a stale spec is a bug, not a nitpick.

## Accounts: sign-up, approval, and the Users section

Run `db/005_user_accounts.sql` in the Supabase SQL editor (after 001-004).
Make sure at least one profile has `role = 'admin'` — only admins can open
the Users section.

How the pieces fit:

- **Sign-up** (`POST /auth/signup`) accepts only `@nrs.gov.ng` addresses and
  creates the account as `status = 'pending'`. No session is returned, and
  `signIn`/`verifyToken` refuse pending and rejected accounts — checked on
  *every* request, so revoking access takes effect immediately rather than
  when a token happens to expire.
- **Approval** is an admin's decision, and so are the role and workstream:
  sign-up never lets anyone pick their own privileges. Every admin gets a
  `notifications` row when a request arrives, so one can't sit unseen.
- **Password reset** (`POST /auth/forgot-password`) deliberately 404s for an
  address with no Pulse account instead of silently succeeding. It needs
  Supabase SMTP to actually deliver; where that isn't configured,
  `POST /admin/users/:id/reset-link` generates a one-time link for the admin
  to hand over directly.
- **The Users section** is admin-only: an approved session plus the `admin`
  role, both checked on every request. There is no second password.

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
- `src/auth/` — `AuthService` is the single seam over Supabase Auth (see
  CLAUDE.md on the eventual Entra ID swap). `nrs-email.ts` holds the
  `@nrs.gov.ng` rule, applied to sign-up and password reset but not to
  sign-in, so profiles that predate the rule keep working.
- `src/users/` — the admin-only Users section.
- `src/notifications/` — per-recipient feed; rows are written service-role
  side only, so nobody can forge one.
- `src/openapi.ts` — one definition of the OpenAPI document, used by both
  `main.ts` and `scripts/generate-openapi.ts`.
