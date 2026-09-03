import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { LGate, RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
const L_GATE_VALUES: LGate[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

/** Admin/SMO-only: edit an existing milestone. */
export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: 'Milestone title.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ enum: L_GATE_VALUES, nullable: true })
  @IsOptional()
  @IsIn(L_GATE_VALUES)
  l_gate_stage?: LGate | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Directorate owner.' })
  @IsOptional()
  @IsString()
  directorate_owner?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Target date (YYYY-MM-DD). Treat as approximate — see MilestoneDto.',
  })
  @IsOptional()
  @IsDateString()
  target_date?: string | null;

  @ApiPropertyOptional({ enum: RAG_STATUS_VALUES })
  @IsOptional()
  @IsIn(RAG_STATUS_VALUES)
  status?: RagStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  challenges?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  upcoming_milestone?: string | null;

  @ApiPropertyOptional({ description: 'Display order within the parent initiative.' })
  @IsOptional()
  @IsInt()
  sequence?: number;
}
