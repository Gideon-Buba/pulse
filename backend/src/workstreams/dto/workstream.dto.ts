import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkstreamDto {
  @ApiProperty({ description: 'Workstream id (uuid).' })
  id!: string;

  @ApiProperty({ description: "The TWG's name for this organizational grouping." })
  name!: string;

  @ApiProperty({ description: 'Display order in TWG materials — ascending.' })
  sort_order!: number;

  @ApiProperty({ description: 'ISO timestamp the workstream row was created.' })
  created_at!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'ISO timestamp this workstream was archived (soft-deleted). Null = active.',
  })
  archived_at!: string | null;
}
