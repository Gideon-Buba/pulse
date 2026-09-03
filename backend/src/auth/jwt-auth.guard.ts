import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  /** The caller's raw access token — pass to `SupabaseService.getClientForToken` for RLS-enforced queries. */
  token: string;
}

function extractBearerToken(request: Request): string {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing bearer token.');
  }
  return header.slice('Bearer '.length).trim();
}

/**
 * Validates the caller's Supabase access token and attaches the resolved
 * `AuthenticatedUser` (from `profiles`) to the request. Every protected
 * route depends on this running first.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);
    request.user = await this.authService.verifyToken(token);
    request.token = token;
    return true;
  }
}
