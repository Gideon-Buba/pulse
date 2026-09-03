import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateInitiativeDto } from './dto/create-initiative.dto';
import { InitiativeDto } from './dto/initiative.dto';
import { ListInitiativesQueryDto } from './dto/list-initiatives-query.dto';
import { UpdateInitiativeDto } from './dto/update-initiative.dto';
import { InitiativesService } from './initiatives.service';

@ApiTags('initiatives')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('initiatives')
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List initiatives (current-state snapshot), optionally filtered by workstream and/or ' +
      'status. Archived initiatives are excluded unless include_archived=true.',
  })
  @ApiResponse({ status: 200, type: [InitiativeDto] })
  findAll(
    @AccessToken() token: string,
    @Query() query: ListInitiativesQueryDto,
  ): Promise<InitiativeDto[]> {
    return this.initiativesService.findAll(token, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single initiative by id.' })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 200, type: InitiativeDto })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  findOne(@AccessToken() token: string, @Param('id') id: string): Promise<InitiativeDto> {
    return this.initiativesService.findOne(token, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({
    summary:
      'Admin/SMO-only: register a new initiative against a workstream. Status defaults to ' +
      '"Not started" if omitted.',
  })
  @ApiResponse({ status: 201, type: InitiativeDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  create(@AccessToken() token: string, @Body() dto: CreateInitiativeDto): Promise<InitiativeDto> {
    return this.initiativesService.create(token, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({
    summary:
      'Admin/SMO-only direct correction to an initiative snapshot. Bypasses the normal ' +
      'fortnightly initiative_updates flow — use to fix mistakes, not for routine reporting.',
  })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 200, type: InitiativeDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  update(
    @AccessToken() token: string,
    @Param('id') id: string,
    @Body() dto: UpdateInitiativeDto,
  ): Promise<InitiativeDto> {
    return this.initiativesService.update(token, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({
    summary:
      'Admin/SMO-only: archive (soft-delete) an initiative. Its milestones and update history ' +
      'are kept intact — see POST /initiatives/:id/restore.',
  })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 200, type: InitiativeDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  archive(@AccessToken() token: string, @Param('id') id: string): Promise<InitiativeDto> {
    return this.initiativesService.archive(token, id);
  }

  @Post(':id/restore')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({ summary: 'Admin/SMO-only: restore a previously archived initiative.' })
  @ApiParam({ name: 'id', description: 'Initiative id (uuid).' })
  @ApiResponse({ status: 200, type: InitiativeDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No initiative with that id.' })
  restore(@AccessToken() token: string, @Param('id') id: string): Promise<InitiativeDto> {
    return this.initiativesService.restore(token, id);
  }
}
