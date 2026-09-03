import type { JSX } from 'react';
import { cn } from '@/lib/utils';
import type { RagStatus } from '@/types/api';

const STYLES: Record<RagStatus, string> = {
  'Not started': 'bg-rag-not-started/10 text-rag-not-started ring-1 ring-inset ring-rag-not-started/20',
  'In progress': 'bg-rag-in-progress/10 text-rag-in-progress ring-1 ring-inset ring-rag-in-progress/20',
  Completed: 'bg-rag-completed/10 text-rag-completed ring-1 ring-inset ring-rag-completed/20',
  'Delayed/at risk': 'bg-rag-delayed/10 text-rag-delayed ring-1 ring-inset ring-rag-delayed/20',
};

export function RagBadge({ status, className }: { status: RagStatus; className?: string }): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
