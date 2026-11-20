/**
 * Pulse — hand-authored types matching 001_schema.sql.
 *
 * Source of truth: `db/types.ts` at the repo root. Copied here (rather than
 * imported across the monorepo boundary) so the backend package builds
 * standalone with a normal single-rootDir tsconfig.
 *
 * Once the Supabase project ref is available, prefer regenerating both
 * copies from the live schema instead of hand-editing:
 *   supabase gen types typescript --project-id <ref> > db/types.ts
 * then copy the result here. Keep this file's shape identical to
 * `db/types.ts` — other backend code depends on it.
 */

export type RagStatus = 'Not started' | 'In progress' | 'Completed' | 'Delayed/at risk';

export type LGate = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type UserRole = 'admin' | 'smo' | 'workstream_lead';

/**
 * Account approval state (migration 005). A self-service sign-up lands as
 * 'pending' and is refused at sign-in until an admin approves it — see
 * `AccountApprovalService` / the Users section.
 */
export type AccountStatus = 'pending' | 'approved' | 'rejected';

// These are `type` aliases, not `interface`s, deliberately: supabase-js's
// generic inference for `.insert()`/`.update()` requires each Row/Insert/
// Update to structurally satisfy `Record<string, unknown>`, and a TS
// `interface` — unlike a `type` alias with the same shape — does not
// satisfy that check in an `extends` conditional. Interfaces silently
// resolved to `never` here, breaking every write call. Keep these as
// `type`.

export type Workstream = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string; // ISO timestamp
  archived_at: string | null; // ISO timestamp; null = active
};

export type Profile = {
  id: string; // matches auth.users.id
  full_name: string;
  email: string;
  role: UserRole;
  workstream_id: string | null; // null for admin/smo
  created_at: string;
  status: AccountStatus;
  approved_at: string | null;
  approved_by: string | null; // profiles.id of the admin who actioned it
  rejection_reason: string | null;
};

/** Per-recipient notification feed. Inserted service-role-side only. */
export type Notification = {
  id: string;
  recipient_id: string;
  type: string; // e.g. 'account_request'
  title: string;
  body: string | null;
  link: string | null;
  subject_email: string | null;
  read_at: string | null;
  created_at: string;
};

/** Server-only key/value settings. RLS-locked to the service-role key. */
export type AppSetting = {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
};

export type Initiative = {
  id: string;
  workstream_id: string;
  title: string;
  directorate_owner: string | null;
  l_gate_stage: LGate | null;
  kpi_expected_impact: string | null;
  target: string | null;
  actual: string | null;
  status: RagStatus;
  latest_update: string | null;
  decisions_needed: string | null;
  update_as_at: string | null; // date (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
  archived_at: string | null; // ISO timestamp; null = active
};

export type Milestone = {
  id: string;
  initiative_id: string;
  title: string;
  l_gate_stage: LGate | null;
  directorate_owner: string | null;
  target_date: string | null; // date
  status: RagStatus;
  challenges: string | null;
  upcoming_milestone: string | null;
  sequence: number;
  created_at: string;
  updated_at: string;
};

export type InitiativeUpdate = {
  id: string;
  initiative_id: string;
  submitted_by: string | null;
  meeting_date: string; // date
  status: RagStatus;
  target: string | null;
  actual: string | null;
  latest_update: string;
  decisions_needed: string | null;
  created_at: string;
};

/**
 * One milestone a lead reported on as part of an `initiative_updates`
 * submission (006_update_milestones.sql). Append-only.
 */
export type InitiativeUpdateMilestone = {
  id: string;
  update_id: string;
  milestone_id: string | null; // null once the milestone itself is deleted
  milestone_title: string; // snapshot at submission time
  is_current: boolean;
  previous_status: RagStatus | null;
  status: RagStatus;
  note: string | null;
  challenges: string | null;
  created_at: string;
};

/** Row returned by the `get_submitter_names` function. */
export type SubmitterName = {
  id: string;
  full_name: string;
  role: UserRole;
};

/** Row shape for the `workstream_summary` view. */
export type WorkstreamSummary = {
  workstream: string;
  initiatives: number;
  not_started: number;
  in_progress: number;
  completed: number;
  delayed_at_risk: number;
};

/** Payload shape a workstream lead submits fortnightly (maps to initiative_updates insert). */
export type SubmitUpdateInput = {
  initiative_id: string;
  meeting_date: string;
  status: RagStatus;
  target?: string;
  actual?: string;
  latest_update: string;
  decisions_needed?: string;
};

/** One element of the `p_milestones` jsonb array for submit_initiative_update. */
export type SubmitMilestoneEntryInput = {
  milestone_id: string;
  is_current: boolean;
  status: RagStatus;
  note: string | null;
  challenges: string | null;
};

/**
 * Full Supabase `Database` type, structured for use with
 * `createClient<Database>(url, key)` so every query is typed end to end.
 */
export type Database = {
  public: {
    Tables: {
      workstreams: {
        Row: Workstream;
        Insert: Omit<Workstream, 'id' | 'created_at' | 'archived_at'> & {
          id?: string;
          archived_at?: string | null;
        };
        Update: Partial<Omit<Workstream, 'id'>>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<
          Profile,
          'created_at' | 'status' | 'approved_at' | 'approved_by' | 'rejection_reason'
        > & {
          status?: AccountStatus;
          approved_at?: string | null;
          approved_by?: string | null;
          rejection_reason?: string | null;
        };
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'read_at'> & {
          id?: string;
          read_at?: string | null;
        };
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSetting;
        Insert: Omit<AppSetting, 'updated_at' | 'updated_by'> & {
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Omit<AppSetting, 'key'>>;
        Relationships: [];
      };
      initiatives: {
        Row: Initiative;
        Insert: Omit<Initiative, 'id' | 'created_at' | 'updated_at' | 'archived_at'> & {
          id?: string;
          archived_at?: string | null;
        };
        Update: Partial<Omit<Initiative, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      milestones: {
        Row: Milestone;
        Insert: Omit<Milestone, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Milestone, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      initiative_updates: {
        Row: InitiativeUpdate;
        Insert: Omit<InitiativeUpdate, 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Omit<InitiativeUpdate, 'id' | 'created_at'>>;
        Relationships: [];
      };
      initiative_update_milestones: {
        Row: InitiativeUpdateMilestone;
        // Inserted only via the submit_initiative_update RPC; title and
        // previous_status are filled in by trigger.
        Insert: Omit<
          InitiativeUpdateMilestone,
          'id' | 'created_at' | 'milestone_title' | 'previous_status'
        > & { id?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      workstream_summary: {
        Row: WorkstreamSummary;
        Relationships: [];
      };
    };
    Functions: {
      submit_initiative_update: {
        Args: {
          p_initiative_id: string;
          p_meeting_date: string;
          p_status: RagStatus;
          p_latest_update: string;
          p_target?: string | null;
          p_actual?: string | null;
          p_decisions_needed?: string | null;
          p_milestones?: SubmitMilestoneEntryInput[];
        };
        Returns: string; // new initiative_updates.id
      };
      get_submitter_names: {
        Args: { p_ids: string[] };
        Returns: SubmitterName[];
      };
    };
  };
};
