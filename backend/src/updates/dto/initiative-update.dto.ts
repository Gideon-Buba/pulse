import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];

/** One row of the append-only fortnightly submission log for an initiative. */
export class InitiativeUpdateDto {
  @ApiProperty({ description: 'Update id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'Initiative this update was submitted for.' })
  initiative_id!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Profile id of whoever submitted this.',
  })
  submitted_by!: string | null;

  @ApiProperty({ description: 'The TWG meeting date (YYYY-MM-DD) this update is for.' })
  meeting_date!: string;

  @ApiProperty({ enum: RAG_STATUS_VALUES })
  status!: RagStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  target!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  actual!: string | null;

  @ApiProperty({ description: 'The fortnightly progress narrative.' })
  latest_update!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  decisions_needed!: string | null;

  @ApiProperty({ description: 'ISO timestamp this update was submitted.' })
  created_at!: string;
}
