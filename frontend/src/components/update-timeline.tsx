import type { JSX } from 'react';
import { History } from 'lucide-react';
import { StatusTransition } from '@/components/status-transition';
import { MilestoneHistoryDialog } from '@/components/milestone-history-dialog';
import { formatDate, formatDateTime, roleLabel } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { InitiativeUpdate, RagStatus, UpdateMilestoneEntry } from '@/types/api';

const DOT: Record<RagStatus, string> = {
  'Not started': 'bg-rag-not-started',
  'In progress': 'bg-rag-in-progress',
  Completed: 'bg-rag-completed',
  'Delayed/at risk': 'bg-rag-delayed',
};

interface Annotated {
  update: InitiativeUpdate;
  /** True when a later submission for the same meeting replaced this one on the snapshot. */
  superseded: boolean;
  targetChanged: boolean;
  actualChanged: boolean;
}

/**
 * Works out, chronologically, which submissions were superseded and whether
 * target/actual actually moved. Null target/actual means "unchanged" (the
 * trigger coalesces), so a change is only a non-null value that differs from
 * the last non-null one.
 */
function annotate(updatesNewestFirst: InitiativeUpdate[]): Annotated[] {
  const chronological = [...updatesNewestFirst].reverse();
  let lastTarget: string | null = null;
  let lastActual: string | null = null;
  const annotated = chronological.map((update, i): Annotated => {
    const next = chronological[i + 1];
    const result: Annotated = {
      update,
      superseded: next !== undefined && next.meeting_date === update.meeting_date,
      targetChanged: update.target !== null && update.target !== lastTarget,
      actualChanged: update.actual !== null && update.actual !== lastActual,
    };
    lastTarget = update.target ?? lastTarget;
    lastActual = update.actual ?? lastActual;
    return result;
  });
  return annotated.reverse();
}

function MilestoneEntryRow({
  entry,
  initiativeId,
}: {
  entry: UpdateMilestoneEntry;
  initiativeId: string;
}): JSX.Element {
  return (
    <li className={cn('rounded-md border border-border px-3 py-2.5', entry.is_current && 'border-primary/40 bg-primary/5')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {entry.is_current && (
            <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Current milestone</div>
          )}
          <div className="text-sm font-medium text-foreground">{entry.milestone_title}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusTransition from={entry.previous_status} to={entry.status} />
          {entry.milestone_id && (
            <MilestoneHistoryDialog
              initiativeId={initiativeId}
              milestoneId={entry.milestone_id}
              title={entry.milestone_title}
              trigger={
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  title="Milestone history"
                >
                  <History className="h-3.5 w-3.5" />
                </button>
              }
            />
          )}
        </div>
      </div>
      {entry.note && <p className="mt-1.5 text-sm text-foreground">{entry.note}</p>}
      {entry.challenges && (
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium">Challenges:</span> {entry.challenges}
        </p>
      )}
    </li>
  );
}

function ValueChange({ label, value, changed }: { label: string; value: string; changed: boolean }): JSX.Element {
  return (
    <span>
      <span className="font-medium">{label}:</span> {value}
      {changed && (
        <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
          changed
        </span>
      )}
    </span>
  );
}

export function UpdateTimeline({
  updates,
  initiativeId,
}: {
  updates: InitiativeUpdate[];
  initiativeId: string;
}): JSX.Element {
  return (
    <ol className="relative ml-2 space-y-5 border-l-2 border-border pl-6">
      {annotate(updates).map(({ update: u, superseded, targetChanged, actualChanged }, index) => (
        <li key={u.id} className={cn('relative', superseded && 'opacity-60')}>
          <span
            className={cn(
              'absolute -left-[33px] top-4 h-3.5 w-3.5 rounded-full ring-4 ring-gray-50',
              DOT[u.status],
            )}
          />
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                    TWG {formatDate(u.meeting_date)}
                  </span>
                  {index === 0 && !superseded && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                      Latest
                    </span>
                  )}
                  {superseded && (
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-700">
                      Superseded by a later submission
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {u.submitter ? (
                    <>
                      <span className="font-medium text-foreground">{u.submitter.full_name}</span> ·{' '}
                      {roleLabel(u.submitter.role)}
                    </>
                  ) : (
                    'Imported from TWG deck'
                  )}{' '}
                  · submitted {formatDateTime(u.created_at)}
                </div>
              </div>
              <StatusTransition from={u.previous_status} to={u.status} />
            </div>

            <p className="mt-3 whitespace-pre-line text-sm text-foreground">{u.latest_update}</p>

            {(u.target || u.actual) && (
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                {u.target && <ValueChange label="Target" value={u.target} changed={targetChanged} />}
                {u.actual && <ValueChange label="Actual" value={u.actual} changed={actualChanged} />}
              </div>
            )}

            {u.decisions_needed && (
              <div className="mt-3 rounded-md border-l-[3px] border-primary bg-primary/5 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">Decision needed:</span>{' '}
                <span className="text-foreground">{u.decisions_needed}</span>
              </div>
            )}

            {u.milestones.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Milestones reported ({u.milestones.length})
                </div>
                <ul className="space-y-2">
                  {u.milestones.map((entry) => (
                    <MilestoneEntryRow key={entry.id} entry={entry} initiativeId={initiativeId} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
