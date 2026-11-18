import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsNrsEmail, NRS_EMAIL_MESSAGE } from '../nrs-email';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'john.lewis@nrs.gov.ng',
    description: `The NRS email of an existing, approved Pulse account. ${NRS_EMAIL_MESSAGE}`,
  })
  @IsNrsEmail()
  email!: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Human-readable confirmation, safe to show the user as-is.',
    example: 'A password reset link has been sent to john.lewis@nrs.gov.ng.',
  })
  message!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'The recovery token from the emailed reset link (the `access_token` in the link’s URL fragment), or the token from an admin-issued reset link.',
  })
  @IsString()
  @MinLength(10)
  token!: string;

  @ApiProperty({ description: 'The new password, at least 8 characters.', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(72)
  password!: string;
}
