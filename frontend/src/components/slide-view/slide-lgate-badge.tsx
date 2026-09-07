import type { JSX } from 'react';
import type { LGate } from '@/types/api';

export function SlideLGateBadge({ gate }: { gate: LGate | null }): JSX.Element {
  return (
    <span className="slide-lgate">
      <span className="slide-lgate__badge">{gate ?? '—'}</span>
      L-gate stage
    </span>
  );
}
