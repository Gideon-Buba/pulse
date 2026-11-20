import { useState, type JSX, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { StatusTransition } from '@/components/status-transition';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDate, formatDateTime, roleLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MilestoneHistoryEntry, RagStatus } from '@/types/api';

const DOT: Record<RagStatus, string> = {
  'Not started': 'bg-rag-not-started',
  'In progress': 'bg-rag-in-progress',
  Completed: 'bg-rag-completed',
  'Delayed/at risk': 'bg-rag-delayed',
};

/** Oldest → newest strip of status dots, one per TWG meeting the milestone was reported at. */
function StatusTrail({ entries }: { entries: MilestoneHistoryEntry[] }): JSX.Element {
  const chronological = [...entries].reverse();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {chronological.map((e) => (
        <span
          key={e.id}
          title={`${formatDate(e.meeting_date)}: ${e.status}`}
          className={cn('h-2.5 w-6 rounded-sm', DOT[e.status])}
        />
      ))}
    </div>
  );
}

function HistoryBody({
  initiativeId,
  milestoneId,
}: {
  initiativeId: string;
  milestoneId: string;
}): JSX.Element {
  const { data, loading, error } = useApiQuery(
    () => api.milestones.history(initiativeId, milestoneId),
    [initiativeId, milestoneId],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (error) {
    return <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>;
  }
  if (!data || data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No TWG update has reported on this milestone yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status by meeting (oldest → newest)
        </div>
        <StatusTrail entries={data} />
      </div>

      <ol className="relative space-y-4 border-l border-border pl-5">
        {data.map((e) => (
          <li key={e.id} className="relative">
            <span
              className={cn('absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background', DOT[e.status])}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">TWG {formatDate(e.meeting_date)}</span>
              <StatusTransition from={e.previous_status} to={e.status} />
            </div>
            {e.is_current && (
              <span className="mt-1 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                Current milestone at this meeting
              </span>
            )}
            {e.note && <p className="mt-1.5 text-sm text-foreground">{e.note}</p>}
            {e.challenges && (
              <p className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium">Challenges:</span> {e.challenges}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {e.submitter ? `${e.submitter.full_name} (${roleLabel(e.submitter.role)})` : 'Imported record'} ·{' '}
              {formatDateTime(e.created_at)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MilestoneHistoryDialog({
  initiativeId,
  milestoneId,
  title,
  trigger,
}: {
  initiativeId: string;
  milestoneId: string;
  title: string;
  trigger: ReactNode;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Milestone history</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open so the history is fetched fresh each time. */}
        {open && <HistoryBody initiativeId={initiativeId} milestoneId={milestoneId} />}
      </DialogContent>
    </Dialog>
  );
}
