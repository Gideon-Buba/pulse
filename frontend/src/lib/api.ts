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
  MeetingDetail,
  MeetingSummary,
  Milestone,
  Notification,
  MilestoneHistoryEntry,
  RagStatus,
  ResetLinkResponse,
  SignupInput,
  SignupResponse,
  SubmitUpdateInput,
  UnlockUsersSectionResponse,
  UpdateInitiativeInput,
  UpdateMilestoneInput,
  UpdateUserInput,
  UpdateWorkstreamInput,
  UserAccount,
  UsersAccessStatus,
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
   * The admin-only Users section. Every call here carries the access-code
   * ticket in addition to the bearer token — `usersAccess: true`.
   */
  users: {
    accessStatus: () => apiFetch<UsersAccessStatus>('/admin/users-access'),
    unlock: (accessCode: string) =>
      apiFetch<UnlockUsersSectionResponse>('/admin/users-access/unlock', {
        method: 'POST',
        body: { accessCode },
      }),
    changeAccessCode: (currentAccessCode: string, newAccessCode: string) =>
      apiFetch<void>('/admin/users-access/code', {
        method: 'POST',
        body: { currentAccessCode, newAccessCode },
      }),
    list: (filters?: { status?: AccountStatus }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      const qs = params.toString();
      return apiFetch<UserAccount[]>(`/admin/users${qs ? `?${qs}` : ''}`, { usersAccess: true });
    },
    approve: (id: string, body: ApproveUserInput) =>
      apiFetch<UserAccount>(`/admin/users/${id}/approve`, {
        method: 'POST',
        body,
        usersAccess: true,
      }),
    reject: (id: string, reason?: string) =>
      apiFetch<UserAccount>(`/admin/users/${id}/reject`, {
        method: 'POST',
        body: reason ? { reason } : {},
        usersAccess: true,
      }),
    update: (id: string, body: UpdateUserInput) =>
      apiFetch<UserAccount>(`/admin/users/${id}`, { method: 'PATCH', body, usersAccess: true }),
    resetLink: (id: string) =>
      apiFetch<ResetLinkResponse>(`/admin/users/${id}/reset-link`, {
        method: 'POST',
        usersAccess: true,
      }),
    remove: (id: string) =>
      apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE', usersAccess: true }),
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
    history: (initiativeId: string, id: string) =>
      apiFetch<MilestoneHistoryEntry[]>(`/initiatives/${initiativeId}/milestones/${id}/history`),
  },
  updates: {
    listForInitiative: (initiativeId: string) =>
      apiFetch<InitiativeUpdate[]>(`/initiatives/${initiativeId}/updates`),
    submit: (initiativeId: string, body: SubmitUpdateInput) =>
      apiFetch<InitiativeUpdate>(`/initiatives/${initiativeId}/updates`, { method: 'POST', body }),
  },
  meetings: {
    list: () => apiFetch<MeetingSummary[]>('/meetings'),
    get: (date: string) => apiFetch<MeetingDetail>(`/meetings/${date}`),
  },
};
