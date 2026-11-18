import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { UsersAccessService } from './users-access.service';

/** Header carrying the ticket from `POST /admin/users-access/unlock`. */
export const USERS_ACCESS_HEADER = 'x-pulse-users-access';

/**
 * Third and last layer on the Users section, after `JwtAuthGuard` (valid,
 * approved session) and `RolesGuard` with `@Roles('admin')`. Requires a
 * live access ticket for *this* admin — see `UsersAccessService` for why
 * the code exists at all.
 */
@Injectable()
export class UsersAccessGuard implements CanActivate {
  constructor(private readonly usersAccess: UsersAccessService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers[USERS_ACCESS_HEADER];
    const ticket = Array.isArray(header) ? header[0] : header;

    if (!ticket || !this.usersAccess.isTicketValid(ticket, request.user.id)) {
      throw new ForbiddenException(
        'Users-section access has expired or was never unlocked. Enter the access code again.',
      );
    }
    return true;
  }
}
