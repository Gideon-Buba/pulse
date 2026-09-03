import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
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
      'List the fortnightly update history for an initiative, newest first. The full audit ' +
      'trail is readable by everyone authenticated.',
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
      'Submit a fortnightly update for an initiative. This is the append-only path leads use ' +
      'instead of editing the initiative directly — a trigger promotes the newest submission ' +
      'onto the initiative snapshot.',
  })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 201, type: InitiativeUpdateDto })
  @ApiResponse({
    status: 403,
    description:
      'Caller is a workstream_lead submitting for an initiative outside their workstream.',
  })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  submit(
    @AccessToken() token: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitUpdateDto,
  ): Promise<InitiativeUpdateDto> {
    return this.updatesService.submit(token, user, id, dto);
  }
}
