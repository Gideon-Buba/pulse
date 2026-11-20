import type { JSX } from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { NotificationsMenu } from '@/components/notifications-menu';

/** Page title bar. The signed-in user block lives at the bottom of the sidebar. */
export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }): JSX.Element {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      </div>

      {/* Admins are the only ones who receive notifications today (account
          requests), so the bell would always be empty for anyone else. */}
      {user?.role === 'admin' && (
        <div className="ml-auto flex items-center">
          <NotificationsMenu />
        </div>
      )}
    </header>
  );
}
