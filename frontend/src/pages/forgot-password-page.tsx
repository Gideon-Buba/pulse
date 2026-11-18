import { useState, type FormEvent, type JSX } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, UserPlus } from 'lucide-react';
import { ApiError } from '@/lib/api-client';
import { api } from '@/lib/api';
import { AuthError, AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NRS_EMAIL_DOMAIN } from '@/types/api';

export default function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSuchAccount, setNoSuchAccount] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setNoSuchAccount(false);
    setSubmitting(true);

    const normalisedEmail = email.trim().toLowerCase();

    try {
      await api.auth.forgotPassword(normalisedEmail);
      setSentTo(normalisedEmail);
    } catch (err) {
      if (err instanceof ApiError) {
        // A 404 means there is no Pulse account for this address at all.
        // Surfaced as its own state with a route out (sign up) rather than
        // a bare error, since a reset can never work for a non-account.
        if (err.status === 404) setNoSuchAccount(true);
        setError(err.message);
      } else {
        setError('Could not start a password reset. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle={
          <>
            A reset link is on its way to{' '}
            <span className="font-medium text-foreground">{sentTo}</span>.
          </>
        }
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="mt-8 space-y-4">
          <div className="flex gap-3 rounded-md border border-border bg-secondary/60 px-4 py-3">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Open the link from that email to set a new password. The link expires, so request a
              fresh one if it has been sitting a while.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Nothing arrived? Ask the Pulse admin to issue you a reset link directly from the Users
            section — automated email delivery may not be switched on for this deployment yet.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Return to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the NRS email on your Pulse account and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">NRS email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`john.lewis@${NRS_EMAIL_DOMAIN}`}
          />
        </div>

        {error && <AuthError message={error} />}

        {noSuchAccount && (
          <div className="flex gap-3 rounded-md border border-border px-4 py-3">
            <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                A password can only be reset for an account that already exists.
              </p>
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Request access instead
              </Link>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthLayout>
  );
}
