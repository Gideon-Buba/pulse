import { useState, type JSX } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { MobileNav } from './mobile-nav';

function getTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/impact')) return 'Impact View';
  if (pathname.startsWith('/workstreams')) return 'Workstreams';
  if (pathname.startsWith('/initiatives')) return 'Initiatives';
  if (pathname.startsWith('/exports')) return 'Exports';
  if (pathname.startsWith('/users')) return 'Users';
  return 'Pulse';
}

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={getTitle(pathname)} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
