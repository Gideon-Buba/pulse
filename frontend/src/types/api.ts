/**
 * Hand-written to match backend/openapi.json (Pulse API v1.0). A few
 * nullable string fields show up as `type: "object"` in the generated spec
 * due to a @nestjs/swagger quirk (nullable properties without an explicit
 * `type`) — these are typed correctly here as `string | null`, matching
 * the real runtime shape verified against the live API.
 */

export type RagStatus = 'Not started' | 'In progress' | 'Completed' | 'Delayed/at risk';
export type LGate = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type UserRole = 'admin' | 'smo' | 'workstream_lead';

export const RAG_STATUSES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
export const L_GATES: LGate[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  workstreamId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface Workstream {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  archived_at: string | null;
}

export interface CreateWorkstreamInput {
  name: string;
  sort_order?: number;
}

export interface UpdateWorkstreamInput {
  name?: string;
  sort_order?: number;
}

export interface WorkstreamSummary {
  workstream: string;
  initiatives: number;
  not_started: number;
  in_progress: number;
  completed: number;
  delayed_at_risk: number;
}

export interface Initiative {
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
  update_as_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CreateInitiativeInput {
  workstream_id: string;
  title: string;
  directorate_owner?: string | null;
  l_gate_stage?: LGate | null;
  kpi_expected_impact?: string | null;
  target?: string | null;
  actual?: string | null;
  status?: RagStatus;
  latest_update?: string | null;
  decisions_needed?: string | null;
  update_as_at?: string | null;
}

export interface UpdateInitiativeInput {
  title?: string;
  directorate_owner?: string | null;
  l_gate_stage?: LGate | null;
  kpi_expected_impact?: string | null;
  target?: string | null;
  actual?: string | null;
  status?: RagStatus;
  latest_update?: string | null;
  decisions_needed?: string | null;
  update_as_at?: string | null;
}

export interface Milestone {
  id: string;
  initiative_id: string;
  title: string;
  l_gate_stage: LGate | null;
  directorate_owner: string | null;
  target_date: string | null;
  status: RagStatus;
  challenges: string | null;
  upcoming_milestone: string | null;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneInput {
  title: string;
  l_gate_stage?: LGate | null;
  directorate_owner?: string | null;
  target_date?: string | null;
  status?: RagStatus;
  challenges?: string | null;
  upcoming_milestone?: string | null;
  sequence?: number;
}

export interface UpdateMilestoneInput {
  title?: string;
  l_gate_stage?: LGate | null;
  directorate_owner?: string | null;
  target_date?: string | null;
  status?: RagStatus;
  challenges?: string | null;
  upcoming_milestone?: string | null;
  sequence?: number;
}

export interface InitiativeUpdate {
  id: string;
  initiative_id: string;
  submitted_by: string | null;
  meeting_date: string;
  status: RagStatus;
  target: string | null;
  actual: string | null;
  latest_update: string;
  decisions_needed: string | null;
  created_at: string;
}

export interface SubmitUpdateInput {
  meeting_date: string;
  status: RagStatus;
  target?: string;
  actual?: string;
  latest_update: string;
  decisions_needed?: string;
}
