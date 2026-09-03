import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { InitiativesService } from '../initiatives/initiatives.service';
import { SupabaseService } from '../supabase/supabase.service';
import { InitiativeUpdate } from '../types/database';
import { SubmitUpdateDto } from './dto/submit-update.dto';

/** Postgres SQLSTATE for an RLS `WITH CHECK` failure. */
const RLS_VIOLATION_CODE = '42501';

@Injectable()
export class UpdatesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly initiativesService: InitiativesService,
  ) {}

  async findAllForInitiative(
    accessToken: string,
    initiativeId: string,
  ): Promise<InitiativeUpdate[]> {
    await this.initiativesService.findOne(accessToken, initiativeId);

    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiative_updates')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('meeting_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * Inserts into `initiative_updates` only — never writes to `initiatives`
   * directly. The `apply_initiative_update` trigger promotes this onto the
   * `initiatives` snapshot server-side. Uses the caller's own token so RLS
   * is the enforcement of record; `WorkstreamScopeGuard` has already given
   * a fast 403 for the common case, this is the safety net if that guard's
   * logic and the RLS policy were ever to drift apart.
   */
  async submit(
    accessToken: string,
    user: AuthenticatedUser,
    initiativeId: string,
    dto: SubmitUpdateDto,
  ): Promise<InitiativeUpdate> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiative_updates')
      .insert({
        initiative_id: initiativeId,
        submitted_by: user.id,
        meeting_date: dto.meeting_date,
        status: dto.status,
        target: dto.target ?? null,
        actual: dto.actual ?? null,
        latest_update: dto.latest_update,
        decisions_needed: dto.decisions_needed ?? null,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === RLS_VIOLATION_CODE) {
        throw new ForbiddenException(
          'You are not permitted to submit updates for this initiative.',
        );
      }
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
