import { useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { buildImpactInitiativeRow, workstreamAsOfDate } from '@/lib/build-impact-row';
import { downloadImpactDeck, fileSlug } from '@/lib/export-pptx';
import { slugify } from '@/lib/slugify';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidePreviewStrip } from '@/components/slide-view/slide-preview-strip';
import type { WorkstreamGroup } from '@/lib/pptx/impact-slide';
import { SectionHeading } from '@/components/section-heading';
import { RAG_STATUSES, type Initiative, type RagStatus, type Workstream } from '@/types/api';
import '@/components/slide-view/slide-view.css';

function countByStatus(initiatives: Initiative[]): Record<RagStatus, number> {
  const counts = Object.fromEntries(RAG_STATUSES.map((s) => [s, 0])) as Record<RagStatus, number>;
  for (const i of initiatives) counts[i.status] += 1;
  return counts;
}

export default function ExportsPage(): JSX.Element {
  const { data: workstreams, loading: loadingWorkstreams } = useApiQuery(() => api.workstreams.list(), []);
  const { data: initiatives, loading: loadingInitiatives } = useApiQuery(() => api.initiatives.list(), []);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const loading = loadingWorkstreams || loadingInitiatives;

  async function exportWorkstream(ws: Workstream): Promise<void> {
    const wsInitiatives = (initiatives ?? []).filter((i) => i.workstream_id === ws.id);
    if (wsInitiatives.length === 0) {
      toast.error(`${ws.name} has no initiatives to export.`);
      return;
    }
    setExportingId(ws.id);
    try {
      const rows = await Promise.all(wsInitiatives.map(buildImpactInitiativeRow));
      await downloadImpactDeck(
        [{ workstreamName: ws.name, asOfDate: workstreamAsOfDate(wsInitiatives), initiatives: rows }],
        `NRS_TWG_${fileSlug(ws.name)}.pptx`,
      );
      toast.success(`${ws.name} slide${rows.length > 1 ? 's' : ''} exported.`);
    } catch {
      toast.error(`Could not export ${ws.name}.`);
    } finally {
      setExportingId(null);
    }
  }

  async function exportFullDeck(): Promise<void> {
    if (!workstreams || !initiatives) return;
    setExportingId('__all__');
    try {
      const groups: WorkstreamGroup[] = [];
      for (const ws of workstreams) {
        const wsInitiatives = initiatives.filter((i) => i.workstream_id === ws.id);
        if (wsInitiatives.length === 0) continue;
        const rows = await Promise.all(wsInitiatives.map(buildImpactInitiativeRow));
        groups.push({ workstreamName: ws.name, asOfDate: workstreamAsOfDate(wsInitiatives), initiatives: rows });
      }
      await downloadImpactDeck(groups, 'NRS_TWG_Full_Deck.pptx');
      toast.success('Full TWG deck exported.');
    } catch {
      toast.error('Could not export the full deck.');
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="slide-view space-y-6">
      <div className="flex flex-col gap-4 rounded-md bg-(--slide-header-band) p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-white/85">
          Generates the &ldquo;Impact across initiatives&rdquo; slides — plus a closing delivery heatmap — in
          the exact TWG deck format — same colors, layout, header icons and logo — filled with live data
          instead of a manual compile. Preview the same look in-app on the{' '}
          <Link to="/impact" className="font-medium text-white underline underline-offset-2">
            Impact View
          </Link>{' '}
          page first.
        </p>
        <Button onClick={exportFullDeck} disabled={loading || exportingId !== null} className="shrink-0">
          <Download className="h-4 w-4" />
          {exportingId === '__all__' ? 'Exporting…' : 'Export full deck'}
        </Button>
      </div>

      <div className="rounded-md border-l-4 border-l-(--slide-accent) bg-amber-50 px-4 py-3 text-sm text-amber-900">
        The delivery heatmap&rsquo;s &ldquo;Initiative progress&rdquo; dot and &ldquo;Read&rdquo; column are a
        human editorial judgment call in the original deck, not something Pulse&rsquo;s data can reproduce — ours
        are computed directly from each initiative&rsquo;s current status instead, so read them as status, not
        as a curated risk call.
      </div>

      <section>
        <SectionHeading meta={`${workstreams?.length ?? 0} workstreams`}>Export by workstream</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}

        {!loading &&
          workstreams?.map((ws) => {
            const wsInitiatives = (initiatives ?? []).filter((i) => i.workstream_id === ws.id);
            const count = wsInitiatives.length;
            return (
              <Card key={ws.id} className="border-l-[3px] border-l-transparent transition-colors hover:border-l-primary hover:shadow-md">
                <CardHeader>
                  <CardTitle className="font-display">{ws.name}</CardTitle>
                  <CardDescription>
                    {count} initiative{count === 1 ? '' : 's'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {count > 0 && <SlidePreviewStrip statusCounts={countByStatus(wsInitiatives)} />}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={count === 0 || exportingId !== null}
                      onClick={() => exportWorkstream(ws)}
                    >
                      <FileDown className="h-4 w-4" />
                      {exportingId === ws.id ? 'Exporting…' : 'Export PPTX'}
                    </Button>
                    {count > 0 ? (
                      <Button variant="ghost" asChild>
                        <Link to={`/impact#${slugify(ws.name)}`}>View live</Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" disabled>
                        View live
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
