const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_STORAGE_KEY = 'pulse_token';
const USERS_ACCESS_STORAGE_KEY = 'pulse_users_access';

/** Header the API expects the Users-section access ticket in. */
export const USERS_ACCESS_HEADER = 'x-pulse-users-access';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

interface StoredUsersAccess {
  ticket: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
}

/**
 * The Users-section ticket lives in `sessionStorage`, not `localStorage`:
 * closing the tab should mean re-entering the access code. It is held
 * client-side only as a convenience — the server re-checks the signature,
 * the expiry and the admin it was issued to on every request, so a forged
 * or stale entry here just produces a 403.
 */
export function getUsersAccessTicket(): string | null {
  const raw = sessionStorage.getItem(USERS_ACCESS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUsersAccess;
    if (typeof parsed.ticket !== 'string' || typeof parsed.expiresAt !== 'number') return null;
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(USERS_ACCESS_STORAGE_KEY);
      return null;
    }
    return parsed.ticket;
  } catch {
    sessionStorage.removeItem(USERS_ACCESS_STORAGE_KEY);
    return null;
  }
}

export function setUsersAccessTicket(value: StoredUsersAccess | null): void {
  if (value) sessionStorage.setItem(USERS_ACCESS_STORAGE_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(USERS_ACCESS_STORAGE_KEY);
}

/** Nest's default HTTP exception body shape. */
interface NestErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as NestErrorBody).message;
    if (Array.isArray(msg)) return msg.join(' ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  /** Also send the Users-section access ticket — required by every /admin/users route. */
  usersAccess?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, usersAccess = false } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (usersAccess) {
    const ticket = getUsersAccessTicket();
    if (ticket) headers[USERS_ACCESS_HEADER] = ticket;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the Pulse API. Is the backend running?');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const parsed: unknown = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(parsed, `Request failed with status ${res.status}`));
  }

  return parsed as T;
}
