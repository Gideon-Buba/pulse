import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RagStatus, UserRole } from '../../types/database';

const RAG_STATUS_VALUES: RagStatus[] = [
  'Not started',
  'In progress',
  'Completed',
  'Delayed/at risk',
];
const USER_ROLE_VALUES: UserRole[] = ['admin', 'smo', 'workstream_lead'];

/** Who submitted an update. Name and role only — never email. */
export class SubmitterDto {
  @ApiProperty({ description: 'Profile id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'Display name of the submitter.' })
  full_name!: string;

  @ApiProperty({ enum: USER_ROLE_VALUES, description: "Submitter's role at the time of reading." })
  role!: UserRole;
}

/** One milestone reported on within an update. */
export class UpdateMilestoneEntryDto {
  @ApiProperty({ description: 'Entry id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'The update this entry belongs to.' })
  update_id!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Milestone id (uuid). Null if the milestone has since been deleted.',
  })
  milestone_id!: string | null;

  @ApiProperty({
    description:
      'Milestone title as it was when the update was submitted (survives later renames/deletes).',
  })
  milestone_title!: string;

  @ApiProperty({
    description: 'True if the lead flagged this as the milestone the initiative is currently on.',
  })
  is_current!: boolean;

  @ApiPropertyOptional({
    enum: RAG_STATUS_VALUES,
    nullable: true,
    description: 'Milestone status immediately before this entry was applied.',
  })
  previous_status!: RagStatus | null;

  @ApiProperty({ enum: RAG_STATUS_VALUES, description: 'Milestone status reported in this entry.' })
  status!: RagStatus;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Progress note on this milestone.',
  })
  note!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Challenges reported on this milestone.',
  })
  challenges!: string | null;

  @ApiProperty({ description: 'ISO timestamp this entry was submitted.' })
  created_at!: string;
}

/** One row of the append-only fortnightly submission log for an initiative, with its milestone detail. */
export class InitiativeUpdateDto {
  @ApiProperty({ description: 'Update id (uuid).' })
  id!: string;

  @ApiProperty({ description: 'Initiative this update was submitted for.' })
  initiative_id!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Profile id of whoever submitted this. Null for seeded/imported history.',
  })
  submitted_by!: string | null;

  @ApiPropertyOptional({
    type: SubmitterDto,
    nullable: true,
    description: 'Name and role of the submitter. Null for seeded/imported history.',
  })
  submitter!: SubmitterDto | null;

  @ApiProperty({ description: 'The TWG meeting date (YYYY-MM-DD) this update is for.' })
  meeting_date!: string;

  @ApiProperty({
    enum: RAG_STATUS_VALUES,
    description: 'Initiative RAG status reported in this update.',
  })
  status!: RagStatus;

  @ApiPropertyOptional({
    enum: RAG_STATUS_VALUES,
    nullable: true,
    description:
      'Initiative status in the previous update (by meeting date). Null for the first update ' +
      'on record. Compare with `status` to show a transition.',
  })
  previous_status!: RagStatus | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Target narrative. Null means "unchanged from before", not "cleared".',
  })
  target!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Actual-progress narrative. Null means "unchanged from before", not "cleared".',
  })
  actual!: string | null;

  @ApiProperty({ description: 'The fortnightly progress narrative.' })
  latest_update!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Decision the TWG needs to make, if any.',
  })
  decisions_needed!: string | null;

  @ApiProperty({
    type: [UpdateMilestoneEntryDto],
    description:
      'Milestones reported on in this update — the current milestone (is_current) first. ' +
      'Empty for updates submitted before milestone-level reporting existed.',
  })
  milestones!: UpdateMilestoneEntryDto[];

  @ApiProperty({ description: 'ISO timestamp this update was submitted.' })
  created_at!: string;
}
