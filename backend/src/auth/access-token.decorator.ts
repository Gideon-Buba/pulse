import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './jwt-auth.guard';

/**
 * The caller's raw Supabase access token, for building an RLS-scoped
 * client via `SupabaseService.getClientForToken`. Prefer this over the
 * service-role client for anything user-facing — see CLAUDE.md's auth
 * section on not reimplementing authorization RLS already guarantees.
 */
export const AccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().token;
  },
);
