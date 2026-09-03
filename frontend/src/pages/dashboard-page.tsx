import { useMemo, useRef, useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DeliveryHeatmapBar,
  DeliveryHeatmapLegend,
  doneLabel,
  delayedLabel,
  type MilestoneCounts,
} from '@/components/charts/delivery-heatmap';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, truncate } from '@/lib/format';
import type { LGate, RagStatus } from '@/types/api';
import './dashboard.css';

type Health = 'risk' | 'prog' | 'todo' | 'done';
type SortKey = 'risk' | 'prog' | 'least' | 'recent' | 'name' | 'ws';
type ViewMode = 'grid' | 'list' | 'compact';

const HEALTH_BY_STATUS: Record<RagStatus, Health> = {
  'Delayed/at risk': 'risk',
  'In progress': 'prog',
  'Not started': 'todo',
  Completed: 'done',
};
const HEALTH_LABEL: Record<Health, string> = {
  risk: 'At risk',
  prog: 'In progress',
  todo: 'Not started',
  done: 'Completed',
};
const HEALTH_ORDER: Health[] = ['risk', 'prog', 'todo', 'done'];
const STAGE_PCT: Record<Health, number> = { done: 100, prog: 55, risk: 35, todo: 10 };

function lgateNum(lg: LGate | null): number | null {
  return lg ? Number(lg.slice(1)) : null;
}
function has(v: string | null | undefined): boolean {
  return Boolean(v && v.trim());
}

interface DashRow {
  id: string;
  title: string;
  wsId: string;
  wsName: string;
  health: Health;
  lgate: LGate | null;
  pct: number;
  kpi: string | null;
  target: string | null;
  actual: string | null;
  owner: string | null;
  latest: string | null;
  decision: string | null;
  updatedAt: string | null;
}

interface Filters {
  status: Set<Health>;
  ws: Set<string>;
  decisionOnly: boolean;
  query: string;
}

function matchInit(row: DashRow, f: Filters): boolean {
  if (f.status.size && !f.status.has(row.health)) return false;
  if (f.ws.size && !f.ws.has(row.wsId)) return false;
  if (f.decisionOnly && !has(row.decision)) return false;
  if (f.query) {
    const q = f.query.toLowerCase();
    const hay = [row.title, row.wsName, row.kpi, row.latest, row.decision, row.lgate]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

const SORTERS: Record<SortKey, (a: DashRow, b: DashRow) => number> = {
  risk: (a, b) =>
    Number(b.health === 'risk') - Number(a.health === 'risk') ||
    Number(has(b.decision)) - Number(has(a.decision)) ||
    a.pct - b.pct,
  prog: (a, b) => b.pct - a.pct,
  least: (a, b) => a.pct - b.pct,
  recent: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
  name: (a, b) => a.title.localeCompare(b.title),
  ws: (a, b) => a.wsName.localeCompare(b.wsName) || Number(b.health === 'risk') - Number(a.health === 'risk'),
};

export default function DashboardPage(): JSX.Element {
  const { data: workstreams, loading: loadingWorkstreams } = useApiQuery(() => api.workstreams.list(), []);
  const {
    data: initiatives,
    loading: loadingInitiatives,
    error,
  } = useApiQuery(() => api.initiatives.list(), []);
  const { data: milestonesByInitiative, loading: loadingMilestones } = useApiQuery(
    () =>
      initiatives
        ? Promise.all(initiatives.map((init) => api.milestones.listForInitiative(init.id)))
        : Promise.resolve(null),
    [initiatives],
  );

  const [filters, setFilters] = useState<Filters>({
    status: new Set(),
    ws: new Set(),
    decisionOnly: false,
    query: '',
  });
  const [sort, setSort] = useState<SortKey>('risk');
  const [view, setView] = useState<ViewMode>('grid');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const cardRefs = useRef(new Map<string, HTMLElement>());

  const wsNameById = useMemo(() => {
    const map = new Map<string, string>();
    workstreams?.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [workstreams]);

  const rows = useMemo<DashRow[]>(() => {
    if (!initiatives) return [];
    return initiatives.map((init) => {
      const health = HEALTH_BY_STATUS[init.status];
      const n = lgateNum(init.l_gate_stage);
      return {
        id: init.id,
        title: init.title,
        wsId: init.workstream_id,
        wsName: wsNameById.get(init.workstream_id) ?? 'Unassigned',
        health,
        lgate: init.l_gate_stage,
        pct: n != null ? Math.round((n / 5) * 100) : STAGE_PCT[health],
        kpi: init.kpi_expected_impact,
        target: init.target,
        actual: init.actual,
        owner: init.directorate_owner,
        latest: init.latest_update,
        decision: init.decisions_needed,
        updatedAt: init.update_as_at,
      };
    });
  }, [initiatives, wsNameById]);

  const asAt = useMemo(() => {
    const dates = rows.map((r) => r.updatedAt).filter((d): d is string => Boolean(d));
    return dates.length ? dates.reduce((max, d) => (d > max ? d : max)) : null;
  }, [rows]);

  const shown = useMemo(
    () => rows.filter((r) => matchInit(r, filters)).sort(SORTERS[sort]),
    [rows, filters, sort],
  );

  const isFiltered =
    filters.status.size > 0 || filters.ws.size > 0 || filters.decisionOnly || filters.query.trim() !== '';

  const counts = useMemo(() => {
    const byHealthAll: Record<Health, number> = { risk: 0, prog: 0, todo: 0, done: 0 };
    rows.forEach((r) => (byHealthAll[r.health] += 1));
    const byHealthShown: Record<Health, number> = { risk: 0, prog: 0, todo: 0, done: 0 };
    shown.forEach((r) => (byHealthShown[r.health] += 1));
    const decisionAll = rows.filter((r) => has(r.decision)).length;
    const decisionShown = shown.filter((r) => has(r.decision)).length;
    const avgPct = shown.length ? Math.round(shown.reduce((s, r) => s + r.pct, 0) / shown.length) : 0;
    const portfolioDonePct = shown.length ? Math.round((byHealthShown.done / shown.length) * 100) : 0;
    const riskWorkstreams = new Set(shown.filter((r) => r.health === 'risk').map((r) => r.wsId)).size;
    return { byHealthAll, byHealthShown, decisionAll, decisionShown, avgPct, portfolioDonePct, riskWorkstreams };
  }, [rows, shown]);

  const workstreamOptions = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.wsId, (map.get(r.wsId) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([id, n]) => ({ id, name: wsNameById.get(id) ?? 'Unassigned', n }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, wsNameById]);

  const workstreamBars = useMemo(() => {
    const map = new Map<string, Record<Health, number>>();
    shown.forEach((r) => {
      const cur = map.get(r.wsId) ?? { risk: 0, prog: 0, todo: 0, done: 0 };
      cur[r.health] += 1;
      map.set(r.wsId, cur);
    });
    return Array.from(map.entries())
      .map(([id, c]) => ({ id, name: wsNameById.get(id) ?? 'Unassigned', c, total: c.risk + c.prog + c.todo + c.done }))
      .sort((a, b) => b.total - a.total);
  }, [shown, wsNameById]);

  const needsAttention = useMemo(
    () =>
      shown
        .filter((r) => r.health === 'risk')
        .sort((a, b) => (lgateNum(a.lgate) ?? 9) - (lgateNum(b.lgate) ?? 9) || a.title.localeCompare(b.title)),
    [shown],
  );

  const heatmapRows = useMemo(() => {
    if (!initiatives || !milestonesByInitiative) return [];
    return initiatives.map((init, idx) => {
      const ms = milestonesByInitiative[idx] ?? [];
      const c: MilestoneCounts = {
        completed: ms.filter((m) => m.status === 'Completed').length,
        inProgress: ms.filter((m) => m.status === 'In progress').length,
        delayed: ms.filter((m) => m.status === 'Delayed/at risk').length,
        notStarted: ms.filter((m) => m.status === 'Not started').length,
        total: ms.length,
      };
      return {
        id: init.id,
        title: init.title,
        workstreamName: wsNameById.get(init.workstream_id) ?? '—',
        counts: c,
        remark: init.latest_update ? truncate(init.latest_update, 50) : '—',
      };
    });
  }, [initiatives, milestonesByInitiative, wsNameById]);

  const heatmapHeadline = useMemo(() => {
    if (heatmapRows.length === 0) return 'Live milestone delivery across all initiatives.';
    const byWorkstream = new Map<string, { progressed: number; total: number }>();
    heatmapRows.forEach((row) => {
      const cur = byWorkstream.get(row.workstreamName) ?? { progressed: 0, total: 0 };
      cur.progressed += row.counts.completed + row.counts.inProgress;
      cur.total += row.counts.total;
      byWorkstream.set(row.workstreamName, cur);
    });
    const ranked = Array.from(byWorkstream.entries())
      .filter(([, v]) => v.total > 0)
      .map(([name, v]) => ({ name, ratio: v.progressed / v.total }))
      .sort((a, b) => b.ratio - a.ratio);
    const best = ranked[0];
    return best ? `${best.name} has the strongest milestone progress.` : 'Live milestone delivery across all initiatives.';
  }, [heatmapRows]);

  function toggleStatus(h: Health): void {
    setFilters((f) => {
      const next = new Set(f.status);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return { ...f, status: next };
    });
  }
  function toggleWs(id: string): void {
    setFilters((f) => {
      const next = new Set(f.ws);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, ws: next };
    });
  }
  function toggleDecision(): void {
    setFilters((f) => ({ ...f, decisionOnly: !f.decisionOnly }));
  }
  function clearFilters(): void {
    setFilters({ status: new Set(), ws: new Set(), decisionOnly: false, query: '' });
  }
  function toggleOpen(id: string): void {
    setOpenIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function openAndScroll(id: string): void {
    setOpenIds((s) => new Set(s).add(id));
    requestAnimationFrame(() => {
      cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function toggleExpandAll(): void {
    if (openIds.size >= shown.length && shown.length > 0) setOpenIds(new Set());
    else setOpenIds(new Set(shown.map((r) => r.id)));
  }

  const loading = loadingWorkstreams || loadingInitiatives;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="nd">
        <div className="nd-hero">
          <h1>
            Transformation Working Group
            <span>Initiative status dashboard</span>
          </h1>
          <div className="nd-asat">
            Data as at
            <b>{asAt ? formatDate(asAt) : '—'}</b>
          </div>
        </div>
        <div className="nd-hrule">
          <span className="g" />
          <span className="r" />
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            <div className="nd-kpis">
              <div className="nd-k">
                <div className="n">{shown.length}</div>
                <div className="l">Initiatives</div>
                <div className="sub">{isFiltered ? `of ${rows.length} total` : `${counts.avgPct}% avg stage progress`}</div>
              </div>
              <button type="button" className={`nd-k${filters.status.has('prog') ? ' on' : ''}`} onClick={() => toggleStatus('prog')}>
                <div className="n">{counts.byHealthShown.prog}</div>
                <div className="l">In progress</div>
                <div className="sub">{counts.byHealthShown.todo} not started</div>
              </button>
              <button type="button" className={`nd-k risk${filters.status.has('risk') ? ' on' : ''}`} onClick={() => toggleStatus('risk')}>
                <div className="n">{counts.byHealthShown.risk}</div>
                <div className="l">At risk</div>
                <div className="sub">
                  in {counts.riskWorkstreams} workstream{counts.riskWorkstreams === 1 ? '' : 's'}
                </div>
              </button>
              <button type="button" className={`nd-k${filters.status.has('done') ? ' on' : ''}`} onClick={() => toggleStatus('done')}>
                <div className="n">{counts.byHealthShown.done}</div>
                <div className="l">Completed</div>
                <div className="sub">{counts.portfolioDonePct}% of portfolio</div>
              </button>
              <button type="button" className={`nd-k decision${filters.decisionOnly ? ' on' : ''}`} onClick={toggleDecision}>
                <div className="n">{counts.decisionShown}</div>
                <div className="l">Awaiting decision</div>
                <div className="sub">need TO / MC steer</div>
              </button>
            </div>

            <div className="nd-ribwrap">
              <div className="nd-riblab">
                {isFiltered ? `Filtered view — ${shown.length} of ${rows.length} initiatives` : 'Portfolio at a glance — every initiative, one tile'}
              </div>
              <div className="nd-ribbon">
                {shown.length === 0 ? (
                  <span style={{ color: 'var(--nd-mute)', fontSize: 13 }}>Nothing matches these filters.</span>
                ) : (
                  [...shown]
                    .sort((a, b) => HEALTH_ORDER.indexOf(a.health) - HEALTH_ORDER.indexOf(b.health))
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`nd-rb ${r.health}`}
                        title={`${r.title} — ${r.lgate ?? 'stage n/a'} (${HEALTH_LABEL[r.health]})`}
                        onClick={() => openAndScroll(r.id)}
                      />
                    ))
                )}
              </div>
            </div>

            <div className="nd-ctrl">
              <div className="nd-crow">
                <span className="nd-clab">Status</span>
                {HEALTH_ORDER.map((h) => (
                  <button key={h} type="button" className={`nd-chip${filters.status.has(h) ? ' on' : ''}`} onClick={() => toggleStatus(h)}>
                    <i style={{ background: `var(--nd-${h})` }} />
                    {HEALTH_LABEL[h]}
                    <span className="ct">{counts.byHealthAll[h]}</span>
                  </button>
                ))}
                <button type="button" className={`nd-chip${filters.decisionOnly ? ' on' : ''}`} onClick={toggleDecision}>
                  <i style={{ background: 'var(--nd-over)' }} />
                  Awaiting decision
                  <span className="ct">{counts.decisionAll}</span>
                </button>
              </div>
              <div className="nd-crow">
                <span className="nd-clab">Workstream</span>
                {workstreamOptions.map((w) => (
                  <button key={w.id} type="button" className={`nd-chip${filters.ws.has(w.id) ? ' on' : ''}`} onClick={() => toggleWs(w.id)}>
                    {w.name}
                    <span className="ct">{w.n}</span>
                  </button>
                ))}
              </div>
              <div className="nd-crow">
                <input
                  className="nd-search"
                  type="search"
                  placeholder="Search initiative, workstream, update text…"
                  aria-label="Search"
                  value={filters.query}
                  onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                />
                <select className="nd-select" aria-label="Sort initiatives" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  <option value="risk">Sort: risk first</option>
                  <option value="prog">Sort: most advanced</option>
                  <option value="least">Sort: least advanced</option>
                  <option value="recent">Sort: most recent update</option>
                  <option value="name">Sort: name A–Z</option>
                  <option value="ws">Sort: workstream</option>
                </select>
                <div className="nd-viewtog" role="group" aria-label="Display">
                  {(['grid', 'list', 'compact'] as ViewMode[]).map((v) => (
                    <button key={v} type="button" className={view === v ? 'on' : ''} onClick={() => setView(v)}>
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
                <button type="button" className="nd-btn" onClick={toggleExpandAll}>
                  {openIds.size >= shown.length && shown.length > 0 ? 'Collapse all' : 'Expand all'}
                </button>
                <button type="button" className="nd-btn" onClick={() => window.print()}>
                  Print
                </button>
                {isFiltered && (
                  <button type="button" className="nd-btn" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
                <span className="nd-spacer" />
                <span className="nd-count">
                  {isFiltered ? (
                    <>
                      Showing <b>{shown.length}</b> of {rows.length} initiatives
                    </>
                  ) : (
                    <>
                      <b>{rows.length}</b> initiatives · {workstreamOptions.length} workstreams
                    </>
                  )}
                </span>
              </div>
            </div>

            <section className="nd-section">
              <h2>Delivery by workstream</h2>
              {workstreamBars.length === 0 ? (
                <div className="nd-empty">No initiatives match these filters.</div>
              ) : (
                workstreamBars.map((w) => (
                  <button key={w.id} type="button" className="nd-wsrow" onClick={() => toggleWs(w.id)}>
                    <div className="nd-wshead">
                      <span className="nd-wsname">{w.name}</span>
                      <span className="nd-wsmeta">
                        {w.total} initiative{w.total === 1 ? '' : 's'}
                        {w.c.risk > 0 && (
                          <>
                            {' '}
                            · <b className="nd-riskt">{w.c.risk} at risk</b>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="nd-bar">
                      {HEALTH_ORDER.filter((h) => w.c[h] > 0).map((h) => (
                        <span
                          key={h}
                          className={`nd-seg ${h}`}
                          style={{ width: `${(w.c[h] / w.total) * 100}%` }}
                          title={`${HEALTH_LABEL[h]}: ${w.c[h]}`}
                        />
                      ))}
                    </div>
                  </button>
                ))
              )}
            </section>

            <section className="nd-section">
              <h2>
                Needs attention{' '}
                <em>
                  {needsAttention.length} at risk{counts.decisionShown ? ` · ${counts.decisionShown} awaiting decision` : ''}
                </em>
              </h2>
              {needsAttention.length === 0 ? (
                <div className="nd-empty">Nothing flagged at risk{isFiltered ? ' in this filtered view' : ''}.</div>
              ) : (
                <table className="nd-risktable">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Initiative</th>
                      <th>Workstream</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needsAttention.map((r) => (
                      <tr key={r.id} onClick={() => openAndScroll(r.id)}>
                        <td className="nd-stage">{r.lgate ?? '—'}</td>
                        <td>
                          <b>{r.title}</b>
                          {has(r.decision) && <span>Decision: {r.decision}</span>}
                        </td>
                        <td className="nd-wsc">{r.wsName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="nd-section">
              <h2>
                Initiatives <em>{shown.length} shown · click any card for detail</em>
              </h2>
              {shown.length === 0 ? (
                <div className="nd-empty">No initiatives match these filters.</div>
              ) : (
                <div className={`nd-cards ${view}`}>
                  {shown.map((r) => (
                    <InitiativeCard
                      key={r.id}
                      row={r}
                      view={view}
                      open={openIds.has(r.id)}
                      onToggle={() => toggleOpen(r.id)}
                      registerRef={(el) => {
                        if (el) cardRefs.current.set(r.id, el);
                        else cardRefs.current.delete(r.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* milestone delivery heatmap — kept as previously built, unstyled to match the sections above */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Delivery heatmap</CardTitle>
              <CardDescription>{heatmapHeadline}</CardDescription>
            </div>
            {asAt && <span className="shrink-0 text-xs text-muted-foreground">As at {formatDate(asAt)}</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingInitiatives || loadingMilestones ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <>
              <DeliveryHeatmapLegend />
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Initiative</TableHead>
                      <TableHead>Workstream</TableHead>
                      <TableHead className="w-[200px]">Milestone delivery</TableHead>
                      <TableHead className="text-right">Done</TableHead>
                      <TableHead className="text-right">Delayed</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heatmapRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-[220px]">
                          <Link to={`/initiatives/${row.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                            {row.title}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{row.workstreamName}</TableCell>
                        <TableCell>
                          <DeliveryHeatmapBar counts={row.counts} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">{doneLabel(row.counts)}</TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">{delayedLabel(row.counts)}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">{row.remark}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InitiativeCard({
  row,
  view,
  open,
  onToggle,
  registerRef,
}: {
  row: DashRow;
  view: ViewMode;
  open: boolean;
  onToggle: () => void;
  registerRef: (el: HTMLElement | null) => void;
}): JSX.Element {
  const updatedLabel = row.updatedAt ? `Updated ${formatDate(row.updatedAt)}` : 'No update date';
  const n = lgateNum(row.lgate);

  const pill = (
    <span className={`nd-pill ${row.health}`}>
      <i />
      {HEALTH_LABEL[row.health]}
    </span>
  );

  const gate = (
    <>
      <div className={`nd-gate ${row.health}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`nd-gcell${n != null && i <= n ? ' on' : ''}`} />
        ))}
      </div>
      <div className="nd-gcap">
        <span>{row.lgate ?? 'Stage not set'}</span>
        <b>{row.pct}%</b>
      </div>
    </>
  );

  const kpiLine = has(row.kpi) ? (
    <div className="nd-kpiline">
      <span>{row.kpi}</span>
      <em>
        {row.actual || '—'} <s>/</s> {row.target || '—'}
      </em>
    </div>
  ) : null;

  const flag = has(row.decision) ? <span className="nd-flag">Decision needed</span> : null;

  const detail = open ? (
    <div className="nd-detail" onClick={(e) => e.stopPropagation()}>
      {has(row.latest) && (
        <div className="nd-dupd">
          <strong>Latest update</strong>
          {row.latest}
        </div>
      )}
      {has(row.decision) && (
        <div className="nd-dupd dec">
          <strong>Decisions needed</strong>
          {row.decision}
        </div>
      )}
      <table className="nd-mtable">
        <tbody>
          <tr>
            <th>Workstream</th>
            <td>{row.wsName}</td>
          </tr>
          <tr>
            <th>L-gate stage</th>
            <td>{row.lgate ?? '—'}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>
              <span className={`nd-dot ${row.health}`} />
              {HEALTH_LABEL[row.health]}
            </td>
          </tr>
          <tr>
            <th>KPI / target</th>
            <td>{has(row.kpi) ? `${row.kpi} — ${row.actual || '—'} / ${row.target || '—'}` : '—'}</td>
          </tr>
          <tr>
            <th>Directorate / Owner</th>
            <td>{row.owner || <span style={{ color: 'var(--nd-mute)' }}>not assigned</span>}</td>
          </tr>
          <tr>
            <th>Updated</th>
            <td>{formatDate(row.updatedAt)}</td>
          </tr>
          <tr>
            <th />
            <td>
              <Link to={`/initiatives/${row.id}`} className="nd-more">
                Open full record →
              </Link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ) : null;

  const more = <span className="nd-more">{open ? 'Close ▲' : 'Detail ▼'}</span>;

  if (view === 'list') {
    return (
      <article
        ref={registerRef}
        className={`nd-card ${row.health}${open ? ' open' : ''}`}
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="nd-rmain">
          <span className="nd-ws">{row.wsName}</span>
          <h3>{row.title}</h3>
          {flag}
        </div>
        <div className="nd-rgate">{gate}</div>
        <div className="nd-rstat">
          {pill}
          {kpiLine}
        </div>
        <div className="nd-rmeta">
          <span className="nd-upd">{updatedLabel}</span>
          {more}
        </div>
        {detail}
      </article>
    );
  }

  return (
    <article
      ref={registerRef}
      className={`nd-card ${row.health}${open ? ' open' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="nd-chead">
        <span className="nd-ws">{row.wsName}</span>
        {pill}
      </div>
      <h3>{row.title}</h3>
      {gate}
      {kpiLine}
      {flag}
      <div className="nd-cfoot">
        <span className="nd-upd">{updatedLabel}</span>
        {more}
      </div>
      {detail}
    </article>
  );
}
