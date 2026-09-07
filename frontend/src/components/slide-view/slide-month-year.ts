/**
 * Duplicated (not imported) from the private `formatMonthYear`/`formatAsOfDate`
 * helpers in `lib/pptx/impact-slide.ts` — that file is the PPTX export's
 * source of truth and stays untouched, and it doesn't export these. Keep
 * these two in sync with their pptx counterparts if the deck's date format
 * ever changes.
 */
export function formatSlideMonthYear(iso: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBD';
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const yy = String(d.getFullYear()).slice(-2);
  return `${month}-${yy}`;
}

export function formatSlideAsOfDate(iso: string | null): string {
  if (!iso) return 'not recorded';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'not recorded';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
