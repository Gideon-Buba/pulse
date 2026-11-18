import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Notification } from '../types/database';

export const ACCOUNT_REQUEST_NOTIFICATION = 'account_request';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Fan a "someone wants an account" notification out to every admin, so an
   * approval request can't sit unseen just because nobody opened the Users
   * page. Admins only — `smo` and `workstream_lead` have no approval powers,
   * so a notification they can't action would just be noise.
   *
   * Service-role: the person signing up is unauthenticated and must not be
   * able to write notification rows themselves (RLS grants no insert policy
   * at all — see migration 005).
   */
  async notifyAdminsOfAccountRequest(email: string, fullName: string): Promise<void> {
    const client = this.supabase.getServiceRoleClient();

    const { data: admins, error: adminsError } = await client
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('status', 'approved');

    if (adminsError) {
      // Never fail the sign-up itself over a notification — the request is
      // still visible in the Users section either way.
      this.logger.error(`Could not load admins to notify: ${adminsError.message}`);
      return;
    }
    if (!admins || admins.length === 0) {
      this.logger.warn(`No approved admin to notify about the account request from ${email}.`);
      return;
    }

    const { error } = await client.from('notifications').insert(
      admins.map((admin) => ({
        recipient_id: admin.id,
        type: ACCOUNT_REQUEST_NOTIFICATION,
        title: 'New Pulse account request',
        body: `${fullName} (${email}) has requested access and is waiting for approval.`,
        link: '/users',
        subject_email: email,
      })),
    );

    if (error) {
      this.logger.error(`Could not write account-request notifications: ${error.message}`);
    }
  }

  /** The caller's own feed, newest first. RLS scopes this to the recipient. */
  async listForUser(accessToken: string, unreadOnly: boolean): Promise<Notification[]> {
    let builder = this.supabase
      .getClientForToken(accessToken)
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      builder = builder.is('read_at', null);
    }

    const { data, error } = await builder;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async markRead(accessToken: string, id: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    // RLS hides other people's rows, so "not visible" and "doesn't exist"
    // are the same 404 from the caller's point of view.
    if (!data) throw new NotFoundException(`Notification ${id} not found.`);
    return data;
  }

  async markAllRead(accessToken: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .getClientForToken(accessToken)
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (error) throw new InternalServerErrorException(error.message);
  }
}
