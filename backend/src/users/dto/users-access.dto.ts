import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { MIN_ACCESS_CODE_LENGTH } from '../users-access.crypto';

export class UnlockUsersSectionDto {
  @ApiProperty({
    description: 'The shared Users-section access code. Not the admin’s own login password.',
  })
  @IsString()
  @MinLength(1, { message: 'Enter the access code.' })
  @MaxLength(200)
  accessCode!: string;
}

export class UnlockUsersSectionResponseDto {
  @ApiProperty({
    description:
      'Short-lived ticket. Send it as the `x-pulse-users-access` header on every /admin/users request. Bound to this admin — useless with another account’s token.',
  })
  ticket!: string;

  @ApiProperty({
    description:
      'Unix epoch milliseconds the ticket expires, after which the code must be re-entered.',
  })
  expiresAt!: number;
}

export class UsersAccessStatusDto {
  @ApiProperty({
    description:
      'False when no access code has been set on this deployment yet — the Users section stays locked until an admin runs `npm run users:set-code` in backend/.',
  })
  configured!: boolean;
}

export class ChangeAccessCodeDto {
  @ApiProperty({ description: 'The access code currently in force.' })
  @IsString()
  @MinLength(1, { message: 'Enter the current access code.' })
  @MaxLength(200)
  currentAccessCode!: string;

  @ApiProperty({
    description: `The new access code, at least ${MIN_ACCESS_CODE_LENGTH} characters.`,
    minLength: MIN_ACCESS_CODE_LENGTH,
  })
  @IsString()
  @MinLength(MIN_ACCESS_CODE_LENGTH, {
    message: `The access code must be at least ${MIN_ACCESS_CODE_LENGTH} characters.`,
  })
  @MaxLength(200)
  newAccessCode!: string;
}
