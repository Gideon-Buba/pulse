import { useState, type FormEvent, type JSX, type ReactNode } from 'react';
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
import { L_GATES, type LGate, type Workstream } from '@/types/api';

export function CreateInitiativeDialog({
  trigger,
  workstreams,
  defaultWorkstreamId,
  onCreated,
}: {
  trigger: ReactNode;
  workstreams: Workstream[];
  defaultWorkstreamId?: string;
  onCreated: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [workstreamId, setWorkstreamId] = useState(defaultWorkstreamId ?? '');
  const [title, setTitle] = useState('');
  const [directorateOwner, setDirectorateOwner] = useState('');
  const [lGate, setLGate] = useState<LGate | ''>('');
  const [kpi, setKpi] = useState('');
  const [target, setTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setWorkstreamId(defaultWorkstreamId ?? '');
    setTitle('');
    setDirectorateOwner('');
    setLGate('');
    setKpi('');
    setTarget('');
    setError(null);
  }

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next) reset();
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.initiatives.create({
        workstream_id: workstreamId,
        title,
        directorate_owner: directorateOwner || null,
        l_gate_stage: lGate || null,
        kpi_expected_impact: kpi || null,
        target: target || null,
      });
      toast.success('Initiative created.');
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create initiative.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New initiative</DialogTitle>
          <DialogDescription>
            Admin/SMO-only. Registers a new initiative — status starts at &ldquo;Not started&rdquo;;
            the owning workstream lead submits progress fortnightly from here on.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Workstream</Label>
            <Select value={workstreamId || undefined} onValueChange={setWorkstreamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a workstream" />
              </SelectTrigger>
              <SelectContent>
                {workstreams.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ni_title">Title</Label>
            <Input id="ni_title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ni_owner">Directorate owner</Label>
              <Input
                id="ni_owner"
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ni_kpi">KPI / expected impact</Label>
            <Textarea id="ni_kpi" rows={2} value={kpi} onChange={(e) => setKpi(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ni_target">Target</Label>
            <Input id="ni_target" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !workstreamId || !title.trim()}>
              {submitting ? 'Creating…' : 'Create initiative'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
