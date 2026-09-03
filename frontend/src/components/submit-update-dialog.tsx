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
import { RAG_STATUSES, type Initiative, type RagStatus } from '@/types/api';

export function SubmitUpdateDialog({
  initiative,
  onSubmitted,
}: {
  initiative: Initiative;
  onSubmitted: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<RagStatus>(initiative.status);
  const [target, setTarget] = useState(initiative.target ?? '');
  const [actual, setActual] = useState(initiative.actual ?? '');
  const [latestUpdate, setLatestUpdate] = useState('');
  const [decisionsNeeded, setDecisionsNeeded] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.updates.submit(initiative.id, {
        meeting_date: meetingDate,
        status,
        target: target || undefined,
        actual: actual || undefined,
        latest_update: latestUpdate,
        decisions_needed: decisionsNeeded || undefined,
      });
      toast.success('Update submitted.');
      setOpen(false);
      setLatestUpdate('');
      setDecisionsNeeded('');
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit update.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Submit update</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit fortnightly update</DialogTitle>
          <DialogDescription>
            Appends a new row to the update history for &ldquo;{initiative.title}&rdquo;. The current
            snapshot updates automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="meeting_date">Meeting date</Label>
              <Input
                id="meeting_date"
                type="date"
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="target">Target (optional)</Label>
              <Input id="target" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="actual">Actual (optional)</Label>
              <Input id="actual" value={actual} onChange={(e) => setActual(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="latest_update">Latest update</Label>
            <Textarea
              id="latest_update"
              required
              rows={4}
              value={latestUpdate}
              onChange={(e) => setLatestUpdate(e.target.value)}
              placeholder="Progress since the last TWG…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="decisions_needed">Decisions needed (optional)</Label>
            <Textarea
              id="decisions_needed"
              rows={2}
              value={decisionsNeeded}
              onChange={(e) => setDecisionsNeeded(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
