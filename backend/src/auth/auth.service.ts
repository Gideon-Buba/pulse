import { AuthenticatedUser, AuthSession, SignUpResult } from './auth.types';

/**
 * Narrow interface every controller and guard depends on — never on
 * `supabase.auth.*` directly. See CLAUDE.md's auth section: when Entra ID
 * SSO is approved later, swapping the implementation behind this class is
 * meant to be the entire change. If a call site outside this module ever
 * needs to change to support SSO, this abstraction was cut in the wrong
 * place.
 *
 * `signUp`, `requestPasswordReset` and `resetPassword` are specific to the
 * email/password era rather than universal auth concepts — under Entra ID,
 * the directory owns account creation and password recovery. They live here
 * anyway, precisely so that the day they stop being meaningful, the change
 * is confined to this module plus the two routes that expose them.
 */
export abstract class AuthService {
  abstract signIn(email: string, password: string): Promise<AuthSession>;
  abstract signOut(accessToken: string): Promise<void>;
  abstract verifyToken(accessToken: string): Promise<AuthenticatedUser>;

  /**
   * Creates an account in a *pending* state — it cannot sign in until an
   * admin approves it in the Users section. Notifies every admin.
   */
  abstract signUp(fullName: string, email: string, password: string): Promise<SignUpResult>;

  /**
   * Emails a recovery link, but only for an email that already has an
   * approved Pulse account — deliberately NOT a silent no-op for unknown
   * addresses (see `AuthController` for the rationale and the trade-off).
   */
  abstract requestPasswordReset(email: string): Promise<void>;

  /** Completes a reset using the recovery token from the emailed link. */
  abstract resetPassword(recoveryToken: string, newPassword: string): Promise<void>;
}
