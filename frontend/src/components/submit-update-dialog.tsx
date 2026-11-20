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
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  RAG_STATUSES,
  type Initiative,
  type Milestone,
  type RagStatus,
  type SubmitMilestoneEntryInput,
} from '@/types/api';

interface MilestoneDraft {
  included: boolean;
  status: RagStatus;
  note: string;
  challenges: string;
}

function initialDrafts(milestones: Milestone[]): Record<string, MilestoneDraft> {
  return Object.fromEntries(
    milestones.map((m) => [m.id, { included: false, status: m.status, note: '', challenges: '' }]),
  );
}

/** The first milestone (in deck order) that isn't completed — the best guess at "where we are now". */
function guessCurrentMilestone(milestones: Milestone[]): string | null {
  return milestones.find((m) => m.status !== 'Completed')?.id ?? null;
}

function StatusSelect({ value, onChange }: { value: RagStatus; onChange: (s: RagStatus) => void }): JSX.Element {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RagStatus)}>
      <SelectTrigger className="h-8 w-[160px] text-xs">
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
  );
}

export function SubmitUpdateDialog({
  initiative,
  milestones,
  onSubmitted,
}: {
  initiative: Initiative;
  milestones: Milestone[];
  onSubmitted: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [currentMilestoneId, setCurrentMilestoneId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, MilestoneDraft>>({});
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<RagStatus>(initiative.status);
  const [target, setTarget] = useState(initiative.target ?? '');
  const [actual, setActual] = useState(initiative.actual ?? '');
  const [latestUpdate, setLatestUpdate] = useState('');
  const [decisionsNeeded, setDecisionsNeeded] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean): void {
    if (next) {
      // Re-seed from the latest milestone snapshot each time the dialog opens.
      const current = guessCurrentMilestone(milestones);
      const seeded = initialDrafts(milestones);
      if (current) seeded[current] = { ...seeded[current], included: true };
      setDrafts(seeded);
      setCurrentMilestoneId(current);
      setStatus(initiative.status);
      setError(null);
    }
    setOpen(next);
  }

  function patchDraft(id: string, patch: Partial<MilestoneDraft>): void {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function selectCurrent(id: string): void {
    setCurrentMilestoneId(id);
    patchDraft(id, { included: true });
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const entries: SubmitMilestoneEntryInput[] = milestones
      .filter((m) => drafts[m.id]?.included)
      .map((m) => {
        const d = drafts[m.id];
        return {
          milestone_id: m.id,
          is_current: m.id === currentMilestoneId,
          status: d.status,
          note: d.note.trim() || undefined,
          challenges: d.challenges.trim() || undefined,
        };
      })
      // Current milestone first, so history reads in the order the lead presents it.
      .sort((a, b) => Number(b.is_current) - Number(a.is_current));

    setSubmitting(true);
    try {
      await api.updates.submit(initiative.id, {
        meeting_date: meetingDate,
        status,
        target: target || undefined,
        actual: actual || undefined,
        latest_update: latestUpdate,
        decisions_needed: decisionsNeeded || undefined,
        milestones: entries,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Submit update</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
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

          {milestones.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Milestones</legend>
              <p className="text-xs text-muted-foreground">
                Mark the milestone the initiative is on now, and tick any others you&rsquo;re reporting
                on. Each ticked milestone&rsquo;s status updates with this submission.
              </p>
              <ul className="space-y-2">
                {milestones.map((m) => {
                  const d = drafts[m.id];
                  if (!d) return null;
                  const isCurrent = currentMilestoneId === m.id;
                  return (
                    <li
                      key={m.id}
                      className={cn(
                        'rounded-md border border-border p-3',
                        isCurrent && 'border-primary/40 bg-primary/5',
                        !d.included && 'bg-gray-50',
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-primary"
                          checked={d.included}
                          disabled={isCurrent}
                          onChange={(e) => patchDraft(m.id, { included: e.target.checked })}
                          aria-label={`Report on ${m.title}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {m.sequence}. {m.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Now: {m.status} · target ~{formatDate(m.target_date)}
                          </div>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input
                            type="radio"
                            name="current_milestone"
                            className="accent-primary"
                            checked={isCurrent}
                            onChange={() => selectCurrent(m.id)}
                          />
                          Current
                        </label>
                      </div>
                      {d.included && (
                        <div className="mt-3 space-y-2 pl-7">
                          <StatusSelect value={d.status} onChange={(s) => patchDraft(m.id, { status: s })} />
                          <Textarea
                            rows={2}
                            placeholder="Progress on this milestone since the last TWG…"
                            value={d.note}
                            onChange={(e) => patchDraft(m.id, { note: e.target.value })}
                          />
                          <Input
                            placeholder={m.challenges ? `Challenges (currently: ${m.challenges})` : 'Challenges (optional)'}
                            value={d.challenges}
                            onChange={(e) => patchDraft(m.id, { challenges: e.target.value })}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

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
