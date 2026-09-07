/** Turns a workstream name into a URL-safe anchor id, e.g. for `/impact#tax-operations`. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
