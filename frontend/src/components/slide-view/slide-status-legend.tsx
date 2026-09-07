import type { JSX } from 'react';
import { SlideStatusDot } from './slide-status-dot';
import { RAG_STATUSES } from '@/types/api';

/** The 4-status legend row from the deck's own header, in the deck's fixed order. */
export function SlideStatusLegend(): JSX.Element {
  return (
    <div className="slide-legend">
      {RAG_STATUSES.map((status) => (
        <span key={status} className="slide-legend__item">
          <SlideStatusDot status={status} />
          {status}
        </span>
      ))}
    </div>
  );
}
