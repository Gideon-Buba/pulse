import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { RagStatus } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];

/** What the lead is reporting about one milestone as part of their fortnightly update. */
export class SubmitMilestoneEntryDto {
  @ApiProperty({ description: 'Milestone id (uuid). Must belong to the initiative being updated.' })
  @IsUUID()
  milestone_id!: string;

  @ApiPropertyOptional({
    description:
      'True for the milestone the initiative is currently on. At most one entry per ' +
      'submission may set this. Defaults to false.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;

  @ApiProperty({
    enum: RAG_STATUS_VALUES,
    description: "Milestone RAG status as of this update. Becomes the milestone's current status.",
  })
  @IsIn(RAG_STATUS_VALUES)
  status!: RagStatus;

  @ApiPropertyOptional({ description: 'Progress note on this milestone since the last TWG.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description:
      "Challenges on this milestone. If given, replaces the milestone's current challenges text; " +
      'if omitted, the existing text is kept.',
  })
  @IsOptional()
  @IsString()
  challenges?: string;
}

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

  @ApiPropertyOptional({
    type: [SubmitMilestoneEntryDto],
    description:
      'Per-milestone detail: the milestone the initiative is currently on (flag it with ' +
      'is_current) plus any other milestones being reported on. Each milestone may appear once. ' +
      'Saved atomically with the update — if any entry is invalid, nothing is saved.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique((entry: SubmitMilestoneEntryDto) => entry.milestone_id, {
    message: 'Each milestone may only appear once per update.',
  })
  @ValidateNested({ each: true })
  @Type(() => SubmitMilestoneEntryDto)
  milestones?: SubmitMilestoneEntryDto[];
}
