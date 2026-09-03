import { useState, type FormEvent, type JSX } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { L_GATES, RAG_STATUSES, type Initiative, type LGate, type RagStatus } from '@/types/api';

export function EditInitiativeDialog({
  initiative,
  onSaved,
}: {
  initiative: Initiative;
  onSaved: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initiative.title);
  const [directorateOwner, setDirectorateOwner] = useState(initiative.directorate_owner ?? '');
  const [lGate, setLGate] = useState<LGate | ''>(initiative.l_gate_stage ?? '');
  const [status, setStatus] = useState<RagStatus>(initiative.status);
  const [kpi, setKpi] = useState(initiative.kpi_expected_impact ?? '');
  const [target, setTarget] = useState(initiative.target ?? '');
  const [actual, setActual] = useState(initiative.actual ?? '');
  const [latestUpdate, setLatestUpdate] = useState(initiative.latest_update ?? '');
  const [decisionsNeeded, setDecisionsNeeded] = useState(initiative.decisions_needed ?? '');
  const [updateAsAt, setUpdateAsAt] = useState(initiative.update_as_at ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.initiatives.update(initiative.id, {
        title,
        directorate_owner: directorateOwner || null,
        l_gate_stage: lGate || null,
        status,
        kpi_expected_impact: kpi || null,
        target: target || null,
        actual: actual || null,
        latest_update: latestUpdate || null,
        decisions_needed: decisionsNeeded || null,
        update_as_at: updateAsAt || null,
      });
      toast.success('Initiative updated.');
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit initiative</DialogTitle>
          <DialogDescription>
            Admin/SMO-only direct edit of the current snapshot. Bypasses the normal fortnightly
            update flow — use for corrections, not routine reporting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c_title">Title</Label>
            <Input id="c_title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c_owner">Directorate owner</Label>
              <Input
                id="c_owner"
                value={directorateOwner}
                onChange={(e) => setDirectorateOwner(e.target.value)}
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5">
              <Label>L-Gate</Label>
              <Select value={lGate || undefined} onValueChange={(v) => setLGate(v as LGate)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {L_GATES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RagStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RAG_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c_kpi">KPI / expected impact</Label>
            <Input id="c_kpi" value={kpi} onChange={(e) => setKpi(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c_target">Target</Label>
              <Input id="c_target" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_actual">Actual</Label>
              <Input id="c_actual" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c_latest">Latest update</Label>
            <Textarea id="c_latest" rows={3} value={latestUpdate} onChange={(e) => setLatestUpdate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c_decisions">Decisions needed</Label>
            <Textarea
              id="c_decisions"
              rows={2}
              value={decisionsNeeded}
              onChange={(e) => setDecisionsNeeded(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c_asat">Update as-at</Label>
            <Input
              id="c_asat"
              type="date"
              value={updateAsAt}
              onChange={(e) => setUpdateAsAt(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
