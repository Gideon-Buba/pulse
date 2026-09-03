import type { JSX } from 'react';

/**
 * Matches the NRS "Delivery Heatmap" slide template exactly: a per-initiative
 * 100%-stacked bar (Completed → In progress → Delayed, with the base track
 * itself standing in for "Not started" wherever nothing is drawn), sharp
 * rectangles with no gaps, exact colors from the source deck.
 */
export const DELIVERY_COLORS = {
  completed: '#B7E4B0',
  inProgress: '#BFBFBF',
  delayed: '#D53127',
  notStarted: '#EDEDED',
} as const;

export interface MilestoneCounts {
  completed: number;
  inProgress: number;
  delayed: number;
  notStarted: number;
  total: number;
}

export function DeliveryHeatmapBar({ counts }: { counts: MilestoneCounts }): JSX.Element {
  const { completed, inProgress, delayed, notStarted, total } = counts;

  if (total === 0) {
    return <div className="h-[9px] w-full" style={{ backgroundColor: DELIVERY_COLORS.notStarted }} />;
  }

  const pct = (n: number) => (n / total) * 100;

  return (
    <div
      className="group relative h-[9px] w-full"
      style={{ backgroundColor: DELIVERY_COLORS.notStarted }}
      role="img"
      aria-label={`${completed} completed, ${inProgress} in progress, ${delayed} delayed, ${notStarted} not started, out of ${total} milestones`}
    >
      <div className="flex h-full w-full">
        {completed > 0 && (
          <div style={{ width: `${pct(completed)}%`, backgroundColor: DELIVERY_COLORS.completed }} />
        )}
        {inProgress > 0 && (
          <div style={{ width: `${pct(inProgress)}%`, backgroundColor: DELIVERY_COLORS.inProgress }} />
        )}
        {delayed > 0 && (
          <div style={{ width: `${pct(delayed)}%`, backgroundColor: DELIVERY_COLORS.delayed }} />
        )}
      </div>
      <div
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 hidden whitespace-nowrap rounded-md bg-gray-950 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block"
        role="tooltip"
      >
        <span className="font-semibold">{completed}</span> completed ·{' '}
        <span className="font-semibold">{inProgress}</span> in progress ·{' '}
        <span className="font-semibold">{delayed}</span> delayed ·{' '}
        <span className="font-semibold">{notStarted}</span> not started
      </div>
    </div>
  );
}

export function DeliveryHeatmapLegend(): JSX.Element {
  const items: { label: string; color: string }[] = [
    { label: 'Completed', color: DELIVERY_COLORS.completed },
    { label: 'In progress', color: DELIVERY_COLORS.inProgress },
    { label: 'Delayed at risk', color: DELIVERY_COLORS.delayed },
    { label: 'Not started', color: DELIVERY_COLORS.notStarted },
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 shrink-0 border border-black/10" style={{ backgroundColor: it.color }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

export function doneLabel(counts: MilestoneCounts): string {
  return `${counts.completed}/${counts.total}`;
}

export function delayedLabel(counts: MilestoneCounts): string {
  return counts.delayed > 0 ? `${counts.delayed} of ${counts.total}` : '–';
}
