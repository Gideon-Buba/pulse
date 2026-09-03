import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];

export class ListInitiativesQueryDto {
  @ApiPropertyOptional({ description: 'Filter to initiatives in a single workstream.' })
  @IsOptional()
  @IsUUID()
  workstream_id?: string;

  @ApiPropertyOptional({ enum: RAG_STATUS_VALUES, description: 'Filter by current RAG status.' })
  @IsOptional()
  @IsIn(RAG_STATUS_VALUES)
  status?: RagStatus;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Include archived (soft-deleted) initiatives in the results.',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_archived?: boolean;
}
