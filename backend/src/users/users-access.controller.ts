import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  ChangeAccessCodeDto,
  UnlockUsersSectionDto,
  UnlockUsersSectionResponseDto,
  UsersAccessStatusDto,
} from './dto/users-access.dto';
import { UsersAccessService } from './users-access.service';

/**
 * The lock on the Users section. Admin-only, but deliberately NOT behind
 * `UsersAccessGuard` — this is where the ticket that guard wants is issued.
 */
@ApiTags('users-access')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users-access')
export class UsersAccessController {
  constructor(private readonly usersAccess: UsersAccessService) {}

  @Get()
  @ApiOperation({
    summary:
      'Whether a Users-section access code has been set on this deployment. Lets the UI say ' +
      '"not configured yet" instead of silently rejecting every code typed.',
  })
  @ApiResponse({ status: 200, type: UsersAccessStatusDto })
  @ApiResponse({ status: 403, description: 'Caller is not an admin.' })
  async status(): Promise<UsersAccessStatusDto> {
    return { configured: await this.usersAccess.isConfigured() };
  }

  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Exchange the shared Users-section access code for a short-lived ticket (30 minutes). ' +
      'Send that ticket as the `x-pulse-users-access` header on every /admin/users request. ' +
      'This is a second factor on top of being an admin: signing in to Pulse is not enough to ' +
      'read or manage accounts.',
  })
  @ApiResponse({ status: 200, type: UnlockUsersSectionResponseDto })
  @ApiResponse({ status: 401, description: 'Incorrect access code.' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin.' })
  @ApiResponse({
    status: 503,
    description:
      'No access code has been configured yet — run `npm run users:set-code` in backend/.',
  })
  async unlock(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnlockUsersSectionDto,
  ): Promise<UnlockUsersSectionResponseDto> {
    const ticket = await this.usersAccess.unlock(user.id, dto.accessCode);
    return { ticket: ticket.token, expiresAt: ticket.expiresAt };
  }

  @Post('code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Rotate the Users-section access code. Requires the current code — there is no ' +
      '"forgot the access code" flow by design. If it is lost, reset it server-side with ' +
      '`npm run users:set-code` in backend/.',
  })
  @ApiResponse({ status: 204, description: 'Access code changed.' })
  @ApiResponse({ status: 400, description: 'The new code is shorter than 8 characters.' })
  @ApiResponse({ status: 401, description: 'The current access code is incorrect.' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin.' })
  @ApiResponse({ status: 503, description: 'No access code has been configured yet.' })
  async changeCode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeAccessCodeDto,
  ): Promise<void> {
    await this.usersAccess.changeAccessCode(user.id, dto.currentAccessCode, dto.newAccessCode);
  }
}
