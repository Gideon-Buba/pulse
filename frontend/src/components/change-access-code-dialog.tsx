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

const MIN_CODE_LENGTH = 8;

export function ChangeAccessCodeDialog({ trigger }: { trigger: ReactNode }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    setCurrentCode('');
    setNewCode('');
    setConfirmCode('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (newCode.length < MIN_CODE_LENGTH) {
      setError(`The new code must be at least ${MIN_CODE_LENGTH} characters.`);
      return;
    }
    if (newCode !== confirmCode) {
      setError('The two new codes do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.users.changeAccessCode(currentCode, newCode);
      toast.success('Users-section access code changed.');
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the access code.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Users-section access code</DialogTitle>
          <DialogDescription>
            This is the shared code that unlocks account management — not anybody&rsquo;s sign-in
            password. The current code is required, and there is no self-service recovery: if it is
            lost, reset it on the server with{' '}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">npm run users:set-code</code>
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current_code">Current access code</Label>
            <Input
              id="current_code"
              type="password"
              autoComplete="off"
              required
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_code">New access code</Label>
            <Input
              id="new_code"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_CODE_LENGTH}
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              At least {MIN_CODE_LENGTH} characters. Share it only with people who should be able
              to manage accounts.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_code">Confirm new access code</Label>
            <Input
              id="confirm_code"
              type="password"
              autoComplete="new-password"
              required
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Change access code'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
