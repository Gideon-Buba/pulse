import type { JSX, ReactNode } from 'react';

/** The Archivo + red skew-tab heading treatment introduced on the Dashboard, reused app-wide. */
export function SectionHeading({ children, meta }: { children: ReactNode; meta?: ReactNode }): JSX.Element {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        <span className="inline-block h-[11px] w-[15px] shrink-0 -skew-x-[22deg] bg-primary" aria-hidden="true" />
        {children}
      </h2>
      {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
    </div>
  );
}
