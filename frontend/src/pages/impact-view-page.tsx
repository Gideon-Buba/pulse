import { useMemo, useState, type JSX } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { buildImpactInitiativeRow, workstreamAsOfDate } from '@/lib/build-impact-row';
import { downloadImpactDeck } from '@/lib/export-pptx';
import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { SlideWorkstreamSection } from '@/components/slide-view/slide-workstream-section';
import { SlideHeatmapSection, type HeatmapRowVM } from '@/components/slide-view/slide-heatmap-section';
import type { MilestoneCounts } from '@/components/charts/delivery-heatmap';
import { Skeleton } from '@/components/ui/skeleton';
import type { RagStatus } from '@/types/api';
import '@/components/slide-view/slide-view.css';

function computeCounts(statuses: RagStatus[]): MilestoneCounts {
  return {
    completed: statuses.filter((s) => s === 'Completed').length,
    inProgress: statuses.filter((s) => s === 'In progress').length,
    delayed: statuses.filter((s) => s === 'Delayed/at risk').length,
    notStarted: statuses.filter((s) => s === 'Not started').length,
    total: statuses.length,
  };
}

/**
 * A live, in-app reproduction of the TWG deck's "Impact across initiatives"
 * slides plus the closing delivery heatmap — see lib/pptx/impact-slide.ts
 * for the pixel-measured spec this page's colors/columns are drawn from.
 * Continuous per-workstream sections rather than paginated "slides": the
 * deck only paginates because of physical slide dimensions, which don't
 * apply to a scrollable web page.
 */
export default function ImpactViewPage(): JSX.Element {
  const { data: workstreams, loading: loadingWorkstreams } = useApiQuery(
    () => api.workstreams.list(),
    [],
  );
  const {
    data: initiatives,
    loading: loadingInitiatives,
    error,
  } = useApiQuery(() => api.initiatives.list(), []);
  const { data: rows, loading: loadingRows } = useApiQuery(
    () =>
      initiatives ? Promise.all(initiatives.map(buildImpactInitiativeRow)) : Promise.resolve(null),
    [initiatives],
  );

  const loading = loadingWorkstreams || loadingInitiatives || loadingRows;
  const [exportingFullDeck, setExportingFullDeck] = useState(false);

  const groups = useMemo(() => {
    if (!workstreams || !initiatives || !rows) return [];
    return workstreams.map((ws) => ({
      id: ws.id,
      workstreamName: ws.name,
      asOfDate: workstreamAsOfDate(initiatives.filter((i) => i.workstream_id === ws.id)),
      initiatives: rows.filter((r) => r.workstreamId === ws.id),
    }));
  }, [workstreams, initiatives, rows]);

  const heatmapRows = useMemo<HeatmapRowVM[]>(() => {
    if (!workstreams || !rows) return [];
    const wsNameById = new Map(workstreams.map((ws) => [ws.id, ws.name]));
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      workstreamName: wsNameById.get(r.workstreamId) ?? '—',
      status: r.status,
      counts: computeCounts(r.milestones.map((m) => m.status)),
    }));
  }, [workstreams, rows]);

  const overallAsOfDate = useMemo(
    () => (initiatives ? workstreamAsOfDate(initiatives) : null),
    [initiatives],
  );

  async function handleExportFullDeck(): Promise<void> {
    setExportingFullDeck(true);
    try {
      await downloadImpactDeck(groups, 'NRS_TWG_Full_Deck.pptx');
      toast.success('Full TWG deck exported.');
    } catch {
      toast.error('Could not export the full deck.');
    } finally {
      setExportingFullDeck(false);
    }
  }

  return (
    <div className="slide-view space-y-10">
      <SectionHeading
        meta={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {initiatives?.length ?? 0} initiatives
            </span>
            <Button
              size="sm"
              onClick={handleExportFullDeck}
              disabled={loading || exportingFullDeck}
            >
              <Download className="h-3.5 w-3.5" />
              {exportingFullDeck ? 'Exporting…' : 'Export full deck'}
            </Button>
          </div>
        }
      >
        Impact across initiatives
      </SectionHeading>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!loading && !error && (
        <>
          {groups.map((g) => (
            <SlideWorkstreamSection
              key={g.id}
              workstreamName={g.workstreamName}
              asOfDate={g.asOfDate}
              initiatives={g.initiatives}
            />
          ))}
          <SlideHeatmapSection rows={heatmapRows} asOfDate={overallAsOfDate} />
        </>
      )}
    </div>
  );
}
