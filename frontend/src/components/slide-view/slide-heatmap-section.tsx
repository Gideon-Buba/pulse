import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import {
  DeliveryHeatmapBar,
  DeliveryHeatmapLegend,
  doneLabel,
  delayedLabel,
  type MilestoneCounts,
} from '@/components/charts/delivery-heatmap';
import { SLIDE_PROGRESS_DOT } from './slide-status-color';
import { formatSlideAsOfDate } from './slide-month-year';
import type { RagStatus } from '@/types/api';

export interface HeatmapRowVM {
  id: string;
  title: string;
  workstreamName: string;
  status: RagStatus;
  counts: MilestoneCounts;
}

const PROGRESS_LEGEND_ORDER: RagStatus[] = ['Completed', 'In progress', 'Delayed/at risk'];

/**
 * The deck's closing "Delivery heatmap" slide. Reuses the existing,
 * unmodified `DeliveryHeatmapBar`/`DeliveryHeatmapLegend` (their colors
 * already match the deck) — only the surrounding scaffolding is new.
 */
export function SlideHeatmapSection({
  rows,
  asOfDate,
}: {
  rows: HeatmapRowVM[];
  asOfDate: string | null;
}): JSX.Element {
  return (
    <section>
      <h3 className="slide-section-title">Delivery heatmap</h3>
      <div className="slide-section-accent" aria-hidden="true" />
      <p className="slide-section-asof">Update as of {formatSlideAsOfDate(asOfDate)}</p>

      <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
        The &ldquo;Initiative progress&rdquo; dot and the status column are a human editorial
        judgment call in the original deck, not something Pulse&rsquo;s data can reproduce —
        ours are computed directly from each initiative&rsquo;s current status instead, so read
        them as status, not as a curated risk call.
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex flex-wrap gap-4">
          {PROGRESS_LEGEND_ORDER.map((status) => {
            const dot = SLIDE_PROGRESS_DOT[status];
            return (
              <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="slide-progress-dot"
                  style={{
                    backgroundColor: dot.fill,
                    border: dot.ring ? `1.5px solid ${dot.ring}` : 'none',
                  }}
                />
                {dot.label}
              </span>
            );
          })}
        </div>
        <DeliveryHeatmapLegend />
      </div>

      <div className="slide-scroll">
        <div className="slide-heatmap-head">
          <span>Initiative</span>
          <span>Workstream</span>
          <span>Milestone delivery</span>
          <span>Done</span>
          <span>Delayed</span>
          <span>Read</span>
        </div>
        {rows.map((row) => {
          const dot = SLIDE_PROGRESS_DOT[row.status];
          return (
            <div key={row.id} className="slide-heatmap-row">
              <span className="flex items-center gap-2 truncate font-semibold">
                <span
                  className="slide-progress-dot"
                  style={{
                    backgroundColor: dot.fill,
                    border: dot.ring ? `1.5px solid ${dot.ring}` : 'none',
                  }}
                />
                <Link to={`/initiatives/${row.id}`} className="truncate hover:underline">
                  {row.title}
                </Link>
              </span>
              <span className="truncate text-muted-foreground">{row.workstreamName}</span>
              <DeliveryHeatmapBar counts={row.counts} />
              <span className="font-semibold">{doneLabel(row.counts)}</span>
              <span
                className={
                  row.counts.delayed > 0 ? 'font-semibold text-[#D53127]' : 'text-muted-foreground'
                }
              >
                {delayedLabel(row.counts)}
              </span>
              <span className="font-semibold" style={{ color: dot.ring ? '#757575' : dot.fill }}>
                {row.status}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
