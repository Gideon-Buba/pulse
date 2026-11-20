import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { InitiativesService } from '../initiatives/initiatives.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  Database,
  InitiativeUpdate,
  InitiativeUpdateMilestone,
  RagStatus,
  SubmitterName,
} from '../types/database';
import { SubmitUpdateDto } from './dto/submit-update.dto';

/** Postgres SQLSTATE for an RLS `WITH CHECK` failure. */
const RLS_VIOLATION_CODE = '42501';
/** Raised by `prepare_update_milestone` when a milestone isn't under the update's initiative. */
const CHECK_VIOLATION_CODE = '23514';
const UNIQUE_VIOLATION_CODE = '23505';

type Client = SupabaseClient<Database>;

/** An update row enriched for the history view — the shape `InitiativeUpdateDto` documents. */
export type InitiativeUpdateView = InitiativeUpdate & {
  submitter: SubmitterName | null;
  previous_status: RagStatus | null;
  milestones: InitiativeUpdateMilestone[];
};

export type MilestoneHistoryEntryView = InitiativeUpdateMilestone & {
  meeting_date: string;
  submitter: SubmitterName | null;
};

export type MeetingSummaryView = {
  meeting_date: string;
  initiatives_updated: number;
  update_count: number;
};

export type MeetingDetailView = {
  meeting_date: string;
  total_initiatives: number;
  submitted_count: number;
  workstreams: {
    workstream_id: string;
    workstream_name: string;
    submitted_count: number;
    initiatives: {
      initiative_id: string;
      title: string;
      current_status: RagStatus;
      update: InitiativeUpdateView | null;
      submission_count: number;
    }[];
  }[];
};

/** Chronological order the trigger uses: meeting date, then submission time (last wins). */
function compareChronologically(a: InitiativeUpdate, b: InitiativeUpdate): number {
  if (a.meeting_date !== b.meeting_date) return a.meeting_date < b.meeting_date ? -1 : 1;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return 0;
}

function throwQueryError(error: PostgrestError): never {
  throw new InternalServerErrorException(error.message);
}

@Injectable()
export class UpdatesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly initiativesService: InitiativesService,
  ) {}

  async findAllForInitiative(
    accessToken: string,
    initiativeId: string,
  ): Promise<InitiativeUpdateView[]> {
    await this.initiativesService.findOne(accessToken, initiativeId);
    const client = this.supabase.getClientForToken(accessToken);

    const { data, error } = await client
      .from('initiative_updates')
      .select('*')
      .eq('initiative_id', initiativeId);
    if (error) throwQueryError(error);

    const enriched = await this.enrich(client, data);
    return enriched.sort((a, b) => compareChronologically(b, a));
  }

  /**
   * Inserts via the `submit_initiative_update` RPC — never writes to
   * `initiatives` or `milestones` directly. The RPC writes the update and
   * its milestone entries in one transaction, and the 001/005 triggers
   * promote them onto the snapshots. It runs as the caller, so RLS is the
   * enforcement of record (and `submitted_by` comes from `auth.uid()`, not
   * the request); `WorkstreamScopeGuard` has already given a fast 403 for
   * the common case.
   */
  async submit(
    accessToken: string,
    initiativeId: string,
    dto: SubmitUpdateDto,
  ): Promise<InitiativeUpdateView> {
    const entries = dto.milestones ?? [];
    if (entries.filter((entry) => entry.is_current).length > 1) {
      throw new BadRequestException('Only one milestone can be flagged as the current milestone.');
    }

    const client = this.supabase.getClientForToken(accessToken);
    const { data: updateId, error } = await client.rpc('submit_initiative_update', {
      p_initiative_id: initiativeId,
      p_meeting_date: dto.meeting_date,
      p_status: dto.status,
      p_latest_update: dto.latest_update,
      p_target: dto.target ?? null,
      p_actual: dto.actual ?? null,
      p_decisions_needed: dto.decisions_needed ?? null,
      p_milestones: entries.map((entry) => ({
        milestone_id: entry.milestone_id,
        is_current: entry.is_current ?? false,
        status: entry.status,
        note: entry.note ?? null,
        challenges: entry.challenges ?? null,
      })),
    });

    if (error) {
      if (error.code === RLS_VIOLATION_CODE) {
        throw new ForbiddenException(
          'You are not permitted to submit updates for this initiative.',
        );
      }
      if (error.code === CHECK_VIOLATION_CODE || error.code === UNIQUE_VIOLATION_CODE) {
        throw new BadRequestException(error.message);
      }
      throwQueryError(error);
    }

    // Return the new row in the same enriched shape the history list uses,
    // so the client can drop it straight into the timeline.
    const history = await this.findAllForInitiative(accessToken, initiativeId);
    const created = history.find((u) => u.id === updateId);
    if (!created)
      throw new InternalServerErrorException('Update was saved but could not be read back.');
    return created;
  }

  async findMilestoneHistory(
    accessToken: string,
    initiativeId: string,
    milestoneId: string,
  ): Promise<MilestoneHistoryEntryView[]> {
    const client = this.supabase.getClientForToken(accessToken);

    const { data: milestone, error: milestoneError } = await client
      .from('milestones')
      .select('id')
      .eq('id', milestoneId)
      .eq('initiative_id', initiativeId)
      .maybeSingle();
    if (milestoneError) throwQueryError(milestoneError);
    if (!milestone) {
      throw new NotFoundException(
        `Milestone ${milestoneId} not found under initiative ${initiativeId}.`,
      );
    }

    const { data: entries, error } = await client
      .from('initiative_update_milestones')
      .select('*')
      .eq('milestone_id', milestoneId);
    if (error) throwQueryError(error);
    if (entries.length === 0) return [];

    const { data: updates, error: updatesError } = await client
      .from('initiative_updates')
      .select('*')
      .in(
        'id',
        entries.map((e) => e.update_id),
      );
    if (updatesError) throwQueryError(updatesError);

    const updateById = new Map(updates.map((u) => [u.id, u]));
    const submitters = await this.fetchSubmitters(client, updates);

    return entries
      .flatMap((entry): MilestoneHistoryEntryView[] => {
        const update = updateById.get(entry.update_id);
        if (!update) return [];
        return [
          {
            ...entry,
            meeting_date: update.meeting_date,
            submitter: update.submitted_by ? (submitters.get(update.submitted_by) ?? null) : null,
          },
        ];
      })
      .sort((a, b) =>
        a.meeting_date !== b.meeting_date
          ? b.meeting_date.localeCompare(a.meeting_date)
          : b.created_at.localeCompare(a.created_at),
      );
  }

  async listMeetings(accessToken: string): Promise<MeetingSummaryView[]> {
    const { data, error } = await this.supabase
      .getClientForToken(accessToken)
      .from('initiative_updates')
      .select('meeting_date, initiative_id');
    if (error) throwQueryError(error);

    const byDate = new Map<string, { initiatives: Set<string>; count: number }>();
    for (const row of data) {
      const bucket = byDate.get(row.meeting_date) ?? { initiatives: new Set<string>(), count: 0 };
      bucket.initiatives.add(row.initiative_id);
      bucket.count += 1;
      byDate.set(row.meeting_date, bucket);
    }

    return [...byDate.entries()]
      .map(([meeting_date, bucket]) => ({
        meeting_date,
        initiatives_updated: bucket.initiatives.size,
        update_count: bucket.count,
      }))
      .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
  }

  async getMeeting(accessToken: string, meetingDate: string): Promise<MeetingDetailView> {
    const client = this.supabase.getClientForToken(accessToken);

    const [workstreamsResult, initiativesResult, updatesResult] = await Promise.all([
      client.from('workstreams').select('*').is('archived_at', null).order('sort_order'),
      client.from('initiatives').select('*').is('archived_at', null).order('created_at'),
      // Everything up to and including the meeting, so previous_status can
      // be worked out for the updates filed at it.
      client.from('initiative_updates').select('*').lte('meeting_date', meetingDate),
    ]);
    if (workstreamsResult.error) throwQueryError(workstreamsResult.error);
    if (initiativesResult.error) throwQueryError(initiativesResult.error);
    if (updatesResult.error) throwQueryError(updatesResult.error);

    const atMeeting = updatesResult.data.filter((u) => u.meeting_date === meetingDate);
    const enrichedAtMeeting = await this.enrich(client, atMeeting, updatesResult.data);

    const updatesByInitiative = new Map<string, InitiativeUpdateView[]>();
    for (const update of enrichedAtMeeting) {
      const list = updatesByInitiative.get(update.initiative_id) ?? [];
      list.push(update);
      updatesByInitiative.set(update.initiative_id, list);
    }

    const workstreams = workstreamsResult.data.map((workstream) => {
      const initiatives = initiativesResult.data
        .filter((initiative) => initiative.workstream_id === workstream.id)
        .map((initiative) => {
          const filed = (updatesByInitiative.get(initiative.id) ?? []).sort(compareChronologically);
          return {
            initiative_id: initiative.id,
            title: initiative.title,
            current_status: initiative.status,
            update: filed.at(-1) ?? null,
            submission_count: filed.length,
          };
        });
      return {
        workstream_id: workstream.id,
        workstream_name: workstream.name,
        submitted_count: initiatives.filter((i) => i.update !== null).length,
        initiatives,
      };
    });

    return {
      meeting_date: meetingDate,
      total_initiatives: workstreams.reduce((n, w) => n + w.initiatives.length, 0),
      submitted_count: workstreams.reduce((n, w) => n + w.submitted_count, 0),
      workstreams,
    };
  }

  /**
   * Attaches submitter, milestone entries and previous_status to update rows.
   * `context` is the wider set of updates used to find each row's
   * predecessor — defaults to `rows` itself, which is enough when `rows` is
   * an initiative's full history.
   */
  private async enrich(
    client: Client,
    rows: InitiativeUpdate[],
    context: InitiativeUpdate[] = rows,
  ): Promise<InitiativeUpdateView[]> {
    if (rows.length === 0) return [];

    const [entriesResult, submitters] = await Promise.all([
      client
        .from('initiative_update_milestones')
        .select('*')
        .in(
          'update_id',
          rows.map((r) => r.id),
        )
        .order('is_current', { ascending: false })
        .order('created_at'),
      this.fetchSubmitters(client, rows),
    ]);
    if (entriesResult.error) throwQueryError(entriesResult.error);

    const entriesByUpdate = new Map<string, InitiativeUpdateMilestone[]>();
    for (const entry of entriesResult.data) {
      const list = entriesByUpdate.get(entry.update_id) ?? [];
      list.push(entry);
      entriesByUpdate.set(entry.update_id, list);
    }

    const previousStatusById = new Map<string, RagStatus | null>();
    const contextByInitiative = new Map<string, InitiativeUpdate[]>();
    for (const update of context) {
      const list = contextByInitiative.get(update.initiative_id) ?? [];
      list.push(update);
      contextByInitiative.set(update.initiative_id, list);
    }
    for (const list of contextByInitiative.values()) {
      list.sort(compareChronologically);
      list.forEach((update, i) => previousStatusById.set(update.id, list[i - 1]?.status ?? null));
    }

    return rows.map((row) => ({
      ...row,
      submitter: row.submitted_by ? (submitters.get(row.submitted_by) ?? null) : null,
      previous_status: previousStatusById.get(row.id) ?? null,
      milestones: entriesByUpdate.get(row.id) ?? [],
    }));
  }

  private async fetchSubmitters(
    client: Client,
    rows: InitiativeUpdate[],
  ): Promise<Map<string, SubmitterName>> {
    const ids = [...new Set(rows.flatMap((r) => (r.submitted_by ? [r.submitted_by] : [])))];
    if (ids.length === 0) return new Map();

    const { data, error } = await client.rpc('get_submitter_names', { p_ids: ids });
    if (error) throwQueryError(error);
    return new Map(data.map((s) => [s.id, s]));
  }
}
