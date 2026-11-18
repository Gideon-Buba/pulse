import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { EnvConfig } from '../config/env.validation';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ACCESS_CODE_SETTING_KEY,
  AccessTicket,
  hashAccessCode,
  signAccessTicket,
  verifyAccessCode,
  verifyAccessTicket,
} from './users-access.crypto';

/** How long one unlock lasts before the admin must re-enter the code. */
export const ACCESS_TICKET_TTL_MS = 30 * 60 * 1000;

export const CODE_NOT_CONFIGURED_MESSAGE =
  'The Users-section access code has not been set yet. Run `npm run users:set-code` in backend/ to set one.';

/**
 * Guards the Users section behind a shared access code, on top of the
 * admin-role check. Rationale: an account being able to sign in to Pulse
 * must not by itself mean it can approve accounts or delete users — the two
 * should fail independently.
 *
 * There is intentionally NO self-service recovery for this code. It is
 * reset from the server with `npm run users:set-code`, which is why the
 * code lives hashed in `app_settings` (service-role-only, see migration
 * 005) rather than anywhere a user JWT can reach.
 */
@Injectable()
export class UsersAccessService {
  private readonly signingKey: Buffer;

  constructor(
    private readonly supabase: SupabaseService,
    configService: ConfigService<EnvConfig, true>,
  ) {
    // Ticket signing key. `USERS_SECTION_TICKET_SECRET` is optional: with no
    // override it is derived from the service-role key, which is already a
    // required server-only secret. Derived rather than used raw so a leaked
    // ticket can never be walked back to the Supabase key.
    const secret =
      configService.get('USERS_SECTION_TICKET_SECRET', { infer: true }) ??
      configService.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    this.signingKey = createHash('sha256').update(`pulse:users-section:${secret}`).digest();
  }

  /**
   * Checks the code and, on success, issues a short-lived ticket bound to
   * this admin. Wrong code → 401; no code configured at all → 503, so the
   * two are distinguishable when setting the system up.
   */
  async unlock(userId: string, accessCode: string): Promise<AccessTicket> {
    const storedHash = await this.loadStoredHash();
    if (!storedHash) {
      throw new ServiceUnavailableException(CODE_NOT_CONFIGURED_MESSAGE);
    }
    if (!verifyAccessCode(accessCode, storedHash)) {
      throw new UnauthorizedException('Incorrect access code.');
    }
    return signAccessTicket(this.signingKey, userId, ACCESS_TICKET_TTL_MS);
  }

  isTicketValid(token: string, userId: string): boolean {
    return verifyAccessTicket(this.signingKey, token, userId);
  }

  /**
   * Rotates the code. Requires the current one, so a hijacked admin session
   * alone can't lock the real admin out — and if the current code is lost,
   * `npm run users:set-code` is the (deliberately server-side) way back in.
   */
  async changeAccessCode(
    adminId: string,
    currentAccessCode: string,
    newAccessCode: string,
  ): Promise<void> {
    const storedHash = await this.loadStoredHash();
    if (!storedHash) {
      throw new ServiceUnavailableException(CODE_NOT_CONFIGURED_MESSAGE);
    }
    if (!verifyAccessCode(currentAccessCode, storedHash)) {
      throw new UnauthorizedException('The current access code is incorrect.');
    }

    const { error } = await this.supabase
      .getServiceRoleClient()
      .from('app_settings')
      .update({
        value: hashAccessCode(newAccessCode),
        updated_at: new Date().toISOString(),
        updated_by: adminId,
      })
      .eq('key', ACCESS_CODE_SETTING_KEY);

    if (error) throw new InternalServerErrorException(error.message);
  }

  /** True once an access code exists — lets the UI explain itself before anyone types. */
  async isConfigured(): Promise<boolean> {
    return (await this.loadStoredHash()) !== null;
  }

  private async loadStoredHash(): Promise<string | null> {
    const { data, error } = await this.supabase
      .getServiceRoleClient()
      .from('app_settings')
      .select('value')
      .eq('key', ACCESS_CODE_SETTING_KEY)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    return data?.value ?? null;
  }
}
