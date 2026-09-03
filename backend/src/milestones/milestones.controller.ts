import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { MilestoneDto } from './dto/milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestonesService } from './milestones.service';

@ApiTags('milestones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('initiatives/:initiativeId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get()
  @ApiOperation({ summary: 'List milestones for one initiative, in display order.' })
  @ApiParam({ name: 'initiativeId', description: 'Parent initiative id (uuid).' })
  @ApiResponse({ status: 200, type: [MilestoneDto] })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  findAllForInitiative(
    @AccessToken() token: string,
    @Param('initiativeId') initiativeId: string,
  ): Promise<MilestoneDto[]> {
    return this.milestonesService.findAllForInitiative(token, initiativeId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({
    summary:
      'Admin/SMO-only: add a new milestone under an initiative. Appends to the end unless a sequence is given.',
  })
  @ApiParam({ name: 'initiativeId', description: 'Parent initiative id (uuid).' })
  @ApiResponse({ status: 201, type: MilestoneDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  create(
    @AccessToken() token: string,
    @Param('initiativeId') initiativeId: string,
    @Body() dto: CreateMilestoneDto,
  ): Promise<MilestoneDto> {
    return this.milestonesService.create(token, initiativeId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({ summary: 'Admin/SMO-only: edit an existing milestone.' })
  @ApiParam({ name: 'initiativeId', description: 'Parent initiative id (uuid).' })
  @ApiParam({ name: 'id', description: 'Milestone id (uuid).' })
  @ApiResponse({ status: 200, type: MilestoneDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No milestone with that id under this initiative.' })
  update(
    @AccessToken() token: string,
    @Param('initiativeId') initiativeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
  ): Promise<MilestoneDto> {
    return this.milestonesService.update(token, initiativeId, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Admin/SMO-only: permanently delete a milestone. Unlike initiatives/workstreams this is ' +
      'a hard delete — a milestone carries no history of its own.',
  })
  @ApiParam({ name: 'initiativeId', description: 'Parent initiative id (uuid).' })
  @ApiParam({ name: 'id', description: 'Milestone id (uuid).' })
  @ApiResponse({ status: 204, description: 'Deleted.' })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No milestone with that id under this initiative.' })
  remove(
    @AccessToken() token: string,
    @Param('initiativeId') initiativeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.milestonesService.remove(token, initiativeId, id);
  }
}
