import type { JSX } from 'react';
import { cn } from '@/lib/utils';

const SEGMENTS: { key: keyof StatusCounts; label: string; className: string }[] = [
  { key: 'delayed_at_risk', label: 'Delayed/at risk', className: 'bg-rag-delayed' },
  { key: 'in_progress', label: 'In progress', className: 'bg-rag-in-progress' },
  { key: 'completed', label: 'Completed', className: 'bg-rag-completed' },
  { key: 'not_started', label: 'Not started', className: 'bg-rag-not-started' },
];

export interface StatusCounts {
  not_started: number;
  in_progress: number;
  completed: number;
  delayed_at_risk: number;
}

/** Thin proportional status-mix bar — the app's one shared RAG-status visual, used wherever a workstream/initiative set needs a glanceable breakdown. */
export function StatusMixBar({ counts, className }: { counts: StatusCounts; className?: string }): JSX.Element {
  const total = counts.not_started + counts.in_progress + counts.completed + counts.delayed_at_risk;

  if (total === 0) {
    return <div className={cn('h-2 w-full rounded-full bg-muted', className)} />;
  }

  return (
    <div className={cn('flex h-2 w-full overflow-hidden rounded-full bg-muted', className)} role="img" aria-label="Status mix">
      {SEGMENTS.filter((s) => counts[s.key] > 0).map((s) => (
        <div
          key={s.key}
          className={s.className}
          style={{ width: `${(counts[s.key] / total) * 100}%` }}
          title={`${s.label}: ${counts[s.key]}`}
        />
      ))}
    </div>
  );
}
