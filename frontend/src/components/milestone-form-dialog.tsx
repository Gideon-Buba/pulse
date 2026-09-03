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
import { L_GATES, RAG_STATUSES, type LGate, type Milestone, type RagStatus } from '@/types/api';

interface MilestoneFormDialogProps {
  trigger: ReactNode;
  initiativeId: string;
  milestone?: Milestone;
  onSaved: () => void;
}

export function MilestoneFormDialog({ trigger, initiativeId, milestone, onSaved }: MilestoneFormDialogProps): JSX.Element {
  const isEdit = Boolean(milestone);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [lGate, setLGate] = useState<LGate | ''>(milestone?.l_gate_stage ?? '');
  const [targetDate, setTargetDate] = useState(milestone?.target_date ?? '');
  const [status, setStatus] = useState<RagStatus>(milestone?.status ?? 'Not started');
  const [challenges, setChallenges] = useState(milestone?.challenges ?? '');
  const [upcoming, setUpcoming] = useState(milestone?.upcoming_milestone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setTitle(milestone?.title ?? '');
    setLGate(milestone?.l_gate_stage ?? '');
    setTargetDate(milestone?.target_date ?? '');
    setStatus(milestone?.status ?? 'Not started');
    setChallenges(milestone?.challenges ?? '');
    setUpcoming(milestone?.upcoming_milestone ?? '');
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
      const body = {
        title,
        l_gate_stage: lGate || null,
        target_date: targetDate || null,
        status,
        challenges: challenges || null,
        upcoming_milestone: upcoming || null,
      };
      if (isEdit && milestone) {
        await api.milestones.update(initiativeId, milestone.id, body);
        toast.success('Milestone updated.');
      } else {
        await api.milestones.create(initiativeId, body);
        toast.success('Milestone added.');
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save milestone.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit milestone' : 'Add milestone'}</DialogTitle>
          <DialogDescription>Admin/SMO-only.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="m_title">Title</Label>
            <Input id="m_title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="m_date">Target date</Label>
              <Input id="m_date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m_challenges">Challenges</Label>
            <Textarea id="m_challenges" rows={2} value={challenges} onChange={(e) => setChallenges(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m_upcoming">Upcoming milestone</Label>
            <Textarea id="m_upcoming" rows={2} value={upcoming} onChange={(e) => setUpcoming(e.target.value)} />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
