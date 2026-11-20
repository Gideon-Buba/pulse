import { BadRequestException, Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeetingDetailDto, MeetingSummaryDto } from './dto/meeting.dto';
import { UpdatesService } from './updates.service';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

@ApiTags('meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get()
  @ApiOperation({
    summary:
      'List every TWG meeting date that has updates filed against it, newest first, with how ' +
      'many initiatives were updated.',
  })
  @ApiResponse({ status: 200, type: [MeetingSummaryDto] })
  findAll(@AccessToken() token: string): Promise<MeetingSummaryDto[]> {
    return this.updatesService.listMeetings(token);
  }

  @Get(':date')
  @ApiOperation({
    summary:
      'Everything filed for one TWG meeting, grouped by workstream like the deck. Every active ' +
      'initiative is listed, so initiatives with no update for this meeting show up as gaps.',
  })
  @ApiParam({ name: 'date', description: 'TWG meeting date, YYYY-MM-DD.', example: '2026-08-18' })
  @ApiResponse({ status: 200, type: MeetingDetailDto })
  @ApiResponse({ status: 400, description: 'Date is not in YYYY-MM-DD format.' })
  findOne(@AccessToken() token: string, @Param('date') date: string): Promise<MeetingDetailDto> {
    if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) {
      throw new BadRequestException('Meeting date must be in YYYY-MM-DD format.');
    }
    return this.updatesService.getMeeting(token, date);
  }
}
