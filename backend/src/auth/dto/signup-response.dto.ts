import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '../../types/database';

export class SignupResponseDto {
  @ApiProperty({ example: 'john.lewis@nrs.gov.ng' })
  email!: string;

  @ApiProperty({ example: 'John Lewis' })
  fullName!: string;

  @ApiProperty({
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
    description:
      "Always 'pending' from this endpoint. No session is issued — the account cannot sign in until an admin approves it in the Users section.",
  })
  status!: AccountStatus;

  @ApiProperty({
    description:
      'Message to show the user — tells them approval is pending and to contact the admin if it takes too long.',
  })
  message!: string;
}
