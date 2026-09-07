import pptxgen from 'pptxgenjs';
import { buildImpactDeck, type WorkstreamGroup } from '@/lib/pptx/impact-slide';

/** Turns a workstream name into a filesystem-safe filename fragment. */
export function fileSlug(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
}

/**
 * The single place `new pptxgen()` + `buildImpactDeck` + `pptx.writeFile`
 * happen — both the Exports page and the Impact View page's export buttons
 * go through this. `groups` must already be fully joined (milestones +
 * update-history resolved into `ImpactInitiative[]`, see
 * `lib/build-impact-row.ts`); this function does no fetching of its own.
 */
export async function downloadImpactDeck(groups: WorkstreamGroup[], fileName: string): Promise<void> {
  const pptx = new pptxgen();
  buildImpactDeck(pptx, groups);
  await pptx.writeFile({ fileName });
}
