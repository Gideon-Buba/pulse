import { useState, type FormEvent, type JSX } from 'react';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError, setUsersAccessTicket } from '@/lib/api-client';
import { useApiQuery } from '@/hooks/use-api-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The lock in front of the Users section. Being an admin gets you this
 * screen; the access code gets you past it. Separate on purpose — a
 * compromised or shared admin login should not by itself be able to
 * approve accounts or delete users.
 */
export function UsersAccessGate({ onUnlocked }: { onUnlocked: () => void }): JSX.Element {
  const { data: status, loading } = useApiQuery(() => api.users.accessStatus(), []);
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.users.unlock(accessCode);
      setUsersAccessTicket({ ticket: result.ticket, expiresAt: result.expiresAt });
      setAccessCode('');
      onUnlocked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify the access code.');
    } finally {
      setSubmitting(false);
    }
  }

  const notConfigured = status !== null && !status.configured;

  return (
    <div className="mx-auto max-w-md pt-6 sm:pt-12">
      <Card>
        <CardContent className="p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>

          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-foreground">
            Users section locked
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Account management sits behind a separate access code, on top of your admin sign-in.
            Enter it to continue.
          </p>

          {loading && <Skeleton className="mt-6 h-9 w-full" />}

          {notConfigured && (
            <div className="mt-6 flex gap-3 rounded-md bg-destructive/10 px-4 py-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-1 text-sm">
                <div className="font-medium text-destructive">No access code set yet</div>
                <p className="text-muted-foreground">
                  Run{' '}
                  <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                    npm run users:set-code
                  </code>{' '}
                  in <code className="text-xs">backend/</code> to set one. There is no way to set
                  it from the browser — that is deliberate.
                </p>
              </div>
            </div>
          )}

          {!loading && !notConfigured && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="accessCode">Access code</Label>
                <Input
                  id="accessCode"
                  type="password"
                  autoComplete="off"
                  autoFocus
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting || !accessCode}>
                {submitting ? 'Unlocking…' : 'Unlock'}
              </Button>

              <div className="flex gap-2.5 border-t border-border pt-4 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  There is no “forgot access code” link here on purpose — a self-service reset
                  would make this second lock worth as much as the first. If the code is lost, it
                  is reset from the server with{' '}
                  <code className="rounded bg-secondary px-1 py-0.5">npm run users:set-code</code>.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
