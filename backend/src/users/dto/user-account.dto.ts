import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus, UserRole } from '../../types/database';

export class UserAccountDto {
  @ApiProperty({ description: 'Profile id — matches the Supabase auth user id.' })
  id!: string;

  @ApiProperty({ example: 'John Lewis' })
  fullName!: string;

  @ApiProperty({ example: 'john.lewis@nrs.gov.ng' })
  email!: string;

  @ApiProperty({
    enum: ['admin', 'smo', 'workstream_lead'],
    description:
      'admin can read/write everything and manage users. smo can read/write everything. workstream_lead is scoped to workstreamId.',
  })
  role!: UserRole;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The workstream this user is scoped to. Null for admin/smo.',
  })
  workstreamId!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Name of that workstream, resolved for display. Null when workstreamId is null.',
  })
  workstreamName!: string | null;

  @ApiProperty({
    enum: ['pending', 'approved', 'rejected'],
    description:
      "'pending' accounts exist but cannot sign in. Only an admin can move an account to 'approved'.",
  })
  status!: AccountStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'ISO timestamp this account was approved or rejected.',
  })
  approvedAt!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Profile id of the admin who approved/rejected this account. Null for profiles created before self-service sign-up existed.',
  })
  approvedBy!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Note the admin left when rejecting the request. Admin-facing only.',
  })
  rejectionReason!: string | null;

  @ApiProperty({ description: 'ISO timestamp the account was requested/created.' })
  createdAt!: string;
}
