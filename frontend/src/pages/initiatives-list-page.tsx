import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, MoreVertical, Plus, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { useAuth } from '@/context/auth-context';
import { RagBadge } from '@/components/rag-badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionHeading } from '@/components/section-heading';
import { CreateInitiativeDialog } from '@/components/create-initiative-dialog';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import { RAG_STATUSES, type RagStatus } from '@/types/api';

const ALL = '__all__';

export default function InitiativesListPage(): JSX.Element {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'smo';
  const [showArchived, setShowArchived] = useState(false);

  const workstreamFilter = params.get('workstream') ?? ALL;
  const statusFilter = (params.get('status') as RagStatus | null) ?? ALL;

  const { data: workstreams } = useApiQuery(() => api.workstreams.list(), []);
  const {
    data: initiatives,
    loading,
    error,
    refetch,
  } = useApiQuery(
    () =>
      api.initiatives.list({
        workstreamId: workstreamFilter !== ALL ? workstreamFilter : undefined,
        status: statusFilter !== ALL ? statusFilter : undefined,
        includeArchived: showArchived,
      }),
    [workstreamFilter, statusFilter, showArchived],
  );

  const workstreamNameById = useMemo(() => {
    const map = new Map<string, string>();
    workstreams?.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [workstreams]);

  function updateParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (value === ALL) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${initiatives?.length ?? 0} initiative${initiatives?.length === 1 ? '' : 's'}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Select value={workstreamFilter} onValueChange={(v) => updateParam('workstream', v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Workstream" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All workstreams</SelectItem>
              {workstreams?.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => updateParam('status', v)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {RAG_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
          {canManage && (
            <CreateInitiativeDialog
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  New initiative
                </Button>
              }
              workstreams={workstreams ?? []}
              defaultWorkstreamId={workstreamFilter !== ALL ? workstreamFilter : undefined}
              onCreated={refetch}
            />
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <section>
        <SectionHeading>Initiatives</SectionHeading>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Workstream</TableHead>
                <TableHead>L-Gate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>As at</TableHead>
                {canManage && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={canManage ? 6 : 5}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && initiatives?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} className="py-8 text-center text-sm text-muted-foreground">
                    No initiatives match these filters.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                initiatives?.map((init) => (
                  <TableRow
                    key={init.id}
                    className={init.archived_at ? 'opacity-60' : 'cursor-pointer'}
                    onClick={() => !init.archived_at && navigate(`/initiatives/${init.id}`)}
                  >
                    <TableCell className="max-w-md font-medium text-foreground">
                      {init.title}
                      {init.archived_at && (
                        <Badge variant="secondary" className="ml-2 align-middle">
                          Archived
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {workstreamNameById.get(init.workstream_id) ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{init.l_gate_stage ?? '—'}</TableCell>
                    <TableCell>
                      <RagBadge status={init.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{init.update_as_at ?? '—'}</TableCell>
                    {canManage && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {init.archived_at ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => api.initiatives.restore(init.id).then(refetch)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <ConfirmActionDialog
                                trigger={
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Archive className="h-3.5 w-3.5" /> Archive
                                  </DropdownMenuItem>
                                }
                                title={`Archive "${init.title}"?`}
                                description="It'll be hidden from lists but not deleted — milestones and update history are kept, and you can restore it later."
                                confirmLabel="Archive"
                                destructive
                                successMessage="Initiative archived."
                                onConfirm={() => api.initiatives.archive(init.id)}
                                onDone={refetch}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
