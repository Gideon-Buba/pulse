import type { JSX } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Layers, Download, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/impact', label: 'Impact View', icon: Presentation, end: false },
  { to: '/workstreams', label: 'Workstreams', icon: Layers, end: false },
  { to: '/initiatives', label: 'Initiatives', icon: ListChecks, end: false },
  { to: '/exports', label: 'Exports', icon: Download, end: false },
];

export function PulseMark(): JSX.Element {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
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

export function NavLinks({ onNavigate }: { onNavigate?: () => void }): JSX.Element {
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-primary bg-primary/8 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-gray-100 hover:text-foreground',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar(): JSX.Element {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <PulseMark />
        <div>
          <div className="text-sm font-semibold tracking-tight text-foreground">Pulse</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            NRS Transformation
          </div>
        </div>
      </div>

      <NavLinks />

      <div className="border-t border-border px-6 py-4 text-[11px] text-muted-foreground">
        Group Director of Transformation &amp; Strategy
      </div>
    </aside>
  );
}
