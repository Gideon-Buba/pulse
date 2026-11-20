import { useState, type JSX } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { RagBadge } from '@/components/rag-badge';
import { SectionHeading } from '@/components/section-heading';
import { StatusTransition } from '@/components/status-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, roleLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MeetingDetail, MeetingInitiative } from '@/types/api';

function InitiativeRow({ item }: { item: MeetingInitiative }): JSX.Element {
  const u = item.update;

  if (!u) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-gray-50 px-4 py-3">
        <div className="min-w-0">
          <Link to={`/initiatives/${item.initiative_id}`} className="text-sm font-medium text-foreground hover:underline">
            {item.title}
          </Link>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleAlert className="h-3.5 w-3.5" />
            No update submitted for this meeting
          </div>
        </div>
        <RagBadge status={item.current_status} className="opacity-60" />
      </li>
    );
  }

  const current = u.milestones.find((m) => m.is_current);
  const others = u.milestones.length - (current ? 1 : 0);

  return (
    <li className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link to={`/initiatives/${item.initiative_id}`} className="text-sm font-semibold text-foreground hover:underline">
          {item.title}
        </Link>
        <StatusTransition from={u.previous_status} to={u.status} />
      </div>

      <p className="mt-2 line-clamp-3 text-sm text-foreground">{u.latest_update}</p>

      {current && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-primary">Current milestone</span>
          <span className="text-foreground">{current.milestone_title}</span>
          <StatusTransition from={current.previous_status} to={current.status} />
        </div>
      )}

      {u.decisions_needed && (
        <div className="mt-2 rounded-md border-l-[3px] border-primary bg-primary/5 px-3 py-1.5 text-xs text-foreground">
          <span className="font-medium">Decision needed:</span> {u.decisions_needed}
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground">
        {u.submitter ? `${u.submitter.full_name} (${roleLabel(u.submitter.role)})` : 'Imported from TWG deck'}
        {others > 0 && ` · ${others} other milestone${others === 1 ? '' : 's'} reported`}
        {item.submission_count > 1 && ` · resubmitted ${item.submission_count - 1}×, showing latest`}
      </div>
    </li>
  );
}

function Coverage({ meeting }: { meeting: MeetingDetail }): JSX.Element {
  const pct = meeting.total_initiatives === 0 ? 0 : (meeting.submitted_count / meeting.total_initiatives) * 100;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Submission coverage</span>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{meeting.submitted_count}</span> of{' '}
          {meeting.total_initiatives} initiatives updated
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MeetingsPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const [gapsOnly, setGapsOnly] = useState(false);

  const { data: meetings, loading: loadingMeetings, error: meetingsError } = useApiQuery(
    () => api.meetings.list(),
    [],
  );

  const selectedDate = params.get('date') ?? meetings?.[0]?.meeting_date ?? null;

  const { data: meeting, loading: loadingMeeting, error: meetingError } = useApiQuery(
    () => (selectedDate ? api.meetings.get(selectedDate) : Promise.resolve(null)),
    [selectedDate],
  );

  function selectDate(date: string): void {
    const next = new URLSearchParams(params);
    next.set('date', date);
    setParams(next, { replace: true });
  }

  if (meetingsError) {
    return <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{meetingsError}</div>;
  }

  if (!loadingMeetings && meetings?.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card py-10 text-center text-sm text-muted-foreground">
        No TWG updates have been submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          What every workstream reported at a TWG meeting, and who hasn&rsquo;t submitted yet.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={gapsOnly}
              onChange={(e) => setGapsOnly(e.target.checked)}
            />
            Only show missing updates
          </label>
          <Select value={selectedDate ?? undefined} onValueChange={selectDate}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={loadingMeetings ? 'Loading…' : 'Select meeting'} />
            </SelectTrigger>
            <SelectContent>
              {meetings?.map((m) => (
                <SelectItem key={m.meeting_date} value={m.meeting_date}>
                  TWG {formatDate(m.meeting_date)} ({m.initiatives_updated})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {meetingError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{meetingError}</div>
      )}

      {(loadingMeetings || loadingMeeting) && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!loadingMeeting && meeting && (
        <>
          <Coverage meeting={meeting} />

          {meeting.workstreams.map((w) => {
            const items = gapsOnly ? w.initiatives.filter((i) => !i.update) : w.initiatives;
            if (items.length === 0) return null;
            return (
              <section key={w.workstream_id}>
                <SectionHeading
                  meta={
                    <span className={cn(w.submitted_count < w.initiatives.length && 'font-medium text-primary')}>
                      {w.submitted_count} of {w.initiatives.length} submitted
                    </span>
                  }
                >
                  {w.workstream_name}
                </SectionHeading>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <InitiativeRow key={item.initiative_id} item={item} />
                  ))}
                </ul>
              </section>
            );
          })}

          {gapsOnly && meeting.submitted_count === meeting.total_initiatives && (
            <div className="rounded-lg border border-border bg-card py-8 text-center text-sm text-muted-foreground">
              Every active initiative has an update for this meeting.
            </div>
          )}
        </>
      )}
    </div>
  );
}
