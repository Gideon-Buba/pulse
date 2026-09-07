import type { JSX } from 'react';
import { HEADER_ICON_SVG } from '@/lib/pptx/assets';

const COLUMNS: { key: keyof typeof HEADER_ICON_SVG; label: string }[] = [
  { key: 'name', label: 'Initiative name' },
  { key: 'kpi', label: 'Expected impact/KPI' },
  { key: 'milestone', label: 'Milestone / Key Activity' },
  { key: 'status', label: 'Status' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'update', label: 'Latest update' },
];

/** The dark header band — same 6 columns, labels and icons as the deck. */
export function SlideColumnHeader(): JSX.Element {
  return (
    <div className="slide-header-band">
      {COLUMNS.map((col) => (
        <span key={col.key} className="slide-header-band__cell">
          <img src={HEADER_ICON_SVG[col.key]} alt="" aria-hidden="true" />
          {col.label}
        </span>
      ))}
    </div>
  );
}
