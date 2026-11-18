-- ============================================================================
-- 005: Self-service sign-up with admin approval, admin notifications,
--      and the gated Users section
-- ============================================================================
-- Why a new migration instead of editing 001-004: those already ran against
-- the live, reconciled TWG data. Editing them in place would silently
-- diverge what's on disk from what's actually in the database.
--
-- What this adds, and why:
--
-- 1. profiles.status — people can now create their own account (NRS email +
--    password) instead of an admin inserting a profiles row by hand. A new
--    account lands as 'pending' and CANNOT sign in until an admin approves
--    it. Existing profiles are backfilled to 'approved' so nobody who can
--    log in today is locked out by this migration.
--
-- 2. notifications — so a new sign-up reaches the admin even if they aren't
--    looking at the Users page. Rows are written server-side with the
--    service-role key (one row per admin), never by the signing-up user.
--
-- 3. app_settings — holds the hashed Users-section access code. Deliberately
--    NOT reachable by any RLS policy: service-role only. There is no
--    self-service "forgot the access code" flow by design (see CLAUDE.md
--    note / backend README) — it is reset from the backend with
--    `npm run users:set-code`, or by deleting the row below and setting a
--    fresh one.
--
-- Run this in the Supabase SQL editor, after 001-004.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACCOUNT APPROVAL STATE ON PROFILES
-- ----------------------------------------------------------------------------

create type account_status as enum ('pending', 'approved', 'rejected');

alter table profiles
  add column status account_status not null default 'pending',
  add column approved_at timestamptz,
  add column approved_by uuid references profiles (id) on delete set null,
  add column rejection_reason text;

-- Backfill: every profile that existed before self-service sign-up was
-- created by an admin by hand, so it is implicitly already approved.
update profiles
set status = 'approved',
    approved_at = coalesce(approved_at, created_at)
where status = 'pending';

comment on column profiles.status is 'Account approval state. ''pending'' accounts exist in auth.users but are refused at sign-in by the API until an admin approves them. New sign-ups default to ''pending''.';
comment on column profiles.approved_by is 'The admin who approved (or rejected) this account. Null for the original hand-created profiles backfilled by migration 005.';
comment on column profiles.rejection_reason is 'Optional note the admin leaves when rejecting an account request; surfaced to the admin in the Users section, not to the applicant.';

create index idx_profiles_status on profiles (status);

-- A pending account must not be able to read anything, even if it somehow
-- obtains a token. The API refuses non-approved accounts at sign-in and on
-- every token verification, but keep RLS aligned so the two can't drift:
-- replace the self-read policy with one that also requires approval.
drop policy if exists "profiles self read" on profiles;
create policy "profiles self read" on profiles
  for select using (
    is_admin_or_smo()
    or (id = auth.uid() and status = 'approved')
  );

-- Helper: is the current user an approved admin? (Narrower than
-- `is_admin_or_smo()` — only admins manage accounts.)
--
-- It has to be a SECURITY DEFINER function, not an inline subquery: a
-- policy ON profiles that itself selects FROM profiles sends Postgres into
-- "infinite recursion detected in policy for relation profiles". Same
-- reason 001 routed its own checks through helpers.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

-- Admins need to be able to hard-delete a profile from the Users section.
-- (The API does this with the service-role key, because deleting the
-- matching auth.users row requires it — but granting the policy keeps the
-- RLS model honest about who is allowed to do this.)
create policy "profiles admin delete" on profiles
  for delete using (is_admin());

-- ----------------------------------------------------------------------------
-- 2. NOTIFICATIONS (admin-facing; currently only "new account request")
-- ----------------------------------------------------------------------------

create table notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references profiles (id) on delete cascade,
  type          text not null,
  title         text not null,
  body          text,
  link          text,
  subject_email text,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

comment on table notifications is 'Per-recipient notification feed. Written server-side only (service-role key) — e.g. one row per admin when someone requests an account. Recipients can read and mark their own rows read; nothing else.';
comment on column notifications.type is 'Machine-readable kind, e.g. ''account_request''. Drives the icon/affordance the frontend renders.';
comment on column notifications.link is 'Optional in-app path the notification deep-links to, e.g. /users.';
comment on column notifications.subject_email is 'The account this notification is about, where applicable — kept denormalised so the notification still reads sensibly after the subject profile is deleted.';

create index idx_notifications_recipient on notifications (recipient_id, created_at desc);
create index idx_notifications_unread on notifications (recipient_id) where read_at is null;

alter table notifications enable row level security;

create policy "notifications readable by recipient" on notifications
  for select using (recipient_id = auth.uid());

-- Recipients may only flip read_at on their own rows. (Postgres has no
-- column-level RLS; the API only ever sets read_at, and nothing else here
-- is user-supplied, so this is the narrowest practical policy.)
create policy "notifications markable read by recipient" on notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "notifications deletable by recipient" on notifications
  for delete using (recipient_id = auth.uid());

-- No insert policy: notifications are created only with the service-role
-- key, which bypasses RLS. A signing-up user must not be able to forge one.

-- ----------------------------------------------------------------------------
-- 3. APP_SETTINGS (service-role only — holds the Users-section access code)
-- ----------------------------------------------------------------------------

create table app_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles (id) on delete set null
);

comment on table app_settings is 'Server-only key/value settings. RLS is enabled with NO policies, so only the service-role key can read or write — this table holds the hashed Users-section access code and must never be reachable from a user JWT.';
comment on column app_settings.value is 'For key=''users_section_access_code'': a scrypt hash in the form scrypt$<N>$<salt-hex>$<hash-hex>. Never a plaintext code. Set it with `npm run users:set-code` in backend/.';

alter table app_settings enable row level security;
-- Intentionally no policies. Service-role key only.

-- NOTE: no access-code row is seeded here on purpose. A hash has to be
-- computed by the API's scrypt parameters, and seeding a known default
-- would be a credential in version control. Until an admin runs
--     cd backend && npm run users:set-code
-- the Users section fails closed: the unlock endpoint returns 503 with a
-- message saying the code has not been configured yet.

-- ----------------------------------------------------------------------------
-- 4. KEEP THE RLS HELPERS IN STEP WITH THE APPROVAL GATE
-- ----------------------------------------------------------------------------
-- The API refuses a pending/rejected account at sign-in and on every token
-- verification, so in practice such an account never holds a usable session.
-- These two helpers (from 001) predate `status` though, and would happily
-- answer "yes, admin" for a rejected profile. Defence in depth: teach them
-- about approval so the database would hold the line on its own if the API
-- ever stopped doing so. Existing profiles were backfilled to 'approved'
-- above, so no current access changes.

create or replace function is_admin_or_smo()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'smo')
      and status = 'approved'
  );
$$;

create or replace function my_workstream_id()
returns uuid
language sql
security definer
stable
as $$
  select workstream_id from profiles
  where id = auth.uid() and status = 'approved';
$$;
