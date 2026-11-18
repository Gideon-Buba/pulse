import type { JSX, ReactNode } from 'react';
import nrsHeadquarters from '@/assets/nrs-headquarters.jpg';

function PulseWordmark({ size }: { size: 'sm' | 'lg' }): JSX.Element {
  const box = size === 'lg' ? 'h-10 w-10 rounded-lg' : 'h-8 w-8 rounded-md';
  const mark = size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const text = size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center bg-primary ${box}`}>
        <svg viewBox="0 0 32 32" className={mark}>
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
      <span className={`font-semibold tracking-tight ${text}`}>Pulse</span>
    </div>
  );
}

/**
 * The split brand/form layout every unauthenticated page shares — sign in,
 * sign up, forgot password, reset password. Extracted from the original
 * login page so the four stay visually identical by construction rather
 * than by four copies of the same markup drifting apart.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gray-950 bg-cover bg-center p-12 text-white lg:flex"
        style={{ backgroundImage: `url(${nrsHeadquarters})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="relative">
          <PulseWordmark size="lg" />
        </div>
        <div className="relative">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Transformation Working Group
            <br />
            Initiative Tracker
          </h2>
          <p className="mt-4 max-w-md text-sm text-gray-200">
            A single, live source of truth for every transformation initiative across the Group
            Director of Transformation &amp; Strategy&rsquo;s office — replacing the fortnightly
            manual compile.
          </p>
        </div>
        <div className="relative text-xs text-gray-300">Nigeria Revenue Service</div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <PulseWordmark size="sm" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}

          {children}

          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** Inline form-level error, styled to match the destructive tokens used app-wide. */
export function AuthError({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</div>
  );
}
