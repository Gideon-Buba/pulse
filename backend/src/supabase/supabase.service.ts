import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { EnvConfig } from '../config/env.validation';

/**
 * Central place all Supabase client construction goes through. Nothing
 * outside this service should call `createClient` directly — see
 * CLAUDE.md's auth section: everything user-facing goes through the
 * caller's own JWT so RLS does the enforcement, and the service-role key
 * is reserved for genuinely privileged (admin) operations only.
 */
@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly anonKey: string;
  private readonly serviceRoleKey: string;
  private readonly anonClient: SupabaseClient<Database>;
  private readonly serviceRoleClient: SupabaseClient<Database>;

  constructor(configService: ConfigService<EnvConfig, true>) {
    this.url = configService.get('SUPABASE_URL', { infer: true });
    this.anonKey = configService.get('SUPABASE_ANON_KEY', { infer: true });
    this.serviceRoleKey = configService.get('SUPABASE_SERVICE_ROLE_KEY', {
      infer: true,
    });

    this.anonClient = createClient<Database>(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    this.serviceRoleClient = createClient<Database>(this.url, this.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  /**
   * Unauthenticated client, anon key only. Used for the sign-in/sign-up
   * flows themselves, before a user session exists.
   */
  getAnonClient(): SupabaseClient<Database> {
    return this.anonClient;
  }

  /**
   * Per-request client scoped to the calling user's JWT. RLS policies
   * enforce row-level access as that user — this is the client every
   * authenticated read/write route should use.
   */
  getClientForToken(accessToken: string): SupabaseClient<Database> {
    return createClient<Database>(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  /**
   * Bypasses RLS entirely. Reserve for admin/smo correction routes that
   * are explicitly documented as privileged — never as a shortcut around
   * an RLS policy that's inconvenient for a given request.
   */
  getServiceRoleClient(): SupabaseClient<Database> {
    return this.serviceRoleClient;
  }
}
