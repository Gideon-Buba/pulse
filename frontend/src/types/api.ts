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

// ---------------------------------------------------------------------------
// Accounts, approval and notifications (backend migration 005)
// ---------------------------------------------------------------------------

export type AccountStatus = 'pending' | 'approved' | 'rejected';

export const ACCOUNT_STATUSES: AccountStatus[] = ['pending', 'approved', 'rejected'];

/** The NRS work-email rule enforced on sign-up and password reset. */
export const NRS_EMAIL_DOMAIN = 'nrs.gov.ng';

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  email: string;
  fullName: string;
  status: AccountStatus;
  /** Written to be shown to the user as-is. */
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

/** One row in the admin-only Users section. */
export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  workstreamId: string | null;
  workstreamName: string | null;
  status: AccountStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface ApproveUserInput {
  role: UserRole;
  workstreamId?: string | null;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  workstreamId?: string | null;
}

export interface UsersAccessStatus {
  configured: boolean;
}

export interface UnlockUsersSectionResponse {
  ticket: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
}

export interface ResetLinkResponse {
  resetLink: string;
  email: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  subject_email: string | null;
  read_at: string | null;
  created_at: string;
}
