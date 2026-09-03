import { AuthenticatedUser, AuthSession } from './auth.types';

/**
 * Narrow interface every controller and guard depends on — never on
 * `supabase.auth.*` directly. See CLAUDE.md's auth section: when Entra ID
 * SSO is approved later, swapping the implementation behind this class is
 * meant to be the entire change. If a call site outside this module ever
 * needs to change to support SSO, this abstraction was cut in the wrong
 * place.
 */
export abstract class AuthService {
  abstract signIn(email: string, password: string): Promise<AuthSession>;
  abstract signOut(accessToken: string): Promise<void>;
  abstract verifyToken(accessToken: string): Promise<AuthenticatedUser>;
}
