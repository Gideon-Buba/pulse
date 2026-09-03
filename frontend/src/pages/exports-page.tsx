import { useState, type JSX } from 'react';
import { Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import pptxgen from 'pptxgenjs';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { buildImpactDeck, type ImpactInitiative, type WorkstreamGroup } from '@/lib/pptx/impact-slide';
import { SectionHeading } from '@/components/section-heading';
import type { Initiative, Workstream } from '@/types/api';

async function buildInitiativeRow(init: Initiative): Promise<ImpactInitiative> {
  const [milestones, updates] = await Promise.all([
    api.milestones.listForInitiative(init.id),
    api.updates.listForInitiative(init.id),
  ]);

  const sortedUpdates = [...updates].sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
  const sameAsLastTwg =
    sortedUpdates.length >= 2 &&
    sortedUpdates[0].latest_update.trim() === sortedUpdates[1].latest_update.trim();

  return {
    title: init.title,
    kpi: init.kpi_expected_impact,
    target: init.target,
    actual: init.actual,
    lGate: init.l_gate_stage,
    status: init.status,
    latestUpdate: init.latest_update,
    sameAsLastTwg,
    milestones: [...milestones]
      .sort((a, b) => a.sequence - b.sequence)
      .map((m) => ({ title: m.title, targetDate: m.target_date, status: m.status })),
  };
}

function workstreamAsOfDate(initiatives: Initiative[]): string | null {
  const dates = initiatives.map((i) => i.update_as_at).filter((d): d is string => Boolean(d));
  return dates.length ? dates.reduce((max, d) => (d > max ? d : max)) : null;
}

function fileSlug(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
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
      const rows = await Promise.all(wsInitiatives.map(buildInitiativeRow));
      const pptx = new pptxgen();
      buildImpactDeck(pptx, [{ workstreamName: ws.name, asOfDate: workstreamAsOfDate(wsInitiatives), initiatives: rows }]);
      await pptx.writeFile({ fileName: `NRS_TWG_${fileSlug(ws.name)}.pptx` });
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
        const rows = await Promise.all(wsInitiatives.map(buildInitiativeRow));
        groups.push({ workstreamName: ws.name, asOfDate: workstreamAsOfDate(wsInitiatives), initiatives: rows });
      }
      const pptx = new pptxgen();
      buildImpactDeck(pptx, groups);
      await pptx.writeFile({ fileName: 'NRS_TWG_Full_Deck.pptx' });
      toast.success('Full TWG deck exported.');
    } catch {
      toast.error('Could not export the full deck.');
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Generates the &ldquo;Impact across initiatives&rdquo; slides — plus a closing delivery heatmap — in
          the exact TWG deck format — same colors, layout, header icons and logo — filled with live data
          instead of a manual compile.
        </p>
        <Button onClick={exportFullDeck} disabled={loading || exportingId !== null} className="shrink-0">
          <Download className="h-4 w-4" />
          {exportingId === '__all__' ? 'Exporting…' : 'Export full deck'}
        </Button>
      </div>

      <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
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
              </CardContent>
            </Card>
          ))}

        {!loading &&
          workstreams?.map((ws) => {
            const count = (initiatives ?? []).filter((i) => i.workstream_id === ws.id).length;
            return (
              <Card key={ws.id} className="border-l-[3px] border-l-transparent transition-colors hover:border-l-primary hover:shadow-md">
                <CardHeader>
                  <CardTitle className="font-display">{ws.name}</CardTitle>
                  <CardDescription>
                    {count} initiative{count === 1 ? '' : 's'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={count === 0 || exportingId !== null}
                    onClick={() => exportWorkstream(ws)}
                  >
                    <FileDown className="h-4 w-4" />
                    {exportingId === ws.id ? 'Exporting…' : 'Export PPTX'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
