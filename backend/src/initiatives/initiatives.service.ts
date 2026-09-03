import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Initiative } from '../types/database';
import { CreateInitiativeDto } from './dto/create-initiative.dto';
import { ListInitiativesQueryDto } from './dto/list-initiatives-query.dto';
import { UpdateInitiativeDto } from './dto/update-initiative.dto';

@Injectable()
export class InitiativesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(accessToken: string, query: ListInitiativesQueryDto): Promise<Initiative[]> {
    let builder = this.supabase
      .getClientForToken(accessToken)
      .from('initiatives')
      .select('*')
      .order('created_at');

    if (query.workstream_id) {
      builder = builder.eq('workstream_id', query.workstream_id);
    }
    if (query.status) {
      builder = builder.eq('status', query.status);
    }
    if (!query.include_archived) {
      builder = builder.is('archived_at', null);
    }

    const { data, error } = await builder;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(accessToken: string, id: string): Promise<Initiative> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiatives')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Initiative ${id} not found.`);
    return data;
  }

  /** Admin/SMO-only: register a new initiative against a workstream. */
  async create(accessToken: string, dto: CreateInitiativeDto): Promise<Initiative> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiatives')
      .insert({
        workstream_id: dto.workstream_id,
        title: dto.title,
        directorate_owner: dto.directorate_owner ?? null,
        l_gate_stage: dto.l_gate_stage ?? null,
        kpi_expected_impact: dto.kpi_expected_impact ?? null,
        target: dto.target ?? null,
        actual: dto.actual ?? null,
        status: dto.status ?? 'Not started',
        latest_update: dto.latest_update ?? null,
        decisions_needed: dto.decisions_needed ?? null,
        update_as_at: dto.update_as_at ?? null,
      })
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /**
   * Admin/SMO-only direct correction. Uses the caller's own token, not the
   * service-role client — the "initiatives writable by admin/smo" RLS
   * policy already covers this, and `RolesGuard` gives the fast, clear 403
   * before the request even reaches Postgres. No need to bypass RLS for a
   * case it already handles correctly.
   */
  async update(accessToken: string, id: string, dto: UpdateInitiativeDto): Promise<Initiative> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiatives')
      .update(dto)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Initiative ${id} not found.`);
    return data;
  }

  /** Soft-delete. Milestones and initiative_updates history are left intact. */
  async archive(accessToken: string, id: string): Promise<Initiative> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiatives')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Initiative ${id} not found.`);
    return data;
  }

  async restore(accessToken: string, id: string): Promise<Initiative> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiatives')
      .update({ archived_at: null })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Initiative ${id} not found.`);
    return data;
  }
}
