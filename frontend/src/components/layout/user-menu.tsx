import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LogOut, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useApiQuery } from '@/hooks/use-api-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials, roleLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Signed-in user block for the bottom of the sidebar. Icon-only when the rail is collapsed. */
export function UserMenu({ collapsed = false }: { collapsed?: boolean }): JSX.Element | null {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Leads are scoped to one workstream — show which, so it's obvious what they can submit for.
  const workstreamId = user?.workstreamId ?? null;
  const { data: workstreamName } = useApiQuery(
    () => (workstreamId ? api.workstreams.get(workstreamId).then((w) => w.name) : Promise.resolve(null)),
    [workstreamId],
  );

  if (!user) return null;

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/login', { replace: true });
  }

  const subtitle = workstreamName ? `${roleLabel(user.role)} · ${workstreamName}` : roleLabel(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={collapsed ? `${user.fullName} — ${subtitle}` : undefined}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-gray-100',
          collapsed && 'justify-center',
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(user.fullName)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{user.fullName}</div>
              <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? 'right' : 'top'} align={collapsed ? 'end' : 'start'} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium text-foreground">{user.fullName}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
