import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Profile } from '../types/database';
import { AuthService } from './auth.service';
import { AuthenticatedUser, AuthSession, SignUpResult } from './auth.types';
import { normaliseEmail } from './nrs-email';

/** Shown verbatim to someone whose account hasn't been approved yet. */
export const PENDING_APPROVAL_MESSAGE =
  'Your Pulse account is awaiting admin confirmation. You will be able to sign in once an admin approves it — if it is taking too long, please contact the admin directly.';

export const REJECTED_MESSAGE =
  'This account request was not approved. Please contact the Pulse admin if you believe this is a mistake.';

@Injectable()
export class SupabaseAuthService extends AuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {
    super();
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.supabase
      .getAnonClient()
      .auth.signInWithPassword({ email: normaliseEmail(email), password });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Credentials were right, but approval is a separate gate — resolving
    // the profile throws 403 for a pending/rejected account.
    const user = await this.loadAuthenticatedUser(data.user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000),
      user,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    const { error } = await this.supabase
      .getServiceRoleClient()
      .auth.admin.signOut(accessToken, 'global');
    if (error) {
      throw new UnauthorizedException('Could not sign out — session may already be invalid.');
    }
  }

  async verifyToken(accessToken: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.supabase.getAnonClient().auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // Re-checked on every request, not just at sign-in: an account that is
    // rejected or deleted while holding a live token loses access at once.
    return this.loadAuthenticatedUser(data.user.id);
  }

  async signUp(fullName: string, email: string, password: string): Promise<SignUpResult> {
    const normalisedEmail = normaliseEmail(email);
    const client = this.supabase.getServiceRoleClient();

    const { data: existing, error: existingError } = await client
      .from('profiles')
      .select('status')
      .eq('email', normalisedEmail)
      .maybeSingle();

    if (existingError) throw new InternalServerErrorException(existingError.message);

    if (existing) {
      if (existing.status === 'pending') {
        throw new ConflictException(
          'A request for this email is already waiting for admin confirmation.',
        );
      }
      if (existing.status === 'rejected') {
        throw new ConflictException(REJECTED_MESSAGE);
      }
      throw new ConflictException(
        'An account already exists for this email. Try signing in, or use "Forgot password".',
      );
    }

    // `email_confirm: true` deliberately skips Supabase's own email
    // verification step: admin approval is the real gate here, and the
    // project may not have SMTP configured at all. The account still cannot
    // sign in while status = 'pending'.
    const { data: created, error: createError } = await client.auth.admin.createUser({
      email: normalisedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      const message = createError?.message ?? 'Could not create the account.';
      if (/already (been )?registered|already exists/i.test(message)) {
        throw new ConflictException(
          'An account already exists for this email. Try signing in, or use "Forgot password".',
        );
      }
      throw new InternalServerErrorException(message);
    }

    const { error: profileError } = await client.from('profiles').insert({
      id: created.user.id,
      full_name: fullName,
      email: normalisedEmail,
      // Role and workstream are the admin's call at approval time — a
      // self-service sign-up never gets to choose its own privileges.
      role: 'workstream_lead',
      workstream_id: null,
      status: 'pending',
    });

    if (profileError) {
      // Roll the auth user back, or the address is stuck: it can't sign in
      // (no profile) and can't sign up again (email already registered).
      await client.auth.admin.deleteUser(created.user.id).catch((cleanupError: unknown) => {
        this.logger.error(
          `Orphaned auth user ${created.user.id} after a failed profile insert: ${String(cleanupError)}`,
        );
      });
      throw new InternalServerErrorException(profileError.message);
    }

    await this.notifications.notifyAdminsOfAccountRequest(normalisedEmail, fullName);

    return { email: normalisedEmail, fullName, status: 'pending' };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalisedEmail = normaliseEmail(email);

    const { data: profile, error } = await this.supabase
      .getServiceRoleClient()
      .from('profiles')
      .select('status')
      .eq('email', normalisedEmail)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);

    // Explicit 404 rather than a silent success. This is Gideon's call: on a
    // closed internal tool, telling someone "there is no account here" is
    // more useful than letting them wait for an email that never arrives.
    // The trade-off is that it confirms whether an address has an account —
    // acceptable when every address is a predictable firstname.lastname@
    // NRS work address anyway.
    if (!profile) {
      throw new NotFoundException(
        'No Pulse account exists for this email address. Sign up first, or ask the admin to create your account.',
      );
    }
    if (profile.status === 'pending') {
      throw new ForbiddenException(PENDING_APPROVAL_MESSAGE);
    }
    if (profile.status === 'rejected') {
      throw new ForbiddenException(REJECTED_MESSAGE);
    }

    const redirectTo = this.resetRedirectUrl();
    const { error: resetError } = await this.supabase
      .getAnonClient()
      .auth.resetPasswordForEmail(normalisedEmail, redirectTo ? { redirectTo } : undefined);

    if (resetError) {
      this.logger.error(
        `Password reset email failed for ${normalisedEmail}: ${resetError.message}`,
      );
      throw new ServiceUnavailableException(
        'Could not send the reset email. Password reset email delivery may not be configured on this project — ask the admin to issue you a reset link from the Users section instead.',
      );
    }
  }

  async resetPassword(recoveryToken: string, newPassword: string): Promise<void> {
    const { data, error } = await this.supabase.getAnonClient().auth.getUser(recoveryToken);

    if (error || !data.user) {
      throw new UnauthorizedException(
        'This password reset link is invalid or has expired. Request a new one.',
      );
    }

    // An unapproved account must not be able to complete a reset and end up
    // with a working password it still can't use.
    await this.loadAuthenticatedUser(data.user.id);

    const { error: updateError } = await this.supabase
      .getServiceRoleClient()
      .auth.admin.updateUserById(data.user.id, { password: newPassword });

    if (updateError) throw new InternalServerErrorException(updateError.message);
  }

  /**
   * Where the emailed recovery link sends people. Falls back to Supabase's
   * configured Site URL when `FRONTEND_URL` is unset (local dev).
   */
  private resetRedirectUrl(): string | undefined {
    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    if (!frontendUrl) return undefined;
    // FRONTEND_URL may be a comma-separated list (production + preview
    // domains) — the first entry is the canonical one.
    const primary = frontendUrl.split(',')[0]?.trim();
    return primary ? `${primary.replace(/\/$/, '')}/reset-password` : undefined;
  }

  /**
   * Resolves a Supabase auth user into the app's identity, enforcing the
   * approval gate.
   *
   * Reads `profiles` with the service-role client rather than the caller's
   * JWT on purpose: RLS deliberately hides a non-approved profile even from
   * its own owner, so an RLS-scoped read here would surface "no profile
   * configured" for a pending account instead of the accurate "waiting for
   * admin confirmation". Only this one lookup is privileged — every data
   * route still queries as the user so RLS does the enforcement.
   */
  private async loadAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const { data: profile, error } = await this.supabase
      .getServiceRoleClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>();

    if (error) throw new InternalServerErrorException(error.message);

    if (!profile) {
      throw new UnauthorizedException(
        'No Pulse profile is configured for this account. Contact an admin.',
      );
    }

    if (profile.status === 'pending') throw new ForbiddenException(PENDING_APPROVAL_MESSAGE);
    if (profile.status === 'rejected') throw new ForbiddenException(REJECTED_MESSAGE);

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      workstreamId: profile.workstream_id,
    };
  }
}
