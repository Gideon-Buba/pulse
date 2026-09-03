import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Profile } from '../types/database';
import { AuthService } from './auth.service';
import { AuthenticatedUser, AuthSession } from './auth.types';

@Injectable()
export class SupabaseAuthService extends AuthService {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await this.supabase
      .getAnonClient()
      .auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const user = await this.loadAuthenticatedUser(data.session.access_token, data.user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000),
      user,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    const { error } = await this.supabase
      .getServiceRoleClient()
      .auth.admin.signOut(accessToken, 'global');
    if (error) {
      throw new UnauthorizedException('Could not sign out — session may already be invalid.');
    }
  }

  async verifyToken(accessToken: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.supabase.getAnonClient().auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return this.loadAuthenticatedUser(accessToken, data.user.id);
  }

  private async loadAuthenticatedUser(
    accessToken: string,
    userId: string,
  ): Promise<AuthenticatedUser> {
    const { data: profile, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single<Profile>();

    if (error || !profile) {
      throw new UnauthorizedException(
        'No Pulse profile is configured for this account. Contact an admin.',
      );
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      workstreamId: profile.workstream_id,
    };
  }
}
