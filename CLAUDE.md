# Pulse — NRS TWG Initiative Tracker

## What this is

Pulse replaces a manual, shared-PowerPoint fortnightly reporting process for the
Transformation Working Group (TWG) at the Nigeria Revenue Service (NRS). The TWG
reviews transformation initiatives across the Group Director of Transformation &
Strategy's office. Gideon (Strategic Management Office) owns this build; Linda
Adole is his manager; Pamela previously compiled TWG materials manually — Pulse
is what replaces that.

**Your job in this session:** build a NestJS API in front of the Supabase
backend described below. The database schema, RLS policies, and seed data are
already live in Supabase — do not redesign them without checking with Gideon
first, they were built and reconciled against real TWG data over several
sessions.

## Hard constraints

- **Node.js + NestJS.** Strictly typed TypeScript throughout — no `any`, no
  implicit loosening of `strict` in `tsconfig.json`.
- Gideon is a problem solver, not just a developer — he wants working,
  deployable output, not scaffolding for its own sake. Ship things that run.
- Don't touch the SQL schema/data casually. If a change is needed, write a new
  numbered migration file (`004_*.sql` etc.) rather than editing `001`–`003`,
  and explain why before running it.
- **Every endpoint must be documented in Swagger UI** — see the dedicated
  section below. This isn't optional polish; Gideon needs a browsable API
  reference he can point colleagues at, not just working routes.

## Repo structure: monorepo, but you're only building the backend

Frontend and backend live in one project. **You are not building the
frontend.** Once the API is stable and documented, Gideon will point Lovable
at it to generate the UI separately — Lovable consumes the API contract
directly rather than a human wiring up fetch calls by hand. Practically:

- Put the NestJS app in `backend/` (or `apps/api/` if you set up an Nx/Turborepo-
  style layout — plain `backend/` + `frontend/` is fine too, don't over-engineer
  the monorepo tooling for a two-app repo).
- Leave a `frontend/` directory as a placeholder (README stub is enough) —
  don't scaffold a frontend app, don't add a frontend framework, don't build
  UI. That's out of scope here and will just be replaced by whatever Lovable
  generates.
- This raises the bar on the Swagger work below: since Lovable will read the
  API contract instead of a person reading your code, the spec needs to be
  complete and accurate enough to build against unsupervised — vague
  summaries or missing DTOs become Lovable's problem downstream, not
  something a human dev would just infer from context.

## Current state (already done, do not redo)

Supabase project is live. Three migrations have been run, in order, via the
Supabase SQL editor (not yet via CLI/migration tooling — that's fair game to
set up now):

1. `001_schema.sql` — tables, enums, RLS, the `apply_initiative_update`
   trigger, the `workstream_summary` view.
2. `002_seed.sql` — 6 original workstreams, 21 initiatives (initiative-grain
   snapshot as at the 4 Aug 2026 TWG).
3. `003_reconciliation.sql` — added a 7th workstream (Research & Statistics
   Department, 3 initiatives), submitted Aug 18 2026 status updates for all 21
   original initiatives via `initiative_updates` (the trigger applied them
   onto `initiatives`), and loaded 134 `milestones` rows sourced directly from
   the Aug 18 TWG deck (visually verified slide-by-slide against rendered
   images, not OCR/text-scraped).

Verified counts: 24 initiatives, 7 workstreams, 134 milestones.

`types.ts` (included in this handoff) is a hand-authored strict TS mirror of
the schema, structured for `createClient<Database>(url, key)`. Prefer
regenerating it once you have a project ref: `supabase gen types typescript
--project-id <ref> > src/types/database.ts` — but keep the shape identical,
other code will depend on it.

## Schema reference

| Table                       | Purpose                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workstreams`               | 7 rows. The TWG's organizational groupings.                                                                                                                                             |
| `profiles`                  | Extends `auth.users`. `role`: `admin` \| `smo` \| `workstream_lead`. Leads are scoped to one `workstream_id`.                                                                           |
| `initiatives`               | Current-state snapshot, 24 rows. **Do not write to this table directly except as an admin correction** — it's maintained by the trigger below.                                          |
| `milestones`                | Nested under initiatives, 134 rows. Structure only — `directorate_owner` is empty everywhere (real data gap, see below).                                                                |
| `initiative_updates`        | Append-only fortnightly submission log. **This is the table workstream leads write to.** A trigger (`apply_initiative_update`) copies the newest row per initiative onto `initiatives`. |
| `workstream_summary` (view) | Formula-free replacement for the old Excel Summary sheet — counts by status per workstream.                                                                                             |

RLS is already enforced: `workstream_lead` can only `insert` into
`initiative_updates` for initiatives in their own workstream; `admin`/`smo`
can read/write everything; everyone authenticated can read.

## What "workstream leads submit updates directly" means for the API

This was Gideon's explicit design decision (replacing Pamela's manual
compile): leads don't edit `initiatives` — they submit a new row to
`initiative_updates` each fortnight, and the trigger promotes the latest one.
Any "submit my TWG update" endpoint should insert into `initiative_updates`,
never `UPDATE initiatives` directly. Keep this append-only — no update/delete
exposed to leads (RLS already blocks it, but don't build API routes that try
to work around that for leads; admin/smo correction routes are fine).

## Auth: start simple, but build it so SSO is a swap-in later

**Decision:** NRS runs Microsoft 365, so the eventual workspace SSO is almost
certainly Entra ID (Azure AD) via SAML or OIDC. Supabase supports SAML 2.0 SSO,
but it's a paid-tier feature that needs Entra-side admin approval — Gideon is
pursuing that separately and it will take time. **Don't block on it.**

For now, use Supabase's built-in email/password (or magic link — Gideon's
call, ask him) auth so people can actually log in and start using the app.
But structure the auth layer so swapping to SSO later doesn't touch the rest
of the codebase:

- Put all Supabase Auth calls behind a single `AuthService` with a narrow
  interface (`signIn`, `signOut`, `getSession`, `verifyToken` — whatever the
  app actually needs). Controllers and guards should depend on this interface,
  never call `supabase.auth.*` directly.
- The `profiles` table is already the source of truth for role/workstream
  scoping, decoupled from _how_ someone authenticated. When SSO lands, a new
  Entra user just needs a `profiles` row like anyone else — no schema change.
- When Supabase SSO is approved, the swap is: enable it in the Supabase
  dashboard, change the sign-in flow the frontend calls, keep `AuthService`'s
  interface identical. If you find yourself needing to change call sites
  outside `AuthService` to make SSO work, the abstraction wasn't cut in the
  right place — fix that now while it's cheap, not later.
- Don't build anything Entra/SAML-specific yet. There's nothing to integrate
  against until the admin approval comes through — premature SSO code is just
  another thing to maintain against a moving target.

## Accounts and the Users section (built after the auth section above)

The "start simple" email/password auth described above is now fleshed out
into self-service sign-up with admin approval. `AuthService` is still the
only seam over Supabase Auth, so the Entra ID swap story is unchanged — but
`signUp`/`requestPasswordReset`/`resetPassword` are email/password-era
operations that the directory will own under SSO, which is exactly why they
live behind that interface too.

Migration: `db/005_user_accounts.sql` (run after 001-004). Decisions worth
not re-litigating:

- **Only `@nrs.gov.ng` emails can sign up** (`backend/src/auth/nrs-email.ts`),
  e.g. `john.lewis@nrs.gov.ng`. Enforced on sign-up and password reset, **not**
  on sign-in — the profiles seeded before this rule existed must keep working.
- **`profiles.status`** is `pending` | `approved` | `rejected`. A new sign-up
  is `pending`: the account exists in `auth.users` but is refused at sign-in
  *and on every token verification*, so revoking access is immediate rather
  than waiting for a token to expire. Migration 005 backfills every existing
  profile to `approved`.
- **The admin sets role and workstream at approval time.** Sign-up asks for
  name, email and password only — nobody chooses their own privileges. A lead
  must have exactly one workstream; admin/smo must have none, and the API
  keeps that pairing consistent on every role change.
- **Every admin gets a `notifications` row** when someone requests access, so
  an approval can't sit unseen. Rows are written with the service-role key;
  RLS grants no insert policy, so a signing-up user can't forge one.
- **`POST /auth/forgot-password` 404s for an unknown address** rather than
  silently succeeding. Deliberate: on a closed internal tool where every
  address is a predictable `firstname.lastname@nrs.gov.ng`, telling someone
  "there is no account here" beats letting them wait for an email that was
  never coming. It needs Supabase SMTP to deliver; where that isn't
  configured, `POST /admin/users/:id/reset-link` generates a link the admin
  hands over directly.
- **The Users section needs three independent things**: an approved session,
  the `admin` role, and a short-lived access-code ticket. Being able to sign
  in to Pulse is deliberately not enough to approve or delete accounts.
- **The access code has no "forgot" flow, on purpose.** It is scrypt-hashed
  in `app_settings` — a table with RLS on and *no policies*, so only the
  service-role key can touch it. Rotate it in the UI with the current code,
  or reset it from the server with `cd backend && npm run users:set-code`.
  Don't add a self-service reset: it would make the second lock worth as much
  as the first.
- **Deleting a user is a real delete** of the `auth.users` row (profiles
  cascades), but the append-only TWG history survives:
  `initiative_updates.submitted_by` is `on delete set null`. The API refuses
  to delete or demote the last approved admin, or the caller's own account.
- `src/users/` uses the service-role client throughout. That is the exception
  CLAUDE.md warns about, taken knowingly: it has to reach `auth.users`, and
  it has to *see* pending/rejected profiles that RLS hides even from their
  own owner. Authorization lives in the three guards in front of it.

## Swagger UI — required, not optional

Install `@nestjs/swagger` and `swagger-ui-express`. In `main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle("Pulse API")
  .setDescription("NRS TWG Initiative Tracker")
  .setVersion("1.0")
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup("api/docs", app, document);
```

Requirements for every module you build:

- Every controller gets `@ApiTags('workstreams')` (etc.).
- Every route gets `@ApiOperation({ summary: '...' })` describing what it
  does in plain language — Gideon and non-technical colleagues will read
  this, not just other developers.
- Every DTO (request bodies and response shapes) gets `@ApiProperty()` on
  each field, with `description` where the field name isn't self-evident
  (e.g. `meeting_date` should say it's the TWG meeting this update is for).
- Auth-protected routes get `@ApiBearerAuth()` so the "Authorize" button in
  the Swagger UI actually works for manual testing.
- Document error responses that matter — e.g. a 403 when a workstream lead
  tries to submit an update for an initiative outside their workstream.

Generate DTOs as real classes (not inline types) specifically because
`@nestjs/swagger` reads decorators off classes — this also gets you
`class-validator` request validation for free if you add it, which you
should.

**Export the OpenAPI spec as a static file, not just the live UI.** Add a
small script (or a `main.ts` flag) that writes the generated document to
`backend/openapi.json`:

```typescript
import { writeFileSync } from "fs";
// after SwaggerModule.createDocument(...)
writeFileSync("./openapi.json", JSON.stringify(document, null, 2));
```

This is the file Gideon hands to Lovable as the API contract — Lovable may
not always be able to crawl a live `/api/docs` page (depends on whether the
API is deployed and reachable when he's prompting it), but a static spec
file is guaranteed to work. Regenerate it whenever the API shape changes, and
treat a stale `openapi.json` as a bug, not a nitpick — Lovable will build
against whatever it's given, wrong or not.

## Suggested NestJS module shape (adjust as you see fit, this isn't gospel)

- `AuthModule` — see Auth section above. Wraps Supabase Auth behind a stable
  interface.
- `WorkstreamsModule` — read-only list/detail + the summary view.
- `InitiativesModule` — read (list/detail, filter by workstream/status),
  admin-only correction endpoint.
- `MilestonesModule` — read, nested under initiatives.
- `UpdatesModule` — the core write path: `POST /initiatives/:id/updates` for
  leads, scoped by their `workstream_id` from the JWT — mirror the RLS logic
  in a guard so bad requests fail fast with a clear 403 rather than an
  opaque Postgres RLS error.
- Use the Supabase service-role key **only** server-side for genuinely
  privileged operations (e.g. admin bulk corrections); everything else should
  go through the user's own JWT so RLS does the enforcement — don't
  reimplement authorization logic that RLS already guarantees, or the two can
  drift out of sync.

## Known data gaps — do not silently paper over these

- **`directorate_owner` is empty on every initiative and milestone.** This has
  been a known gap since before Pulse existed (same issue on the old
  SharePoint register). Don't backfill with guesses.
- **`milestones.target_date` is approximate** — parsed from month-level deck
  labels (e.g. "Aug-26" → first of month) except where the deck gave an exact
  day. Don't present these as precise due dates in any UI without a caveat.
- **PMF redesign initiative**: the Aug 4 TWG minutes said Management had
  approved the PMF design; the Aug 18 deck said approval was still pending.
  Gideon's call was to trust the newer deck (approval pending) — this is
  already reflected in the seed data, just noting the provenance in case it
  comes up again with fresher data.

## Environment

You'll need from Gideon (don't invent placeholders and ship them):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (client-facing)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to the frontend)

## Immediate next steps, roughly in order

1. Scaffold the NestJS project (`nest new`, strict TS config, ESLint/Prettier
   matching Gideon's usual setup if he has a preference).
2. Wire up `@nestjs/swagger` immediately — do this before building modules,
   not after, so every route you write from the start is documented.
3. Wire up the Supabase client with `types.ts` for full type safety.
4. Build the `AuthService` abstraction (email/password or magic link) before
   any protected route depends on it.
5. Build read endpoints first (workstreams, initiatives, milestones,
   summary) — lowest risk, immediately useful for the dashboard migration.
6. Build the auth guard + the `initiative_updates` submission endpoint —
   this is the actual Pamela-replacement feature, so get it right.
7. Once the API's up and `openapi.json` is current, hand it to Lovable to
   build the frontend against — that's a separate workflow outside this
   session, not something to start here.

Note: the old HTML/SheetJS dashboard is superseded by this plan — Lovable
building against the API replaces the earlier idea of migrating that
dashboard's data source. No need to touch the old dashboard file.

## Files included in this handoff

- `001_schema.sql`, `002_seed.sql`, `003_reconciliation.sql` — already run,
  included for reference/reproducibility.
- `types.ts` — strict TS types matching the live schema.
