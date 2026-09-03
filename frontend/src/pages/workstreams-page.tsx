import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Archive, MoreVertical, Pencil, Plus, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SectionHeading } from '@/components/section-heading';
import { StatusMixBar } from '@/components/status-mix-bar';
import { WorkstreamFormDialog } from '@/components/workstream-form-dialog';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import type { WorkstreamSummary } from '@/types/api';

export default function WorkstreamsPage(): JSX.Element {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'smo';
  const [showArchived, setShowArchived] = useState(false);

  const {
    data: workstreams,
    loading,
    error,
    refetch,
  } = useApiQuery(() => api.workstreams.list({ includeArchived: showArchived }), [showArchived]);
  const { data: summary, refetch: refetchSummary } = useApiQuery(() => api.workstreams.summary(), []);

  const summaryByName = useMemo(() => {
    const map = new Map<string, WorkstreamSummary>();
    summary?.forEach((row) => map.set(row.workstream, row));
    return map;
  }, [summary]);

  function refreshAll(): void {
    refetch();
    refetchSummary();
  }

  const active = workstreams?.filter((w) => !w.archived_at) ?? [];
  const archived = workstreams?.filter((w) => w.archived_at) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          The TWG&rsquo;s organizational groupings. Select one to see its initiatives.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
          {canManage && (
            <WorkstreamFormDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  New workstream
                </Button>
              }
              onSaved={refreshAll}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <section>
        <SectionHeading meta={`${active.length} active`}>Workstreams</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 7 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}

          {!loading &&
            active.map((ws) => {
              const row = summaryByName.get(ws.name);
              return (
                <Card
                  key={ws.id}
                  className="group border-l-[3px] border-l-transparent transition-colors hover:border-l-primary hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/initiatives?workstream=${ws.id}`} className="min-w-0 flex-1">
                        <div className="truncate font-display text-base font-semibold text-foreground">
                          {ws.name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {row?.initiatives ?? 0} initiative{row?.initiatives === 1 ? '' : 's'}
                        </div>
                      </Link>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <WorkstreamFormDialog
                              workstream={ws}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="h-3.5 w-3.5" /> Rename
                                </DropdownMenuItem>
                              }
                              onSaved={refreshAll}
                            />
                            <ConfirmActionDialog
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Archive className="h-3.5 w-3.5" /> Archive
                                </DropdownMenuItem>
                              }
                              title={`Archive ${ws.name}?`}
                              description="It'll be hidden from lists but not deleted — you can restore it later. Refuses if it still has active initiatives."
                              confirmLabel="Archive"
                              destructive
                              successMessage="Workstream archived."
                              onConfirm={() => api.workstreams.archive(ws.id)}
                              onDone={refreshAll}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <StatusMixBar
                        counts={
                          row ?? { not_started: 0, in_progress: 0, completed: 0, delayed_at_risk: 0 }
                        }
                        className="flex-1"
                      />
                      <Link
                        to={`/initiatives?workstream=${ws.id}`}
                        className="text-muted-foreground transition-colors group-hover:text-primary"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </section>

      {showArchived && (
        <section>
          <SectionHeading meta={`${archived.length} archived`}>Archived workstreams</SectionHeading>
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing archived.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archived.map((ws) => (
                <Card key={ws.id} className="opacity-70">
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <div className="min-w-0">
                      <div className="truncate font-display text-base font-semibold text-foreground">
                        {ws.name}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        Archived
                      </Badge>
                    </div>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => api.workstreams.restore(ws.id).then(refreshAll)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
