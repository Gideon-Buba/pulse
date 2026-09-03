import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../types/database';

export class AuthUserDto {
  @ApiProperty({ description: 'Profile id — matches the Supabase auth user id.' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({
    enum: ['admin', 'smo', 'workstream_lead'],
    description:
      'admin/smo can read and write everything. workstream_lead is scoped to workstreamId.',
  })
  role!: UserRole;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The workstream this user is scoped to. Always null for admin/smo.',
  })
  workstreamId!: string | null;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Bearer token — pass as `Authorization: Bearer <accessToken>`.' })
  accessToken!: string;

  @ApiProperty({ description: 'Supabase refresh token, for obtaining a new access token.' })
  refreshToken!: string;

  @ApiProperty({ description: 'Unix epoch seconds at which accessToken expires.' })
  expiresAt!: number;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
