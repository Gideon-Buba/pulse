import { useEffect, useState, type FormEvent, type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { api } from '@/lib/api';
import { AuthError, AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Supabase recovery links land here with the token in the URL *fragment*
 * (`#access_token=…&type=recovery`), which never reaches the server. Some
 * configurations use a `?token=`/`?access_token=` query instead, so read
 * both. The fragment is cleared from the address bar immediately after —
 * a recovery token is a credential and has no business sitting in history
 * or in a copy-pasted URL.
 */
function readRecoveryToken(): string | null {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  return (
    fragment.get('access_token') ??
    fragment.get('token') ??
    query.get('access_token') ??
    query.get('token')
  );
}

export default function ResetPasswordPage(): JSX.Element {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const found = readRecoveryToken();
    setToken(found);
    setTokenChecked(true);
    if (found) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not set your new password. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!tokenChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!token) {
    return (
      <AuthLayout
        title="This link isn’t valid"
        subtitle="The reset link is missing its token, or has already been used."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            Request a new reset link, or ask the Pulse admin to issue you one directly.
          </p>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        subtitle="You can now sign in with your new password."
      >
        <div className="mt-8 space-y-4">
          <div className="flex gap-3 rounded-md border border-border bg-secondary/60 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rag-completed" />
            <p className="text-sm text-muted-foreground">
              Your password has been changed. Any other devices still signed in with the old
              password will need it again.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Go to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a password you haven't used here before.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <AuthError message={error} />}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set new password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
