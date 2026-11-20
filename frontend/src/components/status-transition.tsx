import type { JSX } from 'react';
import { ArrowRight } from 'lucide-react';
import { RagBadge } from '@/components/rag-badge';
import type { RagStatus } from '@/types/api';

/** "In progress → Delayed/at risk" when the status moved; a single badge when it didn't. */
export function StatusTransition({
  from,
  to,
}: {
  from: RagStatus | null;
  to: RagStatus;
}): JSX.Element {
  if (!from || from === to) return <RagBadge status={to} />;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <RagBadge status={from} className="opacity-60" />
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="changed to" />
      <RagBadge status={to} />
    </span>
  );
}
