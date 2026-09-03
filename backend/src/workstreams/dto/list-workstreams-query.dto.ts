import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class ListWorkstreamsQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Include archived (soft-deleted) workstreams in the results.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_archived?: boolean;
}
