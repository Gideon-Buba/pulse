import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilestoneHistoryEntryDto } from './dto/milestone-history-entry.dto';
import { UpdatesService } from './updates.service';

/**
 * Lives in UpdatesModule (not MilestonesModule) because it reads the update
 * log, but is tagged `milestones` so it sits with the other milestone routes
 * in Swagger.
 */
@ApiTags('milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('initiatives/:initiativeId/milestones/:milestoneId/history')
export class MilestoneHistoryController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Show how one milestone has progressed across TWG meetings: every update that reported ' +
      'on it, newest first, with the status it moved from and to, the note, and who submitted it.',
  })
  @ApiParam({ name: 'initiativeId', description: 'Parent initiative id (uuid).' })
  @ApiParam({ name: 'milestoneId', description: 'Milestone id (uuid).' })
  @ApiResponse({ status: 200, type: [MilestoneHistoryEntryDto] })
  @ApiResponse({ status: 404, description: 'No milestone with that id under this initiative.' })
  findAll(
    @AccessToken() token: string,
    @Param('initiativeId') initiativeId: string,
    @Param('milestoneId') milestoneId: string,
  ): Promise<MilestoneHistoryEntryDto[]> {
    return this.updatesService.findMilestoneHistory(token, initiativeId, milestoneId);
  }
}
