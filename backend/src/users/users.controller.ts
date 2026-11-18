import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  ApproveUserDto,
  ListUsersQueryDto,
  RejectUserDto,
  ResetLinkResponseDto,
  UpdateUserDto,
} from './dto/manage-user.dto';
import { UserAccountDto } from './dto/user-account.dto';
import { USERS_ACCESS_HEADER, UsersAccessGuard } from './users-access.guard';
import { UsersService } from './users.service';

/**
 * The Users section. Every route needs all three of: an approved session,
 * the `admin` role, and a live access-code ticket — see
 * `UsersAccessService` for why the access code exists on top of the role.
 */
@ApiTags('users')
@ApiBearerAuth()
@ApiHeader({
  name: USERS_ACCESS_HEADER,
  required: true,
  description:
    'Users-section access ticket from POST /admin/users-access/unlock. Expires after 30 minutes, after which the access code must be entered again.',
})
@UseGuards(JwtAuthGuard, RolesGuard, UsersAccessGuard)
@Roles('admin')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({
    summary:
      'List every Pulse account with its approval state, role and workstream — newest request ' +
      'first. Filter with ?status=pending to see just the accounts waiting for approval.',
  })
  @ApiResponse({ status: 200, type: [UserAccountDto] })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an admin, or has not unlocked the Users section.',
  })
  list(@Query() query: ListUsersQueryDto): Promise<UserAccountDto[]> {
    return this.users.list(query.status);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary:
      'Approve a pending account, setting the role (and the workstream, for a lead) it should ' +
      'have. The person can sign in as soon as this succeeds.',
  })
  @ApiParam({ name: 'id', description: 'Profile id (uuid) of the account to approve.' })
  @ApiResponse({ status: 201, type: UserAccountDto })
  @ApiResponse({
    status: 400,
    description: 'role is workstream_lead but no workstreamId was given.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an admin, or has not unlocked the Users section.',
  })
  @ApiResponse({ status: 404, description: 'No account (or no workstream) with that id.' })
  @ApiResponse({
    status: 409,
    description: 'The account is already approved, or the workstream is archived.',
  })
  approve(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ApproveUserDto,
  ): Promise<UserAccountDto> {
    return this.users.approve(admin.id, id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary:
      'Decline an account request (or revoke an approved account). The account stays in the ' +
      'list, cannot sign in, and any live session it holds stops working on its next request.',
  })
  @ApiParam({ name: 'id', description: 'Profile id (uuid).' })
  @ApiResponse({ status: 201, type: UserAccountDto })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an admin, or has not unlocked the Users section.',
  })
  @ApiResponse({ status: 404, description: 'No account with that id.' })
  @ApiResponse({
    status: 409,
    description: 'You cannot reject your own account, or the only remaining approved admin.',
  })
  reject(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectUserDto,
  ): Promise<UserAccountDto> {
    return this.users.reject(admin.id, id, dto.reason);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Change an existing account’s name, role, or workstream. Role and workstream are kept ' +
      'consistent automatically: a lead must have a workstream, admin/smo must have none.',
  })
  @ApiParam({ name: 'id', description: 'Profile id (uuid).' })
  @ApiResponse({ status: 200, type: UserAccountDto })
  @ApiResponse({
    status: 400,
    description: 'Nothing to update, or a lead was left without a workstream.',
  })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an admin, or has not unlocked the Users section.',
  })
  @ApiResponse({ status: 404, description: 'No account (or no workstream) with that id.' })
  @ApiResponse({
    status: 409,
    description:
      'You cannot remove your own admin role, or demote the only remaining approved admin.',
  })
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserAccountDto> {
    return this.users.update(admin.id, id, dto);
  }

  @Post(':id/reset-link')
  @ApiOperation({
    summary:
      'Generate a one-time password reset link for an approved account and return it, without ' +
      'emailing anything. Use this when the project has no SMTP configured, or when someone ' +
      'cannot receive the automated email — the admin passes the link on directly.',
  })
  @ApiParam({ name: 'id', description: 'Profile id (uuid).' })
  @ApiResponse({ status: 201, type: ResetLinkResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an admin, or has not unlocked the Users section.',
  })
  @ApiResponse({ status: 404, description: 'No account with that id.' })
  @ApiResponse({ status: 409, description: 'The account is not approved yet.' })
  @ApiResponse({ status: 503, description: 'Supabase could not generate a recovery link.' })
  resetLink(@Param('id') id: string): Promise<ResetLinkResponseDto> {
    return this.users.issueResetLink(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Permanently delete an account. Submitted TWG updates are preserved — the append-only ' +
      'initiative_updates history keeps its rows and simply loses the link to this author.',
  })
  @ApiParam({ name: 'id', description: 'Profile id (uuid).' })
  @ApiResponse({ status: 204, description: 'Account deleted.' })
  @ApiResponse({
    status: 403,
    description: 'Caller is not an admin, or has not unlocked the Users section.',
  })
  @ApiResponse({ status: 404, description: 'No account with that id.' })
  @ApiResponse({
    status: 409,
    description: 'You cannot delete your own account, or the only remaining approved admin.',
  })
  remove(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.users.remove(admin.id, id);
  }
}
