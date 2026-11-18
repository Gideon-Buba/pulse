import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountStatus, Profile, UserRole } from '../types/database';
import { ApproveUserDto, UpdateUserDto } from './dto/manage-user.dto';
import { UserAccountDto } from './dto/user-account.dto';

/**
 * Account administration for the Users section.
 *
 * This service uses the service-role client throughout, which CLAUDE.md
 * rightly treats as the exception rather than the rule. Two reasons it is
 * the right call here, not a shortcut around RLS:
 *
 *  1. It has to touch `auth.users` (create, delete, generate recovery
 *     links), which no user JWT can ever do.
 *  2. It has to *see* pending and rejected profiles, which RLS deliberately
 *     hides — including from their own owner.
 *
 * Authorization is enforced in front of it instead, and in three
 * independent layers: a valid approved session (`JwtAuthGuard`), the admin
 * role (`RolesGuard` + `@Roles('admin')`), and a live access-code ticket
 * (`UsersAccessGuard`).
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async list(status?: AccountStatus): Promise<UserAccountDto[]> {
    let builder = this.supabase
      .getServiceRoleClient()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      builder = builder.eq('status', status);
    }

    const { data, error } = await builder;
    if (error) throw new InternalServerErrorException(error.message);

    const workstreamNames = await this.loadWorkstreamNames();
    return data.map((profile) => this.toDto(profile, workstreamNames));
  }

  async approve(adminId: string, id: string, dto: ApproveUserDto): Promise<UserAccountDto> {
    const profile = await this.findProfile(id);

    if (profile.status === 'approved') {
      throw new ConflictException('This account is already approved.');
    }

    const workstreamId = await this.resolveWorkstream(dto.role, dto.workstreamId ?? null);

    return this.applyUpdate(id, {
      role: dto.role,
      workstream_id: workstreamId,
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminId,
      rejection_reason: null,
    });
  }

  async reject(adminId: string, id: string, reason?: string): Promise<UserAccountDto> {
    const profile = await this.findProfile(id);

    if (profile.id === adminId) {
      throw new ConflictException('You cannot reject your own account.');
    }
    await this.assertNotLastAdmin(profile, 'reject');

    return this.applyUpdate(id, {
      status: 'rejected',
      approved_at: new Date().toISOString(),
      approved_by: adminId,
      rejection_reason: reason ?? null,
    });
  }

  async update(adminId: string, id: string, dto: UpdateUserDto): Promise<UserAccountDto> {
    const profile = await this.findProfile(id);

    if (dto.fullName === undefined && dto.role === undefined && dto.workstreamId === undefined) {
      throw new BadRequestException('Nothing to update.');
    }

    const nextRole = dto.role ?? profile.role;

    if (dto.role && dto.role !== 'admin' && profile.id === adminId) {
      throw new ConflictException(
        'You cannot remove your own admin role — ask another admin to do it.',
      );
    }
    if (dto.role && dto.role !== 'admin') {
      await this.assertNotLastAdmin(profile, 'demote');
    }

    // Role and workstream are coupled: a lead must be scoped to exactly one
    // workstream, and admin/smo must not be scoped to any. Resolve them
    // together so a role change can't leave an inconsistent pair behind.
    const requestedWorkstream =
      dto.workstreamId !== undefined ? dto.workstreamId : profile.workstream_id;
    const workstreamId = await this.resolveWorkstream(nextRole, requestedWorkstream);

    return this.applyUpdate(id, {
      ...(dto.fullName !== undefined ? { full_name: dto.fullName } : {}),
      role: nextRole,
      workstream_id: workstreamId,
    });
  }

  /**
   * Hard-deletes the account. The auth user goes first and `profiles`
   * cascades from it (001_schema.sql). Submitted TWG history survives:
   * `initiative_updates.submitted_by` is `on delete set null`, so the
   * append-only audit trail keeps its rows and just loses the author link.
   */
  async remove(adminId: string, id: string): Promise<void> {
    const profile = await this.findProfile(id);

    if (profile.id === adminId) {
      throw new ConflictException('You cannot delete your own account.');
    }
    await this.assertNotLastAdmin(profile, 'delete');

    const { error } = await this.supabase.getServiceRoleClient().auth.admin.deleteUser(id);
    if (error) throw new InternalServerErrorException(error.message);
  }

  /**
   * Generates (does not email) a one-time recovery link for an approved
   * account, so the admin can hand a reset to someone directly. This is the
   * fallback for the common case where Supabase SMTP isn't configured and
   * `POST /auth/forgot-password` therefore can't deliver anything.
   */
  async issueResetLink(id: string): Promise<{ resetLink: string; email: string }> {
    const profile = await this.findProfile(id);

    if (profile.status !== 'approved') {
      throw new ConflictException(
        'Only an approved account can have a password reset link — approve the account first.',
      );
    }

    const redirectTo = this.resetRedirectUrl();
    const { data, error } = await this.supabase.getServiceRoleClient().auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      ...(redirectTo ? { options: { redirectTo } } : {}),
    });

    if (error || !data.properties?.action_link) {
      throw new ServiceUnavailableException(
        error?.message ?? 'Supabase did not return a recovery link.',
      );
    }

    return { resetLink: data.properties.action_link, email: profile.email };
  }

  private resetRedirectUrl(): string | undefined {
    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    if (!frontendUrl) return undefined;
    const primary = frontendUrl.split(',')[0]?.trim();
    return primary ? `${primary.replace(/\/$/, '')}/reset-password` : undefined;
  }

  private async findProfile(id: string): Promise<Profile> {
    const { data, error } = await this.supabase
      .getServiceRoleClient()
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle<Profile>();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`No user account with id ${id}.`);
    return data;
  }

  /**
   * Stops the deployment from ending up with no admin at all — which would
   * leave the Users section permanently unreachable through the UI.
   */
  private async assertNotLastAdmin(profile: Profile, action: string): Promise<void> {
    if (profile.role !== 'admin' || profile.status !== 'approved') return;

    const { count, error } = await this.supabase
      .getServiceRoleClient()
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('status', 'approved');

    if (error) throw new InternalServerErrorException(error.message);
    if ((count ?? 0) <= 1) {
      throw new ConflictException(
        `This is the only approved admin account — you cannot ${action} it. Promote another admin first.`,
      );
    }
  }

  /** Enforces the role↔workstream pairing and that the workstream exists. */
  private async resolveWorkstream(
    role: UserRole,
    workstreamId: string | null,
  ): Promise<string | null> {
    if (role !== 'workstream_lead') {
      // admin/smo see everything, so a workstream scope would be misleading.
      return null;
    }
    if (!workstreamId) {
      throw new BadRequestException('A workstream lead must be assigned to a workstream.');
    }

    const { data, error } = await this.supabase
      .getServiceRoleClient()
      .from('workstreams')
      .select('id, archived_at')
      .eq('id', workstreamId)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`No workstream with id ${workstreamId}.`);
    if (data.archived_at) {
      throw new ConflictException('That workstream is archived — pick an active one.');
    }
    return workstreamId;
  }

  private async applyUpdate(
    id: string,
    patch: Partial<Omit<Profile, 'id'>>,
  ): Promise<UserAccountDto> {
    const { data, error } = await this.supabase
      .getServiceRoleClient()
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<Profile>();

    if (error) throw new InternalServerErrorException(error.message);

    const workstreamNames = await this.loadWorkstreamNames();
    return this.toDto(data, workstreamNames);
  }

  private async loadWorkstreamNames(): Promise<Map<string, string>> {
    const { data, error } = await this.supabase
      .getServiceRoleClient()
      .from('workstreams')
      .select('id, name');

    if (error) throw new InternalServerErrorException(error.message);
    return new Map(data.map((row) => [row.id, row.name]));
  }

  private toDto(profile: Profile, workstreamNames: Map<string, string>): UserAccountDto {
    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      workstreamId: profile.workstream_id,
      workstreamName: profile.workstream_id
        ? (workstreamNames.get(profile.workstream_id) ?? null)
        : null,
      status: profile.status,
      approvedAt: profile.approved_at,
      approvedBy: profile.approved_by,
      rejectionReason: profile.rejection_reason,
      createdAt: profile.created_at,
    };
  }
}
