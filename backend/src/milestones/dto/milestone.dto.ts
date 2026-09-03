import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LGate, RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
const L_GATE_VALUES: LGate[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

export class MilestoneDto {
  @ApiProperty({ description: 'Milestone id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'Id of the parent initiative.' })
  initiative_id!: string;

  @ApiProperty({ description: 'Milestone title.' })
  title!: string;

  @ApiPropertyOptional({ enum: L_GATE_VALUES, nullable: true, description: 'L-Gate stage.' })
  l_gate_stage!: LGate | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Directorate that owns this milestone. Empty on every row currently — same known data ' +
      'gap as initiatives.directorate_owner. Do not backfill with guesses.',
  })
  directorate_owner!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Approximate target date (YYYY-MM-DD) — parsed from month-level TWG deck labels ' +
      '(e.g. "Aug-26" → first of month) except where the deck gave an exact day. ' +
      'Do not present as a precise due date without this caveat.',
  })
  target_date!: string | null;

  @ApiProperty({ enum: RAG_STATUS_VALUES, description: 'Current RAG status.' })
  status!: RagStatus;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Challenges narrative.' })
  challenges!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Upcoming milestone narrative.',
  })
  upcoming_milestone!: string | null;

  @ApiProperty({ description: 'Display order within the parent initiative.' })
  sequence!: number;

  @ApiProperty({ description: 'ISO timestamp the milestone row was created.' })
  created_at!: string;

  @ApiProperty({ description: 'ISO timestamp of the last change to this row.' })
  updated_at!: string;
}
