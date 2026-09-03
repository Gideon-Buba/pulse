import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { LGate, RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
const L_GATE_VALUES: LGate[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

/**
 * Admin/SMO-only direct correction of the initiative snapshot. Bypasses the
 * normal `initiative_updates` fortnightly flow — use for fixing mistakes,
 * not for routine reporting. `workstream_id` is deliberately not
 * correctable here; reassigning an initiative to a different workstream is
 * a bigger operation than a snapshot correction.
 */
export class UpdateInitiativeDto {
  @ApiPropertyOptional({ description: 'Corrected title.' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Corrected directorate owner.',
  })
  @IsOptional()
  @IsString()
  directorate_owner?: string | null;

  @ApiPropertyOptional({ enum: L_GATE_VALUES, nullable: true })
  @IsOptional()
  @IsIn(L_GATE_VALUES)
  l_gate_stage?: LGate | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  kpi_expected_impact?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  target?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  actual?: string | null;

  @ApiPropertyOptional({ enum: RAG_STATUS_VALUES })
  @IsOptional()
  @IsIn(RAG_STATUS_VALUES)
  status?: RagStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  latest_update?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  decisions_needed?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Date (YYYY-MM-DD) this corrected snapshot reflects.',
  })
  @IsOptional()
  @IsDateString()
  update_as_at?: string | null;
}
