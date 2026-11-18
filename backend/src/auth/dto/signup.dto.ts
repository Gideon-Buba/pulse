import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsNrsEmail, NRS_EMAIL_MESSAGE } from '../nrs-email';

export class SignupDto {
  @ApiProperty({
    example: 'John Lewis',
    description: 'The person’s full name, as it should appear in Pulse.',
  })
  @IsString()
  @MinLength(2, { message: 'Enter your full name.' })
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({
    example: 'john.lewis@nrs.gov.ng',
    description: `NRS work email. ${NRS_EMAIL_MESSAGE}`,
  })
  @IsNrsEmail()
  email!: string;

  @ApiProperty({
    description: 'Chosen password, at least 8 characters.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(72)
  password!: string;
}
