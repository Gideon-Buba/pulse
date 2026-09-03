import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { LGate, RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
const L_GATE_VALUES: LGate[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

/** Admin/SMO-only: register a new initiative against a workstream. */
export class CreateInitiativeDto {
  @ApiProperty({ description: 'Id of the workstream this initiative belongs to.' })
  @IsUUID()
  workstream_id!: string;

  @ApiProperty({ description: 'Initiative title as shown in TWG materials.' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Directorate owner.' })
  @IsOptional()
  @IsString()
  directorate_owner?: string | null;

  @ApiPropertyOptional({ enum: L_GATE_VALUES, nullable: true })
  @IsOptional()
  @IsIn(L_GATE_VALUES)
  l_gate_stage?: LGate | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'KPI / expected impact narrative.',
  })
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

  @ApiPropertyOptional({
    enum: RAG_STATUS_VALUES,
    default: 'Not started',
    description: 'Defaults to "Not started" if omitted.',
  })
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
    description: 'Date (YYYY-MM-DD) this snapshot reflects.',
  })
  @IsOptional()
  @IsDateString()
  update_as_at?: string | null;
}
