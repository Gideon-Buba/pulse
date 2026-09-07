import type { JSX } from 'react';
import { cn } from '@/lib/utils';
import { SlideStatusDot } from './slide-status-dot';
import { formatSlideMonthYear } from './slide-month-year';
import type { ImpactMilestone } from '@/lib/pptx/impact-slide';

/**
 * One milestone's three cells (columns 3-5 of the parent 6-column grid),
 * placed at an explicit grid row so it lines up under the initiative's
 * name/KPI/update cells, which span all of an initiative's milestone rows.
 */
export function SlideMilestoneRow({
  milestone,
  row,
  withDivider,
}: {
  milestone: ImpactMilestone;
  row: number;
  withDivider: boolean;
}): JSX.Element {
  const style = { gridRow: row };
  return (
    <>
      <span
        className={cn('slide-milestone-title', withDivider && 'slide-milestone-cell--divided')}
        style={style}
      >
        {milestone.title}
      </span>
      <span
        className={cn('slide-milestone-status', withDivider && 'slide-milestone-cell--divided')}
        style={style}
      >
        <SlideStatusDot status={milestone.status} size="sm" />
      </span>
      <span
        className={cn('slide-milestone-timeline', withDivider && 'slide-milestone-cell--divided')}
        style={style}
      >
        {formatSlideMonthYear(milestone.targetDate)}
      </span>
    </>
  );
}
