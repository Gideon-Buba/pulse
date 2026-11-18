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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roleLabel } from '@/lib/format';
import type { UserAccount, UserRole, Workstream } from '@/types/api';

const ASSIGNABLE_ROLES: UserRole[] = ['workstream_lead', 'smo', 'admin'];

interface UserFormDialogProps {
  trigger: ReactNode;
  user: UserAccount;
  workstreams: Workstream[];
  /** 'approve' turns a pending request into a live account; 'edit' changes an existing one. */
  mode: 'approve' | 'edit';
  onSaved: () => void;
}

/**
 * Role and workstream are decided here, by the admin — never by the person
 * signing up. A lead must be scoped to exactly one workstream; admin and
 * SMO see everything, so the workstream picker disappears for them (the API
 * enforces the same pairing).
 */
export function UserFormDialog({
  trigger,
  user,
  workstreams,
  mode,
  onSaved,
}: UserFormDialogProps): JSX.Element {
  const isApprove = mode === 'approve';
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [role, setRole] = useState<UserRole>(user.role);
  const [workstreamId, setWorkstreamId] = useState<string>(user.workstreamId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeWorkstreams = workstreams.filter((w) => !w.archived_at);
  const needsWorkstream = role === 'workstream_lead';

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next) {
      setFullName(user.fullName);
      setRole(user.role);
      setWorkstreamId(user.workstreamId ?? '');
      setError(null);
    }
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (needsWorkstream && !workstreamId) {
      setError('Pick the workstream this lead is responsible for.');
      return;
    }

    setSubmitting(true);
    try {
      if (isApprove) {
        await api.users.approve(user.id, {
          role,
          workstreamId: needsWorkstream ? workstreamId : null,
        });
        toast.success(`${user.fullName} approved — they can sign in now.`);
      } else {
        await api.users.update(user.id, {
          fullName: fullName.trim(),
          role,
          workstreamId: needsWorkstream ? workstreamId : null,
        });
        toast.success('Account updated.');
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isApprove ? 'Approve account' : 'Edit account'}</DialogTitle>
          <DialogDescription>
            {isApprove
              ? `Set the access ${user.fullName} should have. They can sign in as soon as you approve.`
              : `Change what ${user.fullName} can see and do in Pulse.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md bg-secondary/60 px-3 py-2 text-sm">
            <div className="font-medium text-foreground">{user.fullName}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>

          {!isApprove && (
            <div className="space-y-1.5">
              <Label htmlFor="user_name">Full name</Label>
              <Input
                id="user_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="user_role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="user_role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'workstream_lead' &&
                'Submits fortnightly updates for their own workstream only.'}
              {role === 'smo' && 'Reads and edits everything. Cannot manage user accounts.'}
              {role === 'admin' && 'Reads and edits everything, and can manage user accounts.'}
            </p>
          </div>

          {needsWorkstream && (
            <div className="space-y-1.5">
              <Label htmlFor="user_workstream">Workstream</Label>
              <Select value={workstreamId} onValueChange={setWorkstreamId}>
                <SelectTrigger id="user_workstream">
                  <SelectValue placeholder="Select a workstream" />
                </SelectTrigger>
                <SelectContent>
                  {activeWorkstreams.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isApprove ? 'Approve account' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
