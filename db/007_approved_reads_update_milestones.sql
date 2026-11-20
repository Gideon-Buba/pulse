-- ============================================================================
-- 007: Require an approved profile to read milestone update entries
-- ============================================================================
-- Why: 006 (written before 005_user_accounts landed) gated reads on
-- initiative_update_milestones and get_submitter_names() with
-- auth.role() = 'authenticated'. 005 closed exactly that gap on the core
-- tables — anyone holding a Supabase session (a pending sign-up, or someone
-- who called auth.signUp() directly with no profiles row) counted as
-- "authenticated". This brings 006's objects in line, using the same
-- is_approved() helper from 005.
--
-- Run this in the Supabase SQL editor, after 001-006. Safe to re-run.
-- ============================================================================

drop policy if exists "update milestones readable by authenticated" on initiative_update_milestones;
drop policy if exists "update milestones readable by approved users" on initiative_update_milestones;
create policy "update milestones readable by approved users" on initiative_update_milestones
  for select using (is_approved());

-- SECURITY DEFINER bypasses RLS on profiles, so the gate has to live in the
-- function body itself.
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
    and is_approved();
$$;
