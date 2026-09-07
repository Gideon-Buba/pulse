import type { JSX } from 'react';
import { SLIDE_STATUS_VAR } from './slide-status-color';
import { RAG_STATUSES, type RagStatus } from '@/types/api';

/** A compact status-count preview, used on the Exports page so a workstream card previews what it will export. */
export function SlidePreviewStrip({
  statusCounts,
}: {
  statusCounts: Record<RagStatus, number>;
}): JSX.Element {
  return (
    <div className="slide-preview-strip">
      {RAG_STATUSES.map((status) => (
        <span key={status} className="slide-preview-strip__chip">
          <span
            className="slide-status-dot slide-status-dot--sm"
            style={{ backgroundColor: SLIDE_STATUS_VAR[status] }}
          />
          {statusCounts[status]}
        </span>
      ))}
    </div>
  );
}
