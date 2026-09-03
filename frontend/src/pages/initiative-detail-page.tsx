import type { JSX } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiQuery } from '@/hooks/use-api-query';
import { useAuth } from '@/context/auth-context';
import { RagBadge } from '@/components/rag-badge';
import { SubmitUpdateDialog } from '@/components/submit-update-dialog';
import { EditInitiativeDialog } from '@/components/edit-initiative-dialog';
import { MilestoneFormDialog } from '@/components/milestone-form-dialog';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatDateTime } from '@/lib/format';

function Field({ label, value }: { label: string; value: string | null }): JSX.Element {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">
        {value ?? <span className="text-muted-foreground">Not recorded</span>}
      </div>
    </div>
  );
}

export default function InitiativeDetailPage(): JSX.Element {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ?? '';
  const { user } = useAuth();

  const {
    data: initiative,
    loading: loadingInitiative,
    error: initiativeError,
    refetch: refetchInitiative,
  } = useApiQuery(() => api.initiatives.get(id), [id]);

  const { data: workstream } = useApiQuery(
    () => (initiative ? api.workstreams.get(initiative.workstream_id) : Promise.resolve(null)),
    [initiative?.workstream_id],
  );

  const {
    data: milestones,
    loading: loadingMilestones,
    refetch: refetchMilestones,
  } = useApiQuery(() => api.milestones.listForInitiative(id), [id]);

  const {
    data: updates,
    loading: loadingUpdates,
    refetch: refetchUpdates,
  } = useApiQuery(() => api.updates.listForInitiative(id), [id]);

  if (!rawId) {
    return <Navigate to="/initiatives" replace />;
  }

  if (loadingInitiative) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (initiativeError || !initiative) {
    return (
      <div className="space-y-4">
        <Link to="/initiatives" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to initiatives
        </Link>
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {initiativeError ?? 'Initiative not found.'}
        </div>
      </div>
    );
  }

  const canManage = user?.role === 'admin' || user?.role === 'smo';
  const canSubmitUpdate = canManage || (user?.role === 'workstream_lead' && user.workstreamId === initiative.workstream_id);

  function handleChanged(): void {
    refetchInitiative();
    refetchUpdates();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/initiatives" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to initiatives
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <RagBadge status={initiative.status} />
            {initiative.l_gate_stage && <Badge variant="outline">{initiative.l_gate_stage}</Badge>}
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{initiative.title}</h2>
          {workstream && (
            <Link to={`/initiatives?workstream=${workstream.id}`} className="text-sm text-primary hover:underline">
              {workstream.name}
            </Link>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {canManage && <EditInitiativeDialog initiative={initiative} onSaved={handleChanged} />}
          {canSubmitUpdate && <SubmitUpdateDialog initiative={initiative} onSubmitted={handleChanged} />}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones?.length ?? '…'})</TabsTrigger>
          <TabsTrigger value="history">Update history ({updates?.length ?? '…'})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 rounded-lg border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Directorate owner" value={initiative.directorate_owner} />
            <Field label="Snapshot as at" value={formatDate(initiative.update_as_at)} />
          </div>
          <Field label="KPI / expected impact" value={initiative.kpi_expected_impact} />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Target" value={initiative.target} />
            <Field label="Actual" value={initiative.actual} />
          </div>
          <Field label="Latest update" value={initiative.latest_update} />
          <Field label="Decisions needed" value={initiative.decisions_needed} />
        </TabsContent>

        <TabsContent value="milestones" className="rounded-lg border border-border bg-card">
          {canManage && (
            <div className="flex justify-end border-b border-border px-4 py-3">
              <MilestoneFormDialog
                initiativeId={id}
                trigger={
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                    Add milestone
                  </Button>
                }
                onSaved={refetchMilestones}
              />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Target date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Challenges</TableHead>
                <TableHead>Upcoming</TableHead>
                {canManage && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingMilestones &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={canManage ? 7 : 6}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!loadingMilestones && milestones?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="py-8 text-center text-sm text-muted-foreground">
                    No milestones recorded for this initiative.
                  </TableCell>
                </TableRow>
              )}
              {!loadingMilestones &&
                milestones?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-muted-foreground">{m.sequence}</TableCell>
                    <TableCell className="font-medium text-foreground">{m.title}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(m.target_date)}
                    </TableCell>
                    <TableCell>
                      <RagBadge status={m.status} />
                    </TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">{m.challenges ?? '—'}</TableCell>
                    <TableCell className="max-w-xs text-muted-foreground">{m.upcoming_milestone ?? '—'}</TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <MilestoneFormDialog
                              initiativeId={id}
                              milestone={m}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </DropdownMenuItem>
                              }
                              onSaved={refetchMilestones}
                            />
                            <ConfirmActionDialog
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              }
                              title={`Delete "${m.title}"?`}
                              description="This permanently removes the milestone. This can't be undone."
                              confirmLabel="Delete"
                              destructive
                              successMessage="Milestone deleted."
                              onConfirm={() => api.milestones.remove(id, m.id)}
                              onDone={refetchMilestones}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {milestones && milestones.length > 0 && (
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Target dates are approximate — parsed from month-level TWG deck labels except where an
              exact day was given.
            </p>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {loadingUpdates &&
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

          {!loadingUpdates && updates?.length === 0 && (
            <div className="rounded-lg border border-border bg-card py-8 text-center text-sm text-muted-foreground">
              No updates submitted yet.
            </div>
          )}

          {!loadingUpdates &&
            updates?.map((u) => (
              <div key={u.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      TWG meeting {formatDate(u.meeting_date)}
                    </span>
                    <RagBadge status={u.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">Submitted {formatDateTime(u.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{u.latest_update}</p>
                {(u.target || u.actual) && (
                  <div className="mt-2 flex gap-6 text-xs text-muted-foreground">
                    {u.target && <span>Target: {u.target}</span>}
                    {u.actual && <span>Actual: {u.actual}</span>}
                  </div>
                )}
                {u.decisions_needed && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Decisions needed:</span> {u.decisions_needed}
                  </p>
                )}
              </div>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
