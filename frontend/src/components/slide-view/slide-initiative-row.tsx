import type { JSX } from 'react';
import { Link } from 'react-router-dom';
import { SlideLGateBadge } from './slide-lgate-badge';
import { SlideMilestoneRow } from './slide-milestone-row';
import { SlideStatusDot } from './slide-status-dot';
import type { ImpactRow } from '@/lib/build-impact-row';

/**
 * One initiative's full block — the whole thing is a single 6-column grid
 * instance so the name/KPI/update cells can span every milestone row
 * (`grid-row: 1 / span N`), matching the deck's merged-cell look. Column
 * widths line up with `SlideColumnHeader` because both use the same
 * `.slide-columns` template on a full-width container.
 */
export function SlideInitiativeRow({ initiative }: { initiative: ImpactRow }): JSX.Element {
  const hasMilestones = initiative.milestones.length > 0;
  const rowCount = Math.max(1, initiative.milestones.length);
  const spanAll = { gridRow: `1 / span ${rowCount}` };

  return (
    <div className="slide-columns slide-initiative">
      <div className="slide-initiative__name" style={spanAll}>
        <Link to={`/initiatives/${initiative.id}`}>{initiative.title}</Link>
      </div>

      <div className="slide-initiative__kpi" style={spanAll}>
        {initiative.kpi}
        <span className="slide-initiative__kpi-target">Target – {initiative.target ?? 'TBD'}</span>
        <span className="slide-initiative__kpi-actual">Actual – {initiative.actual ?? 'TBD'}</span>
        <SlideLGateBadge gate={initiative.lGate} />
        {initiative.sameAsLastTwg && (
          <span className="slide-same-update-pill">Same update as last TWG</span>
        )}
      </div>

      {hasMilestones ? (
        initiative.milestones.map((m, i) => (
          <SlideMilestoneRow key={`${m.title}-${i}`} milestone={m} row={i + 1} withDivider={i > 0} />
        ))
      ) : (
        <>
          <span className="slide-milestone-title slide-milestone-title--empty" style={{ gridRow: 1 }}>
            No milestones recorded
          </span>
          <span className="slide-milestone-status" style={{ gridRow: 1 }}>
            <SlideStatusDot status={initiative.status} size="sm" />
          </span>
          <span className="slide-milestone-timeline" style={{ gridRow: 1 }}>
            —
          </span>
        </>
      )}

      <div className="slide-initiative__update" style={spanAll}>
        {initiative.latestUpdate ?? '—'}
      </div>
    </div>
  );
}
