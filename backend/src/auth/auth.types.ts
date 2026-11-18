import { AccountStatus, UserRole } from '../types/database';

/**
 * The identity shape every controller/guard in the app depends on. Sourced
 * from the `profiles` table, decoupled from *how* the user authenticated —
 * see CLAUDE.md's auth section. When SSO lands, this shape doesn't change.
 *
 * Only `status = 'approved'` profiles are ever resolved into one of these:
 * sign-in and token verification both refuse pending/rejected accounts, so
 * downstream code never has to re-check approval.
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

/**
 * What a self-service sign-up returns. There is no session here by design —
 * the account exists but cannot sign in until an admin approves it.
 */
export interface SignUpResult {
  email: string;
  fullName: string;
  status: AccountStatus;
}
