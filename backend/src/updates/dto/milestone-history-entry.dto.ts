import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubmitterDto, UpdateMilestoneEntryDto } from './initiative-update.dto';

/** One point in a milestone's history: an entry plus the context of the update it came from. */
export class MilestoneHistoryEntryDto extends UpdateMilestoneEntryDto {
  @ApiProperty({
    description: 'The TWG meeting date (YYYY-MM-DD) of the update this entry was part of.',
  })
  meeting_date!: string;

  @ApiPropertyOptional({
    type: SubmitterDto,
    nullable: true,
    description: 'Who submitted the update this entry was part of.',
  })
  submitter!: SubmitterDto | null;
}
