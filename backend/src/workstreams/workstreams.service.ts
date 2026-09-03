import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Workstream, WorkstreamSummary } from '../types/database';
import { CreateWorkstreamDto } from './dto/create-workstream.dto';
import { UpdateWorkstreamDto } from './dto/update-workstream.dto';

@Injectable()
export class WorkstreamsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(accessToken: string, includeArchived: boolean): Promise<Workstream[]> {
    let builder = this.supabase
      .getClientForToken(accessToken)
      .from('workstreams')
      .select('*')
      .order('sort_order');

    if (!includeArchived) {
      builder = builder.is('archived_at', null);
    }

    const { data, error } = await builder;
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async findOne(accessToken: string, id: string): Promise<Workstream> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('workstreams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Workstream ${id} not found.`);
    return data;
  }

  async summary(accessToken: string): Promise<WorkstreamSummary[]> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('workstream_summary')
      .select('*');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(accessToken: string, dto: CreateWorkstreamDto): Promise<Workstream> {
    const client = this.supabase.getClientForToken(accessToken);

    let sortOrder = dto.sort_order;
    if (sortOrder === undefined) {
      const { data: maxRow, error: maxError } = await client
        .from('workstreams')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxError) throw new InternalServerErrorException(maxError.message);
      sortOrder = (maxRow?.sort_order ?? 0) + 1;
    }

    const { data, error } = await client
      .from('workstreams')
      .insert({ name: dto.name, sort_order: sortOrder })
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(accessToken: string, id: string, dto: UpdateWorkstreamDto): Promise<Workstream> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('workstreams')
      .update(dto)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Workstream ${id} not found.`);
    return data;
  }

  /**
   * Soft-delete. Refuses if the workstream still has active (non-archived)
   * initiatives — those need to be reassigned or archived first, otherwise
   * they'd be orphaned in list views with no owning workstream shown.
   */
  async archive(accessToken: string, id: string): Promise<Workstream> {
    const client = this.supabase.getClientForToken(accessToken);

    const { count, error: countError } = await client
      .from('initiatives')
      .select('id', { count: 'exact', head: true })
      .eq('workstream_id', id)
      .is('archived_at', null);
    if (countError) throw new InternalServerErrorException(countError.message);
    if (count && count > 0) {
      throw new ConflictException(
        `Workstream ${id} still has ${count} active initiative${count === 1 ? '' : 's'} — archive or reassign them first.`,
      );
    }

    const { data, error } = await client
      .from('workstreams')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Workstream ${id} not found.`);
    return data;
  }

  async restore(accessToken: string, id: string): Promise<Workstream> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('workstreams')
      .update({ archived_at: null })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Workstream ${id} not found.`);
    return data;
  }
}
