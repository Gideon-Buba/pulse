import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { AccountStatus, UserRole } from '../../types/database';

const USER_ROLES: UserRole[] = ['admin', 'smo', 'workstream_lead'];
const ACCOUNT_STATUSES: AccountStatus[] = ['pending', 'approved', 'rejected'];

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    enum: ACCOUNT_STATUSES,
    description: 'Only return accounts in this approval state. Omit for all accounts.',
  })
  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  status?: AccountStatus;
}

export class ApproveUserDto {
  @ApiProperty({
    enum: USER_ROLES,
    description:
      'The role to grant on approval. Sign-up never lets someone choose their own role — this is the admin’s decision.',
    example: 'workstream_lead',
  })
  @IsEnum(['admin', 'smo', 'workstream_lead'] as const, {
    message: 'role must be one of: admin, smo, workstream_lead',
  })
  role!: UserRole;

  @ApiPropertyOptional({
    type: String,
    description:
      'Workstream to scope this user to. Required when role is workstream_lead; must be omitted (or null) for admin/smo, which are not workstream-scoped.',
  })
  @IsOptional()
  @IsUUID()
  workstreamId?: string | null;
}

export class RejectUserDto {
  @ApiPropertyOptional({
    description:
      'Optional note on why the request was declined. Stored for the admin’s own reference — it is not shown to the applicant.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Correct the user’s display name.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional({ enum: USER_ROLES, description: 'Change the user’s role.' })
  @IsOptional()
  @IsEnum(['admin', 'smo', 'workstream_lead'] as const, {
    message: 'role must be one of: admin, smo, workstream_lead',
  })
  role?: UserRole;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Change the workstream a lead is scoped to. Pass null to clear it (required when moving someone to admin/smo).',
  })
  @IsOptional()
  @IsUUID()
  workstreamId?: string | null;
}

export class ResetLinkResponseDto {
  @ApiProperty({
    description:
      'One-time password-recovery link to hand to the user directly. Use this when Supabase email delivery is not configured — it is generated, not emailed.',
  })
  resetLink!: string;

  @ApiProperty({ example: 'john.lewis@nrs.gov.ng', description: 'Who the link is for.' })
  email!: string;
}
