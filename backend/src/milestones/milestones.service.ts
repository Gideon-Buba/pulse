import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InitiativesService } from '../initiatives/initiatives.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Milestone } from '../types/database';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Injectable()
export class MilestonesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly initiativesService: InitiativesService,
  ) {}

  async findAllForInitiative(accessToken: string, initiativeId: string): Promise<Milestone[]> {
    // Confirms the initiative exists (and is readable) so a bad id 404s
    // instead of silently returning an empty milestone list.
    await this.initiativesService.findOne(accessToken, initiativeId);

    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('milestones')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('sequence');

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /** Admin/SMO-only: add a new milestone under an initiative. */
  async create(
    accessToken: string,
    initiativeId: string,
    dto: CreateMilestoneDto,
  ): Promise<Milestone> {
    await this.initiativesService.findOne(accessToken, initiativeId);
    const client = this.supabase.getClientForToken(accessToken);

    let sequence = dto.sequence;
    if (sequence === undefined) {
      const { data: maxRow, error: maxError } = await client
        .from('milestones')
        .select('sequence')
        .eq('initiative_id', initiativeId)
        .order('sequence', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxError) throw new InternalServerErrorException(maxError.message);
      sequence = (maxRow?.sequence ?? -1) + 1;
    }

    const { data, error } = await client
      .from('milestones')
      .insert({
        initiative_id: initiativeId,
        title: dto.title,
        l_gate_stage: dto.l_gate_stage ?? null,
        directorate_owner: dto.directorate_owner ?? null,
        target_date: dto.target_date ?? null,
        status: dto.status ?? 'Not started',
        challenges: dto.challenges ?? null,
        upcoming_milestone: dto.upcoming_milestone ?? null,
        sequence,
      })
      .select('*')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  /** Admin/SMO-only: edit an existing milestone. */
  async update(
    accessToken: string,
    initiativeId: string,
    id: string,
    dto: UpdateMilestoneDto,
  ): Promise<Milestone> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('milestones')
      .update(dto)
      .eq('id', id)
      .eq('initiative_id', initiativeId)
      .select('*')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data)
      throw new NotFoundException(`Milestone ${id} not found under initiative ${initiativeId}.`);
    return data;
  }

  /**
   * Hard delete. Unlike initiatives/workstreams, a milestone carries no
   * history of its own (no append-only log hangs off it) — nothing is lost
   * by actually removing the row.
   */
  async remove(accessToken: string, initiativeId: string, id: string): Promise<void> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('milestones')
      .delete()
      .eq('id', id)
      .eq('initiative_id', initiativeId)
      .select('id')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data)
      throw new NotFoundException(`Milestone ${id} not found under initiative ${initiativeId}.`);
  }
}
