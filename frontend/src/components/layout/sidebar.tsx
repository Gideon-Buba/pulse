import { useState, type JSX } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarClock,
  Download,
  LayoutDashboard,
  Layers,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/api';
import { UserMenu } from './user-menu';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  /** When set, only these roles see the item. Omitted = everyone signed in. */
  roles?: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/impact', label: 'Impact View', icon: Presentation, end: false },
    ],
  },
  {
    label: 'Portfolio',
    items: [
      { to: '/workstreams', label: 'Workstreams', icon: Layers, end: false },
      { to: '/initiatives', label: 'Initiatives', icon: ListChecks, end: false },
    ],
  },
  {
    label: 'TWG cycle',
    items: [
      { to: '/meetings', label: 'TWG Meetings', icon: CalendarClock, end: false },
      { to: '/exports', label: 'Exports', icon: Download, end: false },
    ],
  },
  {
    label: 'Admin',
    items: [
      // Admin-only, and additionally locked behind the Users-section access
      // code once opened — see `UsersAccessGate`. Hidden rather than disabled
      // for everyone else: there is nothing for them to do there.
      { to: '/users', label: 'Users', icon: Users, end: false, roles: ['admin'] },
    ],
  },
];

const COLLAPSED_STORAGE_KEY = 'pulse_sidebar_collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    // Storage unavailable (private mode etc.) — collapse just won't persist.
  }
}

export function PulseMark(): JSX.Element {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
      <svg viewBox="0 0 32 32" className="h-5 w-5">
        <path
          d="M4 17h5l2.5-7 4 14 3-11 2 4h7.5"
          fill="none"
          stroke="white"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Wordmark(): JSX.Element {
  return (
    <div className="min-w-0">
      <div className="font-display text-[15px] font-bold leading-tight tracking-tight text-foreground">Pulse</div>
      <div className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        NRS Transformation
      </div>
    </div>
  );
}

export function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}): JSX.Element {
  const { user } = useAuth();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (user !== null && item.roles.includes(user.role))),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-2.5' : 'px-3')}>
      {groups.map((group, groupIndex) => (
        <div key={group.label} className={cn(groupIndex > 0 && 'mt-5')}>
          {collapsed ? (
            groupIndex > 0 && <div className="mx-2 mb-3 border-t border-border" aria-hidden="true" />
          ) : (
            <div className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    collapsed ? 'h-10 justify-center' : 'px-3 py-2',
                    isActive
                      ? 'bg-primary/[0.07] text-primary'
                      : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground',
                      )}
                      strokeWidth={isActive ? 2.2 : 1.9}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar(): JSX.Element {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggle(): void {
    setCollapsed((prev) => {
      writeCollapsed(!prev);
      return !prev;
    });
  }

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 ease-out md:flex',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            className="group relative rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <span className="group-hover:invisible">
              <PulseMark />
            </span>
            <span className="invisible absolute inset-0 flex items-center justify-center rounded-md bg-gray-100 text-muted-foreground group-hover:visible">
              <ToggleIcon className="h-[18px] w-[18px]" />
            </span>
          </button>
        ) : (
          <>
            <PulseMark />
            <div className="flex-1">
              <Wordmark />
            </div>
            <button
              type="button"
              onClick={toggle}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ToggleIcon className="h-[18px] w-[18px]" />
            </button>
          </>
        )}
      </div>

      <NavLinks collapsed={collapsed} />

      <div className={cn('border-t border-border', collapsed ? 'p-2.5' : 'p-3')}>
        <UserMenu collapsed={collapsed} />
      </div>
    </aside>
  );
}
