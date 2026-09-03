import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWorkstreamDto {
  @ApiProperty({ description: "The TWG's name for this organizational grouping." })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    description: 'Display order in TWG materials — ascending. Defaults to last if omitted.',
  })
  @IsOptional()
  @IsInt()
  sort_order?: number;
}
