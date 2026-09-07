import type { JSX } from 'react';
import { SLIDE_STATUS_VAR } from './slide-status-color';
import type { RagStatus } from '@/types/api';

export function SlideStatusDot({
  status,
  size = 'md',
}: {
  status: RagStatus;
  size?: 'sm' | 'md';
}): JSX.Element {
  return (
    <span
      className={size === 'sm' ? 'slide-status-dot slide-status-dot--sm' : 'slide-status-dot'}
      style={{ backgroundColor: SLIDE_STATUS_VAR[status] }}
      role="img"
      aria-label={status}
    />
  );
}
