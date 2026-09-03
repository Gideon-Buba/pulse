import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { InitiativesService } from '../initiatives/initiatives.service';
import { Initiative } from '../types/database';

export interface ScopedInitiativeRequest extends AuthenticatedRequest {
  /** The initiative this guard already fetched — reused by the controller/service to avoid a second query. */
  initiative: Initiative;
}

/**
 * Mirrors the `initiative_updates` RLS policy in application code so a
 * workstream lead submitting for the wrong workstream gets a clear 403
 * immediately, instead of an opaque Postgres RLS error surfacing from the
 * insert. RLS remains the authoritative enforcement — this is purely a
 * fail-fast UX layer in front of it. Must run after `JwtAuthGuard`.
 */
@Injectable()
export class WorkstreamScopeGuard implements CanActivate {
  constructor(private readonly initiativesService: InitiativesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ScopedInitiativeRequest>();
    const { user, token } = request;
    // Express 5 types route params as `string | string[]` to allow for
    // wildcard segments; `:id` on this route is always a single string.
    const initiativeId = request.params.id as string;

    // 404s here if the id is bad at all, regardless of role — findOne is
    // itself RLS-readable by any authenticated user.
    const initiative = await this.initiativesService.findOne(token, initiativeId);

    if (user.role === 'workstream_lead' && initiative.workstream_id !== user.workstreamId) {
      throw new ForbiddenException(
        'You can only submit updates for initiatives in your own workstream.',
      );
    }

    request.initiative = initiative;
    return true;
  }
}
