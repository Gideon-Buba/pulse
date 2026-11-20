-- ============================================================================
-- 006: Milestone-level entries on fortnightly updates
-- ============================================================================
-- Why: workstream leads don't report on an initiative in the abstract — at
-- each TWG they speak to the milestone the initiative is currently on, and
-- often to other milestones too. initiative_updates had no way to record
-- that, so the update history couldn't show how any one milestone moved
-- between meetings. This adds:
--
--   1. initiative_update_milestones — append-only child rows of an update,
--      one per milestone the lead reported on (status + note + challenges),
--      with exactly one optionally flagged as "the current milestone".
--   2. Triggers that (a) validate the milestone belongs to the update's
--      initiative and snapshot its title + prior status, and (b) promote the
--      newest entry's status/challenges onto `milestones` — the same pattern
--      apply_initiative_update already uses for `initiatives`.
--   3. submit_initiative_update(...) — one RPC that writes the update and its
--      milestone entries in a single transaction, so a submission can never
--      half-land. SECURITY INVOKER: the caller's own RLS still applies.
--   4. get_submitter_names(...) — profiles RLS only lets a workstream lead
--      read their own row, so a lead viewing history couldn't see who else
--      submitted. This exposes id/full_name/role only (never email) to
--      authenticated users.
--
-- Why milestone_id is ON DELETE SET NULL (not CASCADE): milestones are
-- hard-deleted by admins. Before this migration that was harmless; now a
-- milestone has history hanging off it, and cascading would silently erase
-- past TWG submissions. milestone_title is snapshotted at submission time so
-- the history still reads correctly after a delete or rename.
--
-- Run this in the Supabase SQL editor, after 001-004.
-- (Originally numbered 005; renumbered after upstream added 005_user_accounts.
-- Already applied to the live database. Read-access fix is in 007.)
-- ============================================================================

create table initiative_update_milestones (
  id               uuid primary key default gen_random_uuid(),
  update_id        uuid not null references initiative_updates (id) on delete cascade,
  milestone_id     uuid references milestones (id) on delete set null,
  milestone_title  text not null,
  is_current       boolean not null default false,
  previous_status  rag_status,
  status           rag_status not null,
  note             text,
  challenges       text,
  created_at       timestamptz not null default now(),
  unique (update_id, milestone_id)
);

comment on table initiative_update_milestones is 'Append-only. Per-milestone detail a lead reported as part of one initiative_updates submission. The newest entry per milestone is promoted onto milestones.status/challenges by trigger.';
comment on column initiative_update_milestones.milestone_title is 'Snapshot of the milestone title at submission time (set by trigger) so history survives a milestone being renamed or deleted.';
comment on column initiative_update_milestones.is_current is 'True for the milestone the lead identified as the one the initiative is currently on. At most one per update.';
comment on column initiative_update_milestones.previous_status is 'The milestone''s status immediately before this entry was applied (set by trigger) — lets history show transitions like In progress -> Delayed/at risk.';

create unique index uq_update_milestones_one_current
  on initiative_update_milestones (update_id) where is_current;
create index idx_update_milestones_milestone on initiative_update_milestones (milestone_id);

-- ----------------------------------------------------------------------------
-- BEFORE INSERT: validate + snapshot
-- ----------------------------------------------------------------------------

create or replace function prepare_update_milestone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone milestones%rowtype;
  v_initiative_id uuid;
begin
  select initiative_id into v_initiative_id
  from initiative_updates where id = new.update_id;

  select * into v_milestone from milestones where id = new.milestone_id;

  if v_milestone.id is null or v_milestone.initiative_id is distinct from v_initiative_id then
    raise exception 'Milestone % does not belong to the initiative this update is for.', new.milestone_id
      using errcode = 'check_violation';
  end if;

  new.milestone_title := v_milestone.title;
  new.previous_status := v_milestone.status;
  return new;
end;
$$;

create trigger trg_prepare_update_milestone
  before insert on initiative_update_milestones
  for each row
  execute function prepare_update_milestone();

-- ----------------------------------------------------------------------------
-- AFTER INSERT: promote onto milestones (newest meeting wins, like 001)
-- ----------------------------------------------------------------------------

create or replace function apply_update_milestone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meeting_date date;
begin
  select meeting_date into v_meeting_date
  from initiative_updates where id = new.update_id;

  update milestones
  set
    status     = new.status,
    challenges = coalesce(new.challenges, challenges)
  where id = new.milestone_id
    and not exists (
      select 1
      from initiative_update_milestones e
      join initiative_updates u on u.id = e.update_id
      where e.milestone_id = new.milestone_id
        and e.id <> new.id
        and u.meeting_date > v_meeting_date
    );
  return new;
end;
$$;

create trigger trg_apply_update_milestone
  after insert on initiative_update_milestones
  for each row
  execute function apply_update_milestone();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table initiative_update_milestones enable row level security;

create policy "update milestones readable by authenticated" on initiative_update_milestones
  for select using (auth.role() = 'authenticated');

-- Entries can only be attached to an update in the same transaction that
-- created it (u.created_at = now(), and now() is fixed per transaction).
-- That keeps the log genuinely append-only: nobody — admin included — can
-- go back and bolt milestone entries onto an old submission. Beyond that,
-- the same rule as initiative_updates: admin/smo anywhere, a lead only on
-- their own submission for their own workstream.
create policy "update milestones insertable with own submission" on initiative_update_milestones
  for insert with check (
    exists (
      select 1
      from initiative_updates u
      join initiatives i on i.id = u.initiative_id
      where u.id = update_id
        and u.created_at = now()
        and (
          is_admin_or_smo()
          or (u.submitted_by = auth.uid() and i.workstream_id = my_workstream_id())
        )
    )
  );

-- No update/delete policy: append-only, same as initiative_updates.

-- ----------------------------------------------------------------------------
-- RPC: atomic submission
-- ----------------------------------------------------------------------------

create or replace function submit_initiative_update(
  p_initiative_id    uuid,
  p_meeting_date     date,
  p_status           rag_status,
  p_latest_update    text,
  p_target           text default null,
  p_actual           text default null,
  p_decisions_needed text default null,
  p_milestones       jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_update_id uuid;
begin
  insert into initiative_updates (
    initiative_id, submitted_by, meeting_date, status,
    target, actual, latest_update, decisions_needed
  )
  values (
    p_initiative_id, auth.uid(), p_meeting_date, p_status,
    p_target, p_actual, p_latest_update, p_decisions_needed
  )
  returning id into v_update_id;

  -- milestone_title is filled in by trg_prepare_update_milestone.
  insert into initiative_update_milestones (
    update_id, milestone_id, is_current, status, note, challenges
  )
  select
    v_update_id,
    (m ->> 'milestone_id')::uuid,
    coalesce((m ->> 'is_current')::boolean, false),
    (m ->> 'status')::rag_status,
    nullif(m ->> 'note', ''),
    nullif(m ->> 'challenges', '')
  from jsonb_array_elements(coalesce(p_milestones, '[]'::jsonb)) with ordinality as t(m, ord)
  order by ord;

  return v_update_id;
end;
$$;

comment on function submit_initiative_update is 'Submits one fortnightly update plus its per-milestone entries atomically. Runs as the caller, so the initiative_updates and initiative_update_milestones RLS policies apply.';

revoke execute on function submit_initiative_update(uuid, date, rag_status, text, text, text, text, jsonb) from public, anon;
grant execute on function submit_initiative_update(uuid, date, rag_status, text, text, text, text, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- Submitter names for the history view
-- ----------------------------------------------------------------------------

create or replace function get_submitter_names(p_ids uuid[])
returns table (id uuid, full_name text, role user_role)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.full_name, p.role
  from profiles p
  where p.id = any (p_ids)
    and auth.role() = 'authenticated';
$$;

comment on function get_submitter_names is 'Name + role lookup for update submitters. Deliberately omits email and workstream so it exposes no more than the history view needs.';

revoke execute on function get_submitter_names(uuid[]) from public, anon;
grant execute on function get_submitter_names(uuid[]) to authenticated;
