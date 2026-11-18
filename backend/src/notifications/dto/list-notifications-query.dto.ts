import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Return only notifications the caller has not read yet.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unread_only?: boolean;
}
