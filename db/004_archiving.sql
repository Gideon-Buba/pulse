-- ============================================================================
-- 004: Soft-delete / archive support for workstreams and initiatives
-- ============================================================================
-- Why a new migration instead of editing 001: 001-003 already ran against the
-- live, reconciled TWG data — editing them in place would silently diverge
-- what's on disk from what's actually in the database.
--
-- Why soft-delete instead of a real DELETE: an initiative carries milestones
-- and an append-only initiative_updates history; a workstream owns
-- initiatives. Hard-deleting either would cascade-destroy that history. This
-- adds a nullable archived_at column instead — "deleting" a row just marks
-- it, list endpoints exclude archived rows by default, and it can always be
-- restored. No RLS policy changes are needed: the existing "writable by
-- admin/smo" policies on both tables already use `for all`, which covers the
-- UPDATE this relies on.
--
-- Run this in the Supabase SQL editor, after 001-003.
-- ============================================================================

alter table workstreams add column archived_at timestamptz;
alter table initiatives add column archived_at timestamptz;

comment on column workstreams.archived_at is 'Soft-delete marker. Null = active. Set by an admin/smo "delete" action; rows are never hard-deleted so initiative/milestone history is preserved and the action is reversible.';
comment on column initiatives.archived_at is 'Soft-delete marker. Null = active. Set by an admin/smo "delete" action; rows are never hard-deleted so milestone/update history is preserved and the action is reversible.';

-- Exclude archived rows from the summary view: both the workstream dimension
-- itself, and any archived initiatives nested under an otherwise-active
-- workstream.
create or replace view workstream_summary as
select
  w.name as workstream,
  count(i.id) as initiatives,
  count(i.id) filter (where i.status = 'Not started')      as not_started,
  count(i.id) filter (where i.status = 'In progress')       as in_progress,
  count(i.id) filter (where i.status = 'Completed')         as completed,
  count(i.id) filter (where i.status = 'Delayed/at risk')   as delayed_at_risk
from workstreams w
left join initiatives i on i.workstream_id = w.id and i.archived_at is null
where w.archived_at is null
group by w.name, w.sort_order
order by w.sort_order;
