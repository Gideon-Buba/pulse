import { api } from '@/lib/api';
import type { ImpactInitiative } from '@/lib/pptx/impact-slide';
import type { Initiative } from '@/types/api';

export interface ImpactRow extends ImpactInitiative {
  id: string;
  workstreamId: string;
}

/**
 * Joins a live `Initiative` with its milestones and update history into the
 * shape both the PPTX exporter (`lib/pptx/impact-slide.ts`) and the in-app
 * Impact View expect. Single source of truth for both — do not duplicate
 * this logic elsewhere.
 */
export async function buildImpactInitiativeRow(init: Initiative): Promise<ImpactRow> {
  const [milestones, updates] = await Promise.all([
    api.milestones.listForInitiative(init.id),
    api.updates.listForInitiative(init.id),
  ]);

  const sortedUpdates = [...updates].sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
  const sameAsLastTwg =
    sortedUpdates.length >= 2 &&
    sortedUpdates[0].latest_update.trim() === sortedUpdates[1].latest_update.trim();

  return {
    id: init.id,
    workstreamId: init.workstream_id,
    title: init.title,
    kpi: init.kpi_expected_impact,
    target: init.target,
    actual: init.actual,
    lGate: init.l_gate_stage,
    status: init.status,
    latestUpdate: init.latest_update,
    sameAsLastTwg,
    milestones: [...milestones]
      .sort((a, b) => a.sequence - b.sequence)
      .map((m) => ({ title: m.title, targetDate: m.target_date, status: m.status })),
  };
}

export function workstreamAsOfDate(initiatives: Initiative[]): string | null {
  const dates = initiatives.map((i) => i.update_as_at).filter((d): d is string => Boolean(d));
  return dates.length ? dates.reduce((max, d) => (d > max ? d : max)) : null;
}
