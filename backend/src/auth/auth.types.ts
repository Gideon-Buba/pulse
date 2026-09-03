import { UserRole } from '../types/database';

/**
 * The identity shape every controller/guard in the app depends on. Sourced
 * from the `profiles` table, decoupled from *how* the user authenticated —
 * see CLAUDE.md's auth section. When SSO lands, this shape doesn't change.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  workstreamId: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch seconds. */
  expiresAt: number;
  user: AuthenticatedUser;
}
