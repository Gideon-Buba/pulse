import { apiFetch } from './api-client';
import type {
  AccountStatus,
  ApproveUserInput,
  AuthUser,
  CreateInitiativeInput,
  CreateMilestoneInput,
  CreateWorkstreamInput,
  ForgotPasswordResponse,
  Initiative,
  InitiativeUpdate,
  LoginResponse,
  Milestone,
  Notification,
  RagStatus,
  ResetLinkResponse,
  SignupInput,
  SignupResponse,
  SubmitUpdateInput,
  UpdateInitiativeInput,
  UpdateMilestoneInput,
  UpdateUserInput,
  UpdateWorkstreamInput,
  UserAccount,
  Workstream,
  WorkstreamSummary,
} from '@/types/api';

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    me: () => apiFetch<AuthUser>('/auth/me'),
    /** Creates a pending account — no session until an admin approves it. */
    signup: (body: SignupInput) =>
      apiFetch<SignupResponse>('/auth/signup', { method: 'POST', body, auth: false }),
    /** 404s for an email with no Pulse account, by design — see the API's own note. */
    forgotPassword: (email: string) =>
      apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
      }),
    resetPassword: (token: string, password: string) =>
      apiFetch<void>('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        auth: false,
      }),
  },
  notifications: {
    list: (filters?: { unreadOnly?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.unreadOnly) params.set('unread_only', 'true');
      const qs = params.toString();
      return apiFetch<Notification[]>(`/notifications${qs ? `?${qs}` : ''}`);
    },
    markRead: (id: string) => apiFetch<Notification>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => apiFetch<void>('/notifications/read-all', { method: 'POST' }),
  },
  /**
   * The admin-only Users section (admin role enforced by the API).
   */
  users: {
    list: (filters?: { status?: AccountStatus }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      const qs = params.toString();
      return apiFetch<UserAccount[]>(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    approve: (id: string, body: ApproveUserInput) =>
      apiFetch<UserAccount>(`/admin/users/${id}/approve`, {
        method: 'POST',
        body,
      }),
    reject: (id: string, reason?: string) =>
      apiFetch<UserAccount>(`/admin/users/${id}/reject`, {
        method: 'POST',
        body: reason ? { reason } : {},
      }),
    update: (id: string, body: UpdateUserInput) =>
      apiFetch<UserAccount>(`/admin/users/${id}`, { method: 'PATCH', body }),
    resetLink: (id: string) =>
      apiFetch<ResetLinkResponse>(`/admin/users/${id}/reset-link`, {
        method: 'POST',
      }),
    remove: (id: string) =>
      apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' }),
  },
  workstreams: {
    list: (filters?: { includeArchived?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.includeArchived) params.set('include_archived', 'true');
      const qs = params.toString();
      return apiFetch<Workstream[]>(`/workstreams${qs ? `?${qs}` : ''}`);
    },
    summary: () => apiFetch<WorkstreamSummary[]>('/workstreams/summary'),
    get: (id: string) => apiFetch<Workstream>(`/workstreams/${id}`),
    create: (body: CreateWorkstreamInput) =>
      apiFetch<Workstream>('/workstreams', { method: 'POST', body }),
    update: (id: string, body: UpdateWorkstreamInput) =>
      apiFetch<Workstream>(`/workstreams/${id}`, { method: 'PATCH', body }),
    archive: (id: string) => apiFetch<Workstream>(`/workstreams/${id}`, { method: 'DELETE' }),
    restore: (id: string) => apiFetch<Workstream>(`/workstreams/${id}/restore`, { method: 'POST' }),
  },
  initiatives: {
    list: (filters?: { workstreamId?: string; status?: RagStatus; includeArchived?: boolean }) => {
      const params = new URLSearchParams();
      if (filters?.workstreamId) params.set('workstream_id', filters.workstreamId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.includeArchived) params.set('include_archived', 'true');
      const qs = params.toString();
      return apiFetch<Initiative[]>(`/initiatives${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => apiFetch<Initiative>(`/initiatives/${id}`),
    create: (body: CreateInitiativeInput) =>
      apiFetch<Initiative>('/initiatives', { method: 'POST', body }),
    update: (id: string, body: UpdateInitiativeInput) =>
      apiFetch<Initiative>(`/initiatives/${id}`, { method: 'PATCH', body }),
    archive: (id: string) => apiFetch<Initiative>(`/initiatives/${id}`, { method: 'DELETE' }),
    restore: (id: string) => apiFetch<Initiative>(`/initiatives/${id}/restore`, { method: 'POST' }),
  },
  milestones: {
    listForInitiative: (initiativeId: string) =>
      apiFetch<Milestone[]>(`/initiatives/${initiativeId}/milestones`),
    create: (initiativeId: string, body: CreateMilestoneInput) =>
      apiFetch<Milestone>(`/initiatives/${initiativeId}/milestones`, { method: 'POST', body }),
    update: (initiativeId: string, id: string, body: UpdateMilestoneInput) =>
      apiFetch<Milestone>(`/initiatives/${initiativeId}/milestones/${id}`, { method: 'PATCH', body }),
    remove: (initiativeId: string, id: string) =>
      apiFetch<void>(`/initiatives/${initiativeId}/milestones/${id}`, { method: 'DELETE' }),
  },
  updates: {
    listForInitiative: (initiativeId: string) =>
      apiFetch<InitiativeUpdate[]>(`/initiatives/${initiativeId}/updates`),
    submit: (initiativeId: string, body: SubmitUpdateInput) =>
      apiFetch<InitiativeUpdate>(`/initiatives/${initiativeId}/updates`, { method: 'POST', body }),
  },
};
