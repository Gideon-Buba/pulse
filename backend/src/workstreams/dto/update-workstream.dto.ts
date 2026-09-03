import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateWorkstreamDto {
  @ApiPropertyOptional({ description: 'Renamed workstream label.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: 'Display order in TWG materials — ascending.' })
  @IsOptional()
  @IsInt()
  sort_order?: number;
}
