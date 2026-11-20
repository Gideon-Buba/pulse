import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RagStatus } from '../../types/database';
import { InitiativeUpdateDto } from './initiative-update.dto';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];

/** A TWG meeting date that has at least one update filed against it. */
export class MeetingSummaryDto {
  @ApiProperty({ description: 'TWG meeting date (YYYY-MM-DD).' })
  meeting_date!: string;

  @ApiProperty({ description: 'Number of distinct initiatives with an update for this meeting.' })
  initiatives_updated!: number;

  @ApiProperty({
    description: 'Total update rows filed for this meeting (including resubmissions).',
  })
  update_count!: number;
}

/** One initiative's position at a given TWG meeting. */
export class MeetingInitiativeDto {
  @ApiProperty({ description: 'Initiative id (uuid).' })
  initiative_id!: string;

  @ApiProperty({ description: 'Initiative title.' })
  title!: string;

  @ApiProperty({
    enum: RAG_STATUS_VALUES,
    description: "The initiative's status today (not at the meeting).",
  })
  current_status!: RagStatus;

  @ApiPropertyOptional({
    type: InitiativeUpdateDto,
    nullable: true,
    description:
      'The update filed for this meeting. If more than one was filed, the latest submission ' +
      '(the one the snapshot used). Null if nothing was submitted for this meeting.',
  })
  update!: InitiativeUpdateDto | null;

  @ApiProperty({
    description:
      'How many updates were filed for this initiative for this meeting (>1 means resubmitted).',
  })
  submission_count!: number;
}

/** A workstream's slice of a TWG meeting. */
export class MeetingWorkstreamDto {
  @ApiProperty({ description: 'Workstream id (uuid).' })
  workstream_id!: string;

  @ApiProperty({ description: 'Workstream name.' })
  workstream_name!: string;

  @ApiProperty({
    description: 'Active initiatives in this workstream with an update for this meeting.',
  })
  submitted_count!: number;

  @ApiProperty({
    type: [MeetingInitiativeDto],
    description: 'Every active initiative in the workstream.',
  })
  initiatives!: MeetingInitiativeDto[];
}

/** Everything filed for one TWG meeting, grouped by workstream like the deck. */
export class MeetingDetailDto {
  @ApiProperty({ description: 'TWG meeting date (YYYY-MM-DD).' })
  meeting_date!: string;

  @ApiProperty({
    description:
      'Active (non-archived) initiatives — the denominator for submission coverage. Based on ' +
      "today's initiative list, so initiatives added after this meeting are counted too.",
  })
  total_initiatives!: number;

  @ApiProperty({ description: 'Active initiatives with at least one update for this meeting.' })
  submitted_count!: number;

  @ApiProperty({
    type: [MeetingWorkstreamDto],
    description: 'Active workstreams in display order.',
  })
  workstreams!: MeetingWorkstreamDto[];
}
