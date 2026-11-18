import { useCallback, useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/api';

/** How often the bell re-checks. Cheap query, and approvals shouldn't wait. */
const POLL_INTERVAL_MS = 60_000;

/**
 * The admin's notification bell. Today it carries one thing: somebody
 * signed up and is waiting for approval — so a request doesn't sit unseen
 * just because nobody thought to open the Users page.
 */
export function NotificationsMenu(): JSX.Element {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(() => {
    api.notifications
      .list()
      .then(setNotifications)
      // A failing bell must never break the page it sits in.
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const unread = notifications.filter((n) => !n.read_at);

  async function handleClick(notification: Notification): Promise<void> {
    if (!notification.read_at) {
      try {
        await api.notifications.markRead(notification.id);
      } catch {
        // Navigating still helps even if the read flag didn't stick.
      }
    }
    load();
    if (notification.link) navigate(notification.link);
  }

  async function handleMarkAllRead(): Promise<void> {
    try {
      await api.notifications.markAllRead();
    } catch {
      // Same reasoning — best effort.
    }
    load();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground"
        aria-label={unread.length > 0 ? `${unread.length} unread notifications` : 'Notifications'}
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void handleClick(notification)}
                className={cn(
                  'flex w-full gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent',
                  !notification.read_at && 'bg-primary/5',
                )}
              >
                <UserPlus
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    notification.read_at ? 'text-muted-foreground' : 'text-primary',
                  )}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{notification.title}</div>
                  {notification.body && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
                  )}
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatDateTime(notification.created_at)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
