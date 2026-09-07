import type { RagStatus } from '@/types/api';

/**
 * Maps each RAG status to its slide-view CSS custom property (defined in
 * slide-view.css) — the deck's own exact hex colors. Deliberately not the
 * app's `--rag-*` tokens used elsewhere (e.g. dashboard.css): those use a
 * different palette (blue for "In progress" vs. the deck's pink/salmon)
 * that doesn't match the real TWG slides.
 */
export const SLIDE_STATUS_VAR: Record<RagStatus, string> = {
  'Not started': 'var(--slide-not-started)',
  'In progress': 'var(--slide-in-progress)',
  Completed: 'var(--slide-completed)',
  'Delayed/at risk': 'var(--slide-delayed)',
};

/** The initiative-progress dot mapping from the deck's closing heatmap slide (Advanced/Monitor/Needs attention). */
export const SLIDE_PROGRESS_DOT: Record<RagStatus, { fill: string; ring?: string; label: string }> = {
  Completed: { fill: '#2E7934', label: 'Advanced' },
  'In progress': { fill: '#FFFFFF', ring: '#D53127', label: 'Monitor' },
  'Not started': { fill: '#FFFFFF', ring: '#D53127', label: 'Monitor' },
  'Delayed/at risk': { fill: '#D53127', label: 'Needs attention' },
};
