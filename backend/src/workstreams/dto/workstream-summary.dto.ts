import { ApiProperty } from '@nestjs/swagger';

/**
 * Row shape of the `workstream_summary` view — a formula-free replacement
 * for the old Excel Summary sheet. Counts by RAG status per workstream.
 */
export class WorkstreamSummaryDto {
  @ApiProperty({ description: 'Workstream name.' })
  workstream!: string;

  @ApiProperty({ description: 'Total initiatives in this workstream.' })
  initiatives!: number;

  @ApiProperty({ description: 'Count with status "Not started".' })
  not_started!: number;

  @ApiProperty({ description: 'Count with status "In progress".' })
  in_progress!: number;

  @ApiProperty({ description: 'Count with status "Completed".' })
  completed!: number;

  @ApiProperty({ description: 'Count with status "Delayed/at risk".' })
  delayed_at_risk!: number;
}
