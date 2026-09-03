import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];

/** The fortnightly submission a workstream lead (or admin/smo) files for one initiative. */
export class SubmitUpdateDto {
  @ApiProperty({ description: 'The TWG meeting date (YYYY-MM-DD) this update is for.' })
  @IsDateString()
  meeting_date!: string;

  @ApiProperty({ enum: RAG_STATUS_VALUES, description: 'Current RAG status as of this update.' })
  @IsIn(RAG_STATUS_VALUES)
  status!: RagStatus;

  @ApiPropertyOptional({ description: 'Updated target narrative, if it has changed.' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ description: 'Updated actual-progress narrative, if it has changed.' })
  @IsOptional()
  @IsString()
  actual?: string;

  @ApiProperty({ description: 'The fortnightly progress narrative for this initiative.' })
  @IsString()
  @IsNotEmpty()
  latest_update!: string;

  @ApiPropertyOptional({ description: 'Any decision the TWG needs to make on this initiative.' })
  @IsOptional()
  @IsString()
  decisions_needed?: string;
}
