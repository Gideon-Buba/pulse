import { apiFetch } from './api-client';
import type {
  AuthUser,
  CreateInitiativeInput,
  CreateMilestoneInput,
  CreateWorkstreamInput,
  Initiative,
  InitiativeUpdate,
  LoginResponse,
  Milestone,
  RagStatus,
  SubmitUpdateInput,
  UpdateInitiativeInput,
  UpdateMilestoneInput,
  UpdateWorkstreamInput,
  Workstream,
  WorkstreamSummary,
} from '@/types/api';

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    me: () => apiFetch<AuthUser>('/auth/me'),
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
