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
import type { Workstream } from '@/types/api';

interface WorkstreamFormDialogProps {
  trigger: ReactNode;
  workstream?: Workstream;
  onSaved: () => void;
}

export function WorkstreamFormDialog({ trigger, workstream, onSaved }: WorkstreamFormDialogProps): JSX.Element {
  const isEdit = Boolean(workstream);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(workstream?.name ?? '');
  const [sortOrder, setSortOrder] = useState(workstream?.sort_order?.toString() ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next) {
      setName(workstream?.name ?? '');
      setSortOrder(workstream?.sort_order?.toString() ?? '');
      setError(null);
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const parsedSortOrder = sortOrder.trim() ? Number(sortOrder) : undefined;
      if (isEdit && workstream) {
        await api.workstreams.update(workstream.id, { name, sort_order: parsedSortOrder });
        toast.success('Workstream updated.');
      } else {
        await api.workstreams.create({ name, sort_order: parsedSortOrder });
        toast.success('Workstream created.');
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save workstream.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Rename workstream' : 'New workstream'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Admin/SMO-only. Changes this workstream's label and/or its display order in TWG materials."
              : 'Admin/SMO-only. Adds a new organizational grouping the TWG can track initiatives under.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws_name">Name</Label>
            <Input id="ws_name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws_sort">Display order</Label>
            <Input
              id="ws_sort"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder={isEdit ? undefined : 'Defaults to last'}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create workstream'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
