import { useState, type JSX } from 'react';
import { ChevronDown, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { downloadImpactDeck, fileSlug } from '@/lib/export-pptx';
import { slugify } from '@/lib/slugify';
import { SlideColumnHeader } from './slide-column-header';
import { SlideInitiativeRow } from './slide-initiative-row';
import { SlideStatusLegend } from './slide-status-legend';
import { formatSlideAsOfDate } from './slide-month-year';
import type { ImpactRow } from '@/lib/build-impact-row';

export function SlideWorkstreamSection({
  workstreamName,
  asOfDate,
  initiatives,
}: {
  workstreamName: string;
  asOfDate: string | null;
  initiatives: ImpactRow[];
}): JSX.Element | null {
  const [expanded, setExpanded] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Mirrors buildImpactDeck's own skip-if-empty logic for a workstream group.
  if (initiatives.length === 0) return null;

  async function handleExport(): Promise<void> {
    setExporting(true);
    try {
      await downloadImpactDeck(
        [{ workstreamName, asOfDate, initiatives }],
        `NRS_TWG_${fileSlug(workstreamName)}.pptx`,
      );
      toast.success(`${workstreamName} slide${initiatives.length > 1 ? 's' : ''} exported.`);
    } catch {
      toast.error(`Could not export ${workstreamName}.`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section id={slugify(workstreamName)} className="scroll-mt-20">
      <div className="slide-section-head">
        <button
          type="button"
          className="slide-section-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn('slide-section-chevron', !expanded && 'slide-section-chevron--collapsed')}
          />
          <h3 className="slide-section-title">{workstreamName}</h3>
        </button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <FileDown className="h-3.5 w-3.5" />
          {exporting ? 'Exporting…' : 'Export PPTX'}
        </Button>
      </div>
      <div className="slide-section-accent" aria-hidden="true" />
      {expanded && (
        <>
          <p className="slide-section-asof">Update as of {formatSlideAsOfDate(asOfDate)}</p>
          <SlideStatusLegend />
          <div className="slide-scroll">
            <SlideColumnHeader />
            {initiatives.map((initiative) => (
              <SlideInitiativeRow key={initiative.id} initiative={initiative} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
