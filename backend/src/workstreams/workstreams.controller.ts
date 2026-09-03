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
import { CreateWorkstreamDto } from './dto/create-workstream.dto';
import { ListWorkstreamsQueryDto } from './dto/list-workstreams-query.dto';
import { UpdateWorkstreamDto } from './dto/update-workstream.dto';
import { WorkstreamDto } from './dto/workstream.dto';
import { WorkstreamSummaryDto } from './dto/workstream-summary.dto';
import { WorkstreamsService } from './workstreams.service';

@ApiTags('workstreams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workstreams')
export class WorkstreamsController {
  constructor(private readonly workstreamsService: WorkstreamsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List all workstreams, in TWG display order. Archived workstreams are excluded unless include_archived=true.',
  })
  @ApiResponse({ status: 200, type: [WorkstreamDto] })
  findAll(
    @AccessToken() token: string,
    @Query() query: ListWorkstreamsQueryDto,
  ): Promise<WorkstreamDto[]> {
    return this.workstreamsService.findAll(token, query.include_archived ?? false);
  }

  @Get('summary')
  @ApiOperation({
    summary:
      'Per-workstream initiative counts by RAG status — replaces the old Excel Summary sheet.',
  })
  @ApiResponse({ status: 200, type: [WorkstreamSummaryDto] })
  summary(@AccessToken() token: string): Promise<WorkstreamSummaryDto[]> {
    return this.workstreamsService.summary(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single workstream by id.' })
  @ApiParam({ name: 'id', description: 'Workstream id (uuid).' })
  @ApiResponse({ status: 200, type: WorkstreamDto })
  @ApiResponse({ status: 404, description: 'No workstream with that id.' })
  findOne(@AccessToken() token: string, @Param('id') id: string): Promise<WorkstreamDto> {
    return this.workstreamsService.findOne(token, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({ summary: 'Admin/SMO-only: create a new workstream.' })
  @ApiResponse({ status: 201, type: WorkstreamDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  create(@AccessToken() token: string, @Body() dto: CreateWorkstreamDto): Promise<WorkstreamDto> {
    return this.workstreamsService.create(token, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({ summary: 'Admin/SMO-only: rename a workstream or change its display order.' })
  @ApiParam({ name: 'id', description: 'Workstream id (uuid).' })
  @ApiResponse({ status: 200, type: WorkstreamDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No workstream with that id.' })
  update(
    @AccessToken() token: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkstreamDto,
  ): Promise<WorkstreamDto> {
    return this.workstreamsService.update(token, id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({
    summary:
      'Admin/SMO-only: archive (soft-delete) a workstream. Refuses if it still has active ' +
      'initiatives. The row is never hard-deleted — see POST /workstreams/:id/restore.',
  })
  @ApiParam({ name: 'id', description: 'Workstream id (uuid).' })
  @ApiResponse({ status: 200, type: WorkstreamDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No workstream with that id.' })
  @ApiResponse({ status: 409, description: 'Workstream still has active initiatives.' })
  archive(@AccessToken() token: string, @Param('id') id: string): Promise<WorkstreamDto> {
    return this.workstreamsService.archive(token, id);
  }

  @Post(':id/restore')
  @UseGuards(RolesGuard)
  @Roles('admin', 'smo')
  @ApiOperation({ summary: 'Admin/SMO-only: restore a previously archived workstream.' })
  @ApiParam({ name: 'id', description: 'Workstream id (uuid).' })
  @ApiResponse({ status: 200, type: WorkstreamDto })
  @ApiResponse({ status: 403, description: 'Caller is not admin or smo.' })
  @ApiResponse({ status: 404, description: 'No workstream with that id.' })
  restore(@AccessToken() token: string, @Param('id') id: string): Promise<WorkstreamDto> {
    return this.workstreamsService.restore(token, id);
  }
}
