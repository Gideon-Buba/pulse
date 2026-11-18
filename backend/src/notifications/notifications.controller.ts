import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessToken } from '../auth/access-token.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary:
      "The caller's own notifications, newest first (max 50). Today the only kind is an " +
      'account-request alert sent to admins when somebody signs up and needs approval.',
  })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  list(
    @AccessToken() token: string,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationDto[]> {
    return this.notifications.listForUser(token, query.unread_only ?? false);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark one of the caller’s own notifications as read.' })
  @ApiParam({ name: 'id', description: 'Notification id (uuid).' })
  @ApiResponse({ status: 201, type: NotificationDto })
  @ApiResponse({ status: 404, description: 'No such notification for this caller.' })
  markRead(@AccessToken() token: string, @Param('id') id: string): Promise<NotificationDto> {
    return this.notifications.markRead(token, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark every unread notification for the caller as read.' })
  @ApiResponse({ status: 204, description: 'All notifications marked read.' })
  markAllRead(@AccessToken() token: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.notifications.markAllRead(token, user.id);
  }
}
