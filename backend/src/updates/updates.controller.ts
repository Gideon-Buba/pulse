import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InitiativeUpdateDto } from './dto/initiative-update.dto';
import { SubmitUpdateDto } from './dto/submit-update.dto';
import { UpdatesService } from './updates.service';
import { WorkstreamScopeGuard } from './workstream-scope.guard';

@ApiTags('updates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('initiatives/:id/updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List the fortnightly update history for an initiative, newest TWG meeting first. Each ' +
      'update includes who submitted it, the status it moved from, and the milestones the lead ' +
      'reported on. The full audit trail is readable by everyone authenticated.',
  })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 200, type: [InitiativeUpdateDto] })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  findAll(@AccessToken() token: string, @Param('id') id: string): Promise<InitiativeUpdateDto[]> {
    return this.updatesService.findAllForInitiative(token, id);
  }

  @Post()
  @UseGuards(WorkstreamScopeGuard)
  @ApiOperation({
    summary:
      'Submit a fortnightly update for an initiative, optionally with per-milestone detail ' +
      '(the current milestone plus any others reported on). This is the append-only path leads ' +
      'use instead of editing the initiative directly — triggers promote the newest submission ' +
      'onto the initiative and milestone snapshots. The update and its milestone entries are ' +
      'saved together or not at all.',
  })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 201, type: InitiativeUpdateDto })
  @ApiResponse({
    status: 400,
    description:
      'Invalid body: e.g. a milestone that is not under this initiative, the same milestone ' +
      'listed twice, or more than one milestone flagged is_current.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Caller is a workstream_lead submitting for an initiative outside their workstream.',
  })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  submit(
    @AccessToken() token: string,
    @Param('id') id: string,
    @Body() dto: SubmitUpdateDto,
  ): Promise<InitiativeUpdateDto> {
    return this.updatesService.submit(token, id, dto);
  }
}
