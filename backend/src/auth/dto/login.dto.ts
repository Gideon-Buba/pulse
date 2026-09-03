import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'lead@nrs.gov.ng', description: "The user's Pulse account email." })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "The user's Pulse account password." })
  @IsString()
  @MinLength(8)
  password!: string;
}
