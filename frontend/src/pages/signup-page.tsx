import { useState, type FormEvent, type JSX } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Clock, MailCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api-client';
import { api } from '@/lib/api';
import { AuthError, AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NRS_EMAIL_DOMAIN } from '@/types/api';

/**
 * Mirrors the API's own rule (`backend/src/auth/nrs-email.ts`) so a typo is
 * caught before a round trip. The server validates it again regardless —
 * this copy is a convenience, never the enforcement.
 */
const NRS_EMAIL_PATTERN = new RegExp(
  `^[a-z0-9]+(?:[._-][a-z0-9]+)*@${NRS_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`,
);

const MIN_PASSWORD_LENGTH = 8;

export default function SignupPage(): JSX.Element {
  const { user, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedFor, setSubmittedFor] = useState<string | null>(null);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    const normalisedEmail = email.trim().toLowerCase();

    if (!NRS_EMAIL_PATTERN.test(normalisedEmail)) {
      setError(
        `Use your NRS work email — it must end in @${NRS_EMAIL_DOMAIN} (for example john.lewis@${NRS_EMAIL_DOMAIN}).`,
      );
      return;
    }
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
      await api.auth.signup({ fullName: fullName.trim(), email: normalisedEmail, password });
      setSubmittedFor(normalisedEmail);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Success state. Deliberately a full replacement for the form rather than
  // a toast: there is nothing else for the person to do here, and the wait
  // needs explaining.
  if (submittedFor) {
    return (
      <AuthLayout
        title="Admin confirmation pending"
        subtitle={
          <>
            Your request for <span className="font-medium text-foreground">{submittedFor}</span> has
            been sent.
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
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1 text-sm">
              <div className="font-medium text-foreground">Waiting for an admin to approve you</div>
              <p className="text-muted-foreground">
                Your account exists but cannot sign in yet. An admin has been notified and will
                approve it along with the role and workstream you should have.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-md border border-border px-4 py-3">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              If it takes too long, please contact the Pulse admin in the Strategic Management
              Office directly rather than signing up again — a second request for the same email
              will be refused.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Return to sign in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Request access"
      subtitle={`Pulse is internal to the NRS — sign up with your @${NRS_EMAIL_DOMAIN} work email. An admin approves every new account.`}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Lewis"
          />
        </div>
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
          <p className="text-xs text-muted-foreground">
            Only @{NRS_EMAIL_DOMAIN} addresses can be used.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
          {submitting ? 'Sending request…' : 'Request access'}
        </Button>
      </form>
    </AuthLayout>
  );
}
