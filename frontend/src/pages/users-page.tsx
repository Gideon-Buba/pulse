import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Check,
  Copy,
  KeyRound,
  Link2,
  Lock,
  MoreVertical,
  Pencil,
  Trash2,
  UserX,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiError, getUsersAccessTicket, setUsersAccessTicket } from '@/lib/api-client';
import { useApiQuery } from '@/hooks/use-api-query';
import { useAuth } from '@/context/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChangeAccessCodeDialog } from '@/components/change-access-code-dialog';
import { ConfirmActionDialog } from '@/components/confirm-action-dialog';
import { SectionHeading } from '@/components/section-heading';
import { UserFormDialog } from '@/components/user-form-dialog';
import { UsersAccessGate } from '@/components/users-access-gate';
import { formatDate, roleLabel } from '@/lib/format';
import type { AccountStatus, UserAccount } from '@/types/api';

function StatusBadge({ status }: { status: AccountStatus }): JSX.Element {
  if (status === 'approved') {
    return (
      <Badge variant="outline" className="border-rag-completed/40 text-rag-completed">
        Approved
      </Badge>
    );
  }
  if (status === 'pending') {
    return <Badge className="bg-rag-in-progress text-white">Pending</Badge>;
  }
  return <Badge variant="destructive">Rejected</Badge>;
}

export default function UsersPage(): JSX.Element {
  const { user } = useAuth();
  // Belt and braces: the nav item is already admin-only, and all three
  // API-side guards run regardless. This just avoids showing an admin-only
  // page to someone who typed /users into the address bar.
  const isAdmin = user?.role === 'admin';

  const [unlocked, setUnlocked] = useState(() => getUsersAccessTicket() !== null);

  if (!isAdmin) return <Navigate to="/" replace />;
  if (!unlocked) return <UsersAccessGate onUnlocked={() => setUnlocked(true)} />;

  return <UsersPageContent onLock={() => setUnlocked(false)} />;
}

function UsersPageContent({ onLock }: { onLock: () => void }): JSX.Element {
  const { user } = useAuth();
  const { data: users, loading, error, refetch } = useApiQuery(() => api.users.list(), []);
  const { data: workstreams } = useApiQuery(() => api.workstreams.list({ includeArchived: true }), []);
  const [resetLink, setResetLink] = useState<{ email: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /** The ticket expired or was never valid — send the admin back to the gate. */
  const relock = useCallback(() => {
    setUsersAccessTicket(null);
    onLock();
  }, [onLock]);

  const pending = useMemo(() => users?.filter((u) => u.status === 'pending') ?? [], [users]);
  const others = useMemo(() => users?.filter((u) => u.status !== 'pending') ?? [], [users]);

  // A "not unlocked" error after we thought we were unlocked means the
  // 30-minute ticket ran out mid-session — drop it and show the gate again.
  useEffect(() => {
    if (error && /unlock/i.test(error)) relock();
  }, [error, relock]);

  async function handleResetLink(account: UserAccount): Promise<void> {
    try {
      const result = await api.users.resetLink(account.id);
      setResetLink({ email: result.email, link: result.resetLink });
      setCopied(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not generate a reset link.');
    }
  }

  async function copyResetLink(): Promise<void> {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink.link);
      setCopied(true);
      toast.success('Reset link copied.');
    } catch {
      toast.error('Could not copy — select the link and copy it manually.');
    }
  }

  function renderRowActions(account: UserAccount): JSX.Element {
    const isSelf = account.id === user?.id;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {account.status === 'pending' && (
            <UserFormDialog
              user={account}
              workstreams={workstreams ?? []}
              mode="approve"
              onSaved={refetch}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Check className="h-3.5 w-3.5" /> Approve…
                </DropdownMenuItem>
              }
            />
          )}

          <UserFormDialog
            user={account}
            workstreams={workstreams ?? []}
            mode="edit"
            onSaved={refetch}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="h-3.5 w-3.5" /> Edit role &amp; workstream
              </DropdownMenuItem>
            }
          />

          {account.status === 'approved' && (
            <DropdownMenuItem onSelect={() => void handleResetLink(account)}>
              <Link2 className="h-3.5 w-3.5" /> Issue reset link
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {account.status !== 'rejected' && !isSelf && (
            <ConfirmActionDialog
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <UserX className="h-3.5 w-3.5" />
                  {account.status === 'pending' ? 'Decline request' : 'Revoke access'}
                </DropdownMenuItem>
              }
              title={
                account.status === 'pending'
                  ? `Decline ${account.fullName}'s request?`
                  : `Revoke access for ${account.fullName}?`
              }
              description="They will not be able to sign in, and any session they currently hold stops working on its next request. The account stays in this list and can be approved later."
              confirmLabel={account.status === 'pending' ? 'Decline' : 'Revoke'}
              destructive
              successMessage="Account access revoked."
              onConfirm={() => api.users.reject(account.id)}
              onDone={refetch}
            />
          )}

          {!isSelf && (
            <ConfirmActionDialog
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete account
                </DropdownMenuItem>
              }
              title={`Delete ${account.fullName}?`}
              description="This permanently removes the account and cannot be undone. TWG updates they submitted are kept — the append-only history stays intact and simply loses the link to this author."
              confirmLabel="Delete"
              destructive
              successMessage="Account deleted."
              onConfirm={() => api.users.remove(account.id)}
              onDone={refetch}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function renderTable(rows: UserAccount[], emptyMessage: string): JSX.Element {
    if (rows.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Workstream</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-foreground">
                    {account.fullName}
                    {account.id === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{account.email}</TableCell>
                  <TableCell>{roleLabel(account.role)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.workstreamName ?? '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={account.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(account.createdAt)}
                  </TableCell>
                  <TableCell>{renderRowActions(account)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Who can sign in to Pulse, and what they can see. Every new sign-up waits here until you
          approve it.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <ChangeAccessCodeDialog
            trigger={
              <Button variant="outline" size="sm">
                <KeyRound className="h-4 w-4" />
                Access code
              </Button>
            }
          />
          <Button variant="outline" size="sm" onClick={relock}>
            <Lock className="h-4 w-4" />
            Lock
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {resetLink && (
        <Card className="border-l-[3px] border-l-primary">
          <CardContent className="space-y-3 p-5">
            <div>
              <div className="font-display text-sm font-semibold text-foreground">
                One-time reset link for {resetLink.email}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Hand this to them directly — it was generated, not emailed. It can be used once,
                and it expires. Don&rsquo;t post it anywhere shared.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-secondary px-3 py-2 text-xs">
                {resetLink.link}
              </code>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void copyResetLink()}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setResetLink(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <SectionHeading meta={`${pending.length} waiting`}>Pending approval</SectionHeading>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          renderTable(pending, 'No account requests are waiting. New sign-ups will appear here.')
        )}
      </section>

      <section>
        <SectionHeading meta={`${others.length} total`}>All accounts</SectionHeading>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          renderTable(others, 'No accounts yet.')
        )}
      </section>
    </div>
  );
}
