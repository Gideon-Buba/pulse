# Pulse Frontend

React + Vite + TypeScript + Tailwind v4 + shadcn/ui, themed in NRS red/white/gray.
Talks to the NestJS API in `../backend`.

## Setup

```bash
npm install
cp .env.example .env.local   # only needed if the API isn't on the default localhost:3000
npm run dev
```

- App: http://localhost:5173
- Requires the backend running (`cd ../backend && npm run start:dev`)

## Layout

- `src/pages/` — route-level pages (dashboard, workstreams, initiatives list/detail, login)
- `src/components/layout/` — sidebar, topbar, mobile nav, app shell
- `src/components/ui/` — shadcn/ui primitives (button, card, table, dialog, etc.)
- `src/lib/api.ts` + `src/lib/api-client.ts` — typed fetch wrapper against the backend's
  OpenAPI contract (`../backend/openapi.json`), bearer token from `localStorage`
- `src/context/auth-context.tsx` — session state, login/logout
- `src/types/api.ts` — hand-written types matching the backend DTOs (kept in sync manually;
  regenerate against `openapi.json` if the API shape changes)

## Role-based UI

- Any authenticated user: read everything (dashboard, workstreams, initiatives, milestones,
  update history)
- `workstream_lead`: additionally sees "Submit update" on initiatives in their own workstream
- `admin` / `smo`: sees "Submit update" on every initiative, plus "Correct" (direct snapshot
  edit, bypasses the normal fortnightly flow)
