-- ============================================================================
-- PULSE (NRS TWG Initiative Tracker) — Core Schema
-- ============================================================================
-- Run this in the Supabase SQL editor, or via `supabase db push` if you're
-- using the CLI with migrations. Requires the pgcrypto extension for
-- gen_random_uuid() — enabled by default on Supabase projects.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

create type rag_status as enum (
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk'
);

create type l_gate as enum ('L0', 'L1', 'L2', 'L3', 'L4', 'L5');

create type user_role as enum ('admin', 'smo', 'workstream_lead');

-- ----------------------------------------------------------------------------
-- WORKSTREAMS
-- ----------------------------------------------------------------------------

create table workstreams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

comment on table workstreams is 'The 6 TWG workstreams (Tax Operations, Technical & Compliance, Technology, People/Stakeholder/Comms, Finance & Corporate Services, Strategic Initiatives).';

-- ----------------------------------------------------------------------------
-- PROFILES (extends Supabase auth.users — one row per person who can log in)
-- ----------------------------------------------------------------------------

create table profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null,
  email          text not null,
  role           user_role not null default 'workstream_lead',
  workstream_id  uuid references workstreams (id) on delete set null,
  created_at     timestamptz not null default now()
);

comment on table profiles is 'App-level identity. role=admin/smo can see and edit everything. role=workstream_lead is scoped to their own workstream_id via RLS.';
comment on column profiles.workstream_id is 'Required for workstream_lead; null for admin/smo (they are not scoped to one workstream).';

-- ----------------------------------------------------------------------------
-- INITIATIVES (the canonical, current-state register — 21 rows today)
-- ----------------------------------------------------------------------------

create table initiatives (
  id                    uuid primary key default gen_random_uuid(),
  workstream_id         uuid not null references workstreams (id) on delete restrict,
  title                 text not null,
  directorate_owner     text,
  l_gate_stage          l_gate,
  kpi_expected_impact   text,
  target                text,
  actual                text,
  status                rag_status not null default 'Not started',
  latest_update         text,
  decisions_needed      text,
  update_as_at          date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table initiatives is 'Current-state snapshot per initiative. Updated automatically from initiative_updates via trigger — do not edit latest_update/status/actual directly except as an admin correction.';
comment on column initiatives.target is 'Kept as text (not numeric) because targets are heterogeneous: percentages, currency, "TBD", composite figures like "100% / 100% / 500k hrs".';

create index idx_initiatives_workstream on initiatives (workstream_id);
create index idx_initiatives_status on initiatives (status);

-- ----------------------------------------------------------------------------
-- MILESTONES (nested under initiatives — structure ready, data pending
-- recovery of the 132-row register / deck extraction, per open gap)
-- ----------------------------------------------------------------------------

create table milestones (
  id                  uuid primary key default gen_random_uuid(),
  initiative_id       uuid not null references initiatives (id) on delete cascade,
  title               text not null,
  l_gate_stage        l_gate,
  directorate_owner   text,
  target_date         date,
  status              rag_status not null default 'Not started',
  challenges          text,
  upcoming_milestone  text,
  sequence            int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table milestones is 'Per-milestone detail under an initiative. Empty until the 132-row milestone register (or deck extraction) is loaded — see open data gap.';

create index idx_milestones_initiative on milestones (initiative_id);

-- ----------------------------------------------------------------------------
-- INITIATIVE_UPDATES (append-only submission log — this is what workstream
-- leads fill in fortnightly, replacing Pamela's manual compile)
-- ----------------------------------------------------------------------------

create table initiative_updates (
  id                 uuid primary key default gen_random_uuid(),
  initiative_id      uuid not null references initiatives (id) on delete cascade,
  submitted_by       uuid references profiles (id) on delete set null,
  meeting_date       date not null,
  status             rag_status not null,
  target             text,
  actual             text,
  latest_update      text not null,
  decisions_needed   text,
  created_at         timestamptz not null default now()
);

comment on table initiative_updates is 'Append-only. Every fortnightly submission is a new row — this is the audit trail Pamela''s old shared-PPT process never had. A trigger applies the newest row per initiative onto the initiatives table.';

create index idx_updates_initiative on initiative_updates (initiative_id, meeting_date desc);

-- ----------------------------------------------------------------------------
-- TRIGGER: apply latest submitted update onto the initiative snapshot
-- (mirrors what Power Automate Flow 1 was doing for the SharePoint register)
-- ----------------------------------------------------------------------------

create or replace function apply_initiative_update()
returns trigger
language plpgsql
security definer
as $$
begin
  update initiatives
  set
    status           = new.status,
    target           = coalesce(new.target, target),
    actual           = coalesce(new.actual, actual),
    latest_update    = new.latest_update,
    decisions_needed = new.decisions_needed,
    update_as_at     = new.meeting_date,
    updated_at       = now()
  where id = new.initiative_id
    and (update_as_at is null or new.meeting_date >= update_as_at);
  -- Note: this trigger applies whichever row lands last for a given
  -- meeting_date (>=, not >), so if you ever backfill two updates for the
  -- same date, insert them in the order you want to "win".
  return new;
end;
$$;

create trigger trg_apply_initiative_update
  after insert on initiative_updates
  for each row
  execute function apply_initiative_update();

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_initiatives_updated_at
  before update on initiatives
  for each row
  execute function set_updated_at();

create trigger trg_milestones_updated_at
  before update on milestones
  for each row
  execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- SUMMARY VIEW (replaces the formula-driven Summary sheet)
-- ----------------------------------------------------------------------------

create view workstream_summary as
select
  w.name as workstream,
  count(i.id) as initiatives,
  count(i.id) filter (where i.status = 'Not started')      as not_started,
  count(i.id) filter (where i.status = 'In progress')       as in_progress,
  count(i.id) filter (where i.status = 'Completed')         as completed,
  count(i.id) filter (where i.status = 'Delayed/at risk')   as delayed_at_risk
from workstreams w
left join initiatives i on i.workstream_id = w.id
group by w.name, w.sort_order
order by w.sort_order;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table workstreams enable row level security;
alter table profiles enable row level security;
alter table initiatives enable row level security;
alter table milestones enable row level security;
alter table initiative_updates enable row level security;

-- Helper: is the current user admin or smo?
create or replace function is_admin_or_smo()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'smo')
  );
$$;

-- Helper: current user's workstream_id
create or replace function my_workstream_id()
returns uuid
language sql
security definer
stable
as $$
  select workstream_id from profiles where id = auth.uid();
$$;

-- workstreams: everyone signed in can read; only admin/smo can write
create policy "workstreams readable by authenticated" on workstreams
  for select using (auth.role() = 'authenticated');
create policy "workstreams writable by admin/smo" on workstreams
  for all using (is_admin_or_smo()) with check (is_admin_or_smo());

-- profiles: users see their own row; admin/smo see everyone
create policy "profiles self read" on profiles
  for select using (id = auth.uid() or is_admin_or_smo());
create policy "profiles self update" on profiles
  for update using (id = auth.uid() or is_admin_or_smo());
create policy "profiles admin insert" on profiles
  for insert with check (is_admin_or_smo());

-- initiatives: everyone signed in can read; only admin/smo edit the snapshot directly
create policy "initiatives readable by authenticated" on initiatives
  for select using (auth.role() = 'authenticated');
create policy "initiatives writable by admin/smo" on initiatives
  for all using (is_admin_or_smo()) with check (is_admin_or_smo());

-- milestones: same pattern as initiatives
create policy "milestones readable by authenticated" on milestones
  for select using (auth.role() = 'authenticated');
create policy "milestones writable by admin/smo" on milestones
  for all using (is_admin_or_smo()) with check (is_admin_or_smo());

-- initiative_updates: everyone reads (audit trail is transparent);
-- workstream leads can only submit for initiatives in their own workstream;
-- admin/smo can submit for any initiative.
create policy "updates readable by authenticated" on initiative_updates
  for select using (auth.role() = 'authenticated');

create policy "updates insertable by owning lead or admin/smo" on initiative_updates
  for insert with check (
    is_admin_or_smo()
    or exists (
      select 1 from initiatives i
      where i.id = initiative_id
        and i.workstream_id = my_workstream_id()
    )
  );

-- updates are append-only by design: no update/delete policy is granted to
-- anyone except admin/smo, preserving the audit trail.
create policy "updates correctable by admin/smo only" on initiative_updates
  for update using (is_admin_or_smo());
create policy "updates deletable by admin/smo only" on initiative_updates
  for delete using (is_admin_or_smo());
