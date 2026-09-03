import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LGate, RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
const L_GATE_VALUES: LGate[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

export class InitiativeDto {
  @ApiProperty({ description: 'Initiative id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'Id of the workstream this initiative belongs to.' })
  workstream_id!: string;

  @ApiProperty({ description: 'Initiative title as shown in TWG materials.' })
  title!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Directorate that owns this initiative. Empty on every row currently — a known data ' +
      'gap inherited from the prior SharePoint register, not a Pulse defect. Do not backfill with guesses.',
  })
  directorate_owner!: string | null;

  @ApiPropertyOptional({ enum: L_GATE_VALUES, nullable: true, description: 'L-Gate stage.' })
  l_gate_stage!: LGate | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'KPI / expected impact narrative.',
  })
  kpi_expected_impact!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Target narrative for this initiative.',
  })
  target!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Actual progress narrative.' })
  actual!: string | null;

  @ApiProperty({ enum: RAG_STATUS_VALUES, description: 'Current RAG status.' })
  status!: RagStatus;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Latest fortnightly update narrative.',
  })
  latest_update!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Decisions needed from the TWG, if any.',
  })
  decisions_needed!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Date (YYYY-MM-DD) this snapshot reflects — set by the latest applied update.',
  })
  update_as_at!: string | null;

  @ApiProperty({ description: 'ISO timestamp the initiative row was created.' })
  created_at!: string;

  @ApiProperty({ description: 'ISO timestamp of the last change to this row.' })
  updated_at!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'ISO timestamp this initiative was archived (soft-deleted). Null = active.',
  })
  archived_at!: string | null;
}
