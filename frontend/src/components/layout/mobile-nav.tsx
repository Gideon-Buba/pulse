import type { JSX } from 'react';
import { X } from 'lucide-react';
import { NavLinks, PulseMark, Wordmark } from './sidebar';
import { UserMenu } from './user-menu';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between gap-2.5 border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <PulseMark />
            <Wordmark />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks onNavigate={onClose} />
        <div className="border-t border-border p-3">
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
