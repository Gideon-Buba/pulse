import pptxgen from 'pptxgenjs';
import type { LGate, RagStatus } from '@/types/api';
import { HEADER_ICON_SVG, NRS_LOGO_JPEG } from './assets';

/**
 * Replicates the "Impact across initiatives" slide from the NRS TWG deck
 * (NRS_TWG__18_Aug_2026.pptx / September_1st_TWG_meeting.pptx) pixel-for-pixel:
 * exact colors, fonts, column layout, status legend, header icons, the NRS
 * logo and the closing delivery-heatmap slide — all pulled from the source
 * decks' theme and measured shape geometry. Deliberately NOT replicated: the
 * off-canvas yellow "challenge" sticky notes (a fidelity/effort tradeoff, see
 * the Exports page for the note to the user) and the heatmap's "Initiative
 * progress" dot / "Read" one-liner, which in the source deck are a human's
 * curated judgment call rather than something derivable from stored fields —
 * ours are computed from each initiative's own `status` instead (see
 * `addHeatmapSlide` below).
 */

export const STATUS_COLOR: Record<RagStatus, string> = {
  'Not started': '7D858B',
  'In progress': 'FED9D6',
  Completed: 'CBF3C7',
  'Delayed/at risk': 'D63227',
};

/** Legend dot x + measured label width (from the source deck's XML — each label is a single, un-wrapped line). */
const LEGEND_ITEMS: { label: RagStatus; dotX: number; labelW: number }[] = [
  { label: 'Not started', dotX: 8.615, labelW: 0.62 },
  { label: 'In progress', dotX: 9.677, labelW: 0.64 },
  { label: 'Completed', dotX: 10.75, labelW: 0.62 },
  { label: 'Delayed/at risk', dotX: 11.8, labelW: 0.82 },
];

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const MARGIN_X = 0.604;
const HEADER_BAND_FILL = '3E4346';
const LINE_GREY = '757575';
const DIVIDER_GREY = 'B0B0B0';
const SAME_UPDATE_FILL = '97150B';
/** Target/Actual line colors in the KPI block — measured from the source deck's own text-run coloring. */
const TARGET_COLOR = '97150B';
const ACTUAL_COLOR = '288C1D';

const COLS = {
  name: { x: 0.604, w: 1.563, label: 'Initiative name', iconX: 0.607 },
  kpi: { x: 2.29, w: 1.47, label: 'Expected impact/KPI', iconX: 2.32 },
  milestone: { x: 3.885, w: 3.5, label: 'Milestone / Key Activity', iconX: 3.882 },
  status: { x: 7.49, w: 1.01, label: 'Status', iconX: 7.65 },
  timeline: { x: 8.625, w: 0.92, label: 'Timeline', iconX: 8.626 },
  update: { x: 9.76, w: 3.25, label: 'Latest update', iconX: 9.762 },
};
const DIVIDER_XS = [2.167, 3.76, 7.49, 8.5, 9.635];
/** Column-header icon (white line art on the dark band) — measured position/size from the source deck. */
const HEADER_ICON_Y = 1.559;
const HEADER_ICON_D = 0.308;
const HEADER_ICON_MAP: Record<keyof typeof COLS, string> = {
  name: HEADER_ICON_SVG.name,
  kpi: HEADER_ICON_SVG.kpi,
  milestone: HEADER_ICON_SVG.milestone,
  status: HEADER_ICON_SVG.status,
  timeline: HEADER_ICON_SVG.timeline,
  update: HEADER_ICON_SVG.update,
};

/** NRS logo — top-right of every slide, matching the source deck's slide-master placement. */
const LOGO_X = 11.576;
const LOGO_Y = 0.455;
const LOGO_W = 1.137;
const LOGO_H = 0.301;

/** Short red accent bar under the workstream title (the deck's own "section heading" underline). */
const TITLE_ACCENT_Y = 0.91;
const TITLE_ACCENT_W = 0.427;
const TITLE_ACCENT_H = 0.036;
const ACCENT_RED = 'D63227';

const BODY_TOP = 2.229;
const BODY_BOTTOM = 6.86;
export const MAX_BODY_HEIGHT = BODY_BOTTOM - BODY_TOP;
const ROW_H = 0.635;
const KPI_BLOCK_H = 1.3;
const LGATE_GAP = 0.2;
const LGATE_H = 0.3;
/** L-gate badge (ring) — measured from the source deck's "LineArrowWhite"/"Oval" group: a white-filled, black-outlined circle sitting between the "L-gate stage" label and the gate value. */
const LGATE_ICON_D = 0.28;
const LGATE_ICON_OFFSET_X = 0.585;
const LGATE_VALUE_OFFSET_X = LGATE_ICON_OFFSET_X + LGATE_ICON_D + 0.08;
const SAME_UPDATE_GAP = 0.1;
const SAME_UPDATE_H = 0.35;
const INITIATIVE_GAP = 0.14;
/** Status swatch — a small circle (ellipse), centered horizontally in the Status column. */
const STATUS_SWATCH_D = 0.22;
const STATUS_SWATCH_X = COLS.status.x + (COLS.status.w - STATUS_SWATCH_D) / 2;

export interface ImpactMilestone {
  title: string;
  targetDate: string | null;
  status: RagStatus;
}

export interface ImpactInitiative {
  title: string;
  kpi: string | null;
  target: string | null;
  actual: string | null;
  lGate: LGate | null;
  status: RagStatus;
  latestUpdate: string | null;
  sameAsLastTwg: boolean;
  milestones: ImpactMilestone[];
}

export interface WorkstreamGroup {
  workstreamName: string;
  asOfDate: string | null;
  initiatives: ImpactInitiative[];
}

/** One initiative, or a slice of one initiative's milestones continued from a previous slide. */
interface RenderChunk {
  initiative: ImpactInitiative;
  milestoneStart: number;
  milestoneEnd: number;
  isContinuation: boolean;
}

function formatMonthYear(iso: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'TBD';
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const yy = String(d.getFullYear()).slice(-2);
  return `${month}-${yy}`;
}

function formatAsOfDate(iso: string | null): string {
  if (!iso) return 'not recorded';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'not recorded';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Rough text-wrap height estimate for 11pt Arial in a box of width `w` inches. */
function estimateTextHeight(text: string, w: number, fontPt = 11): number {
  const charsPerInch = 11.5 - fontPt * 0.15; // empirical
  const charsPerLine = Math.max(10, Math.floor(w * charsPerInch));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * (fontPt / 60) + 0.05;
}

/** Per-milestone row height — grows past the baseline row height for titles long enough to wrap. */
function computeRowHeights(milestones: ImpactMilestone[]): number[] {
  if (milestones.length === 0) return [ROW_H];
  return milestones.map((m) => Math.max(ROW_H, estimateTextHeight(m.title, COLS.milestone.w, 11)));
}

/** Height of the KPI/L-gate/"same update" column vs. the latest-update column — whichever is taller. */
function fixedBlockHeight(init: ImpactInitiative): number {
  const kpiBlock = KPI_BLOCK_H + LGATE_GAP + LGATE_H + (init.sameAsLastTwg ? SAME_UPDATE_GAP + SAME_UPDATE_H : 0);
  const updateBlock = estimateTextHeight(init.latestUpdate ?? '—', COLS.update.w);
  return Math.max(kpiBlock, updateBlock);
}

export function estimateInitiativeHeight(init: ImpactInitiative): number {
  const rowHeights = computeRowHeights(init.milestones);
  const milestoneBlock = rowHeights.reduce((a, b) => a + b, 0);
  return Math.max(milestoneBlock, fixedBlockHeight(init)) + INITIATIVE_GAP;
}

/**
 * Finds how many rows starting at `startIndex` fit within `usableHeight` (bounded
 * below by `reserveFixed`, the KPI/update block on an initiative's first chunk).
 * Returns `startIndex` (no progress) if even the first row doesn't fit, unless
 * `forceAtLeastOne` is set — used only on a guaranteed-fresh, full-height page, so a
 * single pathologically tall row still gets placed instead of looping forever.
 */
function packRows(
  rowHeights: number[],
  startIndex: number,
  usableHeight: number,
  reserveFixed: number,
  forceAtLeastOne: boolean,
): number {
  let acc = 0;
  let end = startIndex;
  for (let i = startIndex; i < rowHeights.length; i++) {
    const candidateAcc = acc + rowHeights[i];
    const candidateBlock = Math.max(candidateAcc, reserveFixed);
    if (candidateBlock > usableHeight) {
      if (end === startIndex && forceAtLeastOne) {
        acc = candidateAcc;
        end = i + 1;
      }
      break;
    }
    acc = candidateAcc;
    end = i + 1;
  }
  return end;
}

/**
 * Greedily packs initiatives into pages so each page's body fits MAX_BODY_HEIGHT.
 * When a single initiative's milestones don't fit even alone on a fresh page, its
 * milestone list is split across as many continuation slides as it takes — mirroring
 * how the real TWG deck manually continues an oversized initiative with a
 * "<Initiative> (cont.)" row on the next slide, KPI/update columns left blank.
 */
function layoutPages(initiatives: ImpactInitiative[]): RenderChunk[][] {
  const pages: RenderChunk[][] = [];
  let current: RenderChunk[] = [];
  let currentHeight = 0;

  function flush(): void {
    if (current.length > 0) {
      pages.push(current);
      current = [];
      currentHeight = 0;
    }
  }

  for (const init of initiatives) {
    const rowHeights = computeRowHeights(init.milestones);
    const fixedH = fixedBlockHeight(init);
    const totalMilestoneH = rowHeights.reduce((a, b) => a + b, 0);
    const wholeH = Math.max(totalMilestoneH, fixedH);

    // Fits in whatever room is left on the current page.
    if (wholeH <= MAX_BODY_HEIGHT - currentHeight) {
      current.push({ initiative: init, milestoneStart: 0, milestoneEnd: rowHeights.length, isContinuation: false });
      currentHeight += wholeH + INITIATIVE_GAP;
      continue;
    }

    // Doesn't fit here, but fits whole on a fresh page — just start a new one.
    if (current.length > 0 && wholeH <= MAX_BODY_HEIGHT) {
      flush();
      current.push({ initiative: init, milestoneStart: 0, milestoneEnd: rowHeights.length, isContinuation: false });
      currentHeight += wholeH + INITIATIVE_GAP;
      continue;
    }

    // Doesn't fit even alone on a fresh page — split across continuation slides.
    flush();
    if (init.milestones.length === 0) {
      // Nothing to split (a single placeholder row); place as-is, best effort.
      current.push({ initiative: init, milestoneStart: 0, milestoneEnd: 0, isContinuation: false });
      currentHeight += wholeH + INITIATIVE_GAP;
      continue;
    }

    let msIndex = 0;
    let isFirstChunk = true;
    while (msIndex < rowHeights.length) {
      const reserve = isFirstChunk ? fixedH : 0;
      let usable = MAX_BODY_HEIGHT - currentHeight;
      let end = packRows(rowHeights, msIndex, usable, reserve, false);
      if (end === msIndex) {
        // No room at all left on the current page for even one more row — move on.
        flush();
        usable = MAX_BODY_HEIGHT;
        end = packRows(rowHeights, msIndex, usable, reserve, true);
      }
      const acc = rowHeights.slice(msIndex, end).reduce((a, b) => a + b, 0);
      const blockH = isFirstChunk ? Math.max(acc, reserve) : acc;
      current.push({ initiative: init, milestoneStart: msIndex, milestoneEnd: end, isContinuation: !isFirstChunk });
      currentHeight += blockH + INITIATIVE_GAP;
      msIndex = end;
      isFirstChunk = false;
    }
  }

  flush();
  return pages.length > 0 ? pages : [[]];
}

function addStatusLegend(slide: pptxgen.Slide): void {
  for (const item of LEGEND_ITEMS) {
    slide.addShape('ellipse', {
      x: item.dotX,
      y: 1.01,
      w: 0.135,
      h: 0.135,
      fill: { color: STATUS_COLOR[item.label] },
      line: { type: 'none' },
    });
    slide.addText(item.label, {
      x: item.dotX + 0.177,
      y: 0.99,
      w: item.labelW,
      h: 0.18,
      fontFace: 'Arial',
      fontSize: 8,
      color: '000000',
      valign: 'middle',
      wrap: false,
    });
  }
}

function addHeaderBand(slide: pptxgen.Slide): void {
  slide.addShape('rect', {
    x: 0,
    y: 1.469,
    w: SLIDE_W,
    h: 0.7,
    fill: { color: HEADER_BAND_FILL },
    line: { type: 'none' },
  });
  for (const [key, col] of Object.entries(COLS) as [keyof typeof COLS, (typeof COLS)[keyof typeof COLS]][]) {
    slide.addImage({
      data: HEADER_ICON_MAP[key],
      x: col.iconX,
      y: HEADER_ICON_Y,
      w: HEADER_ICON_D,
      h: HEADER_ICON_D,
    });
    slide.addText(col.label, {
      x: col.x,
      y: 1.927,
      w: col.w,
      h: 0.198,
      fontFace: 'Arial',
      fontSize: 10,
      bold: true,
      color: 'FFFFFF',
      align: col === COLS.status ? 'center' : 'left',
      valign: 'middle',
    });
  }
  for (const x of DIVIDER_XS) {
    slide.addShape('line', {
      x,
      y: 1.521,
      w: 0,
      h: 0.583,
      line: { color: DIVIDER_GREY, width: 0.75 },
    });
  }
}

function addInitiativeBlock(slide: pptxgen.Slide, chunk: RenderChunk, top: number): number {
  const { initiative: init, milestoneStart, milestoneEnd, isContinuation } = chunk;
  const hasMilestones = init.milestones.length > 0;
  const milestoneSlice = hasMilestones ? init.milestones.slice(milestoneStart, milestoneEnd) : [];
  const rowHeights = hasMilestones
    ? computeRowHeights(init.milestones).slice(milestoneStart, milestoneEnd)
    : [ROW_H];
  const milestoneBlockH = rowHeights.reduce((a, b) => a + b, 0);
  const fixedH = fixedBlockHeight(init);
  const blockH = isContinuation ? milestoneBlockH : Math.max(milestoneBlockH, fixedH);

  // initiative name (merged down the whole block); continuation chunks repeat the
  // name with a "(cont.)" suffix, matching the source deck's manual overflow pattern.
  slide.addText(isContinuation ? `${init.title} (cont.)` : init.title, {
    x: COLS.name.x,
    y: top,
    w: COLS.name.w,
    h: blockH,
    fontFace: 'Arial',
    fontSize: 11,
    bold: true,
    color: '000000',
    valign: 'top',
    wrap: true,
  });

  if (!isContinuation) {
    // KPI / target (red) / actual (green) — matches the source deck's own run-level coloring
    slide.addText(
      [
        { text: `${init.kpi ?? '—'}\n`, options: { bold: true } },
        { text: `Target – ${init.target ?? 'TBD'}\n`, options: { italic: true, color: TARGET_COLOR } },
        { text: `Actual – ${init.actual ?? 'TBD'}`, options: { italic: true, color: ACTUAL_COLOR } },
      ],
      {
        x: COLS.kpi.x,
        y: top,
        w: COLS.kpi.w,
        h: KPI_BLOCK_H,
        fontFace: 'Arial',
        fontSize: 11,
        color: '000000',
        valign: 'top',
        wrap: true,
      },
    );

    // L-gate stage
    const lgateY = top + KPI_BLOCK_H + LGATE_GAP;
    slide.addText('L-gate stage', {
      x: COLS.kpi.x,
      y: lgateY,
      w: 0.85,
      h: LGATE_H,
      fontFace: 'Arial',
      fontSize: 8,
      color: '000000',
      valign: 'middle',
    });
    // white-filled, black-ringed circle badge (matches the deck's "Oval" L-gate icon)
    slide.addShape('ellipse', {
      x: COLS.kpi.x + LGATE_ICON_OFFSET_X,
      y: lgateY + (LGATE_H - LGATE_ICON_D) / 2,
      w: LGATE_ICON_D,
      h: LGATE_ICON_D,
      fill: { color: 'FFFFFF' },
      line: { color: '000000', width: 0.5 },
    });
    slide.addText(init.lGate ?? '—', {
      x: COLS.kpi.x + LGATE_VALUE_OFFSET_X,
      y: lgateY,
      w: 0.5,
      h: LGATE_H,
      fontFace: 'Arial',
      fontSize: 9,
      bold: true,
      color: '000000',
      valign: 'middle',
    });

    if (init.sameAsLastTwg) {
      slide.addShape('rect', {
        x: COLS.name.x,
        y: lgateY + LGATE_H + SAME_UPDATE_GAP,
        w: 1.7,
        h: SAME_UPDATE_H,
        fill: { color: SAME_UPDATE_FILL },
        line: { type: 'none' },
        rectRadius: 0.04,
      });
      slide.addText('Same update as last TWG', {
        x: COLS.name.x + 0.05,
        y: lgateY + LGATE_H + SAME_UPDATE_GAP,
        w: 1.6,
        h: SAME_UPDATE_H,
        fontFace: 'Arial',
        fontSize: 8,
        bold: true,
        color: 'FFFFFF',
        valign: 'middle',
        align: 'center',
      });
    }
  }

  // milestone rows (milestone text + status + timeline month), separated by thin grey lines.
  // Each row's status swatch reflects that milestone's own status, centered in the Status column.
  if (!hasMilestones) {
    slide.addText('No milestones recorded', {
      x: COLS.milestone.x,
      y: top,
      w: COLS.milestone.w,
      h: ROW_H,
      fontFace: 'Arial',
      fontSize: 11,
      italic: true,
      color: '757575',
      valign: 'top',
    });
    if (!isContinuation) {
      // No milestone to carry its own status — fall back to the initiative's overall status.
      slide.addShape('ellipse', {
        x: STATUS_SWATCH_X,
        y: top + (ROW_H - STATUS_SWATCH_D) / 2,
        w: STATUS_SWATCH_D,
        h: STATUS_SWATCH_D,
        fill: { color: STATUS_COLOR[init.status] },
        line: { type: 'none' },
      });
    }
  } else {
    let rowY = top;
    milestoneSlice.forEach((m, i) => {
      const rowH = rowHeights[i];
      slide.addText(m.title, {
        x: COLS.milestone.x,
        y: rowY,
        w: COLS.milestone.w,
        h: rowH,
        fontFace: 'Arial',
        fontSize: 11,
        color: '000000',
        valign: 'top',
        wrap: true,
      });
      slide.addShape('ellipse', {
        x: STATUS_SWATCH_X,
        y: rowY + (rowH - STATUS_SWATCH_D) / 2,
        w: STATUS_SWATCH_D,
        h: STATUS_SWATCH_D,
        fill: { color: STATUS_COLOR[m.status] },
        line: { type: 'none' },
      });
      slide.addText(formatMonthYear(m.targetDate), {
        x: COLS.timeline.x,
        y: rowY,
        w: COLS.timeline.w,
        h: 0.2,
        fontFace: 'Arial',
        fontSize: 11,
        color: '000000',
        valign: 'top',
      });
      if (i > 0) {
        slide.addShape('line', {
          x: COLS.milestone.x,
          y: rowY - 0.02,
          w: COLS.status.x + COLS.status.w + COLS.timeline.w - COLS.milestone.x,
          h: 0,
          line: { color: LINE_GREY, width: 0.5 },
        });
      }
      rowY += rowH;
    });
  }

  // latest update — only shown where the initiative first appears
  if (!isContinuation) {
    slide.addText(init.latestUpdate ?? '—', {
      x: COLS.update.x,
      y: top,
      w: COLS.update.w,
      h: fixedH,
      fontFace: 'Arial',
      fontSize: 11,
      color: '000000',
      valign: 'top',
      wrap: true,
    });
  }

  return blockH;
}

function addFooter(slide: pptxgen.Slide, pageLabel: string): void {
  slide.addText('Pulse — NRS TWG Initiative Tracker', {
    x: MARGIN_X,
    y: 7.05,
    w: 7,
    h: 0.2,
    fontFace: 'Arial',
    fontSize: 8,
    color: '828B90',
  });
  slide.addText(pageLabel, {
    x: 11.3,
    y: 7.05,
    w: 1.4,
    h: 0.2,
    fontFace: 'Arial',
    fontSize: 8,
    color: '828B90',
    align: 'right',
  });
}

function addImpactSlide(
  pptx: pptxgen,
  params: { workstreamName: string; pageIndex: number; pageCount: number; asOfDate: string | null; chunks: RenderChunk[] },
): void {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  slide.addImage({ data: NRS_LOGO_JPEG, x: LOGO_X, y: LOGO_Y, w: LOGO_W, h: LOGO_H });

  slide.addText('Impact across initiatives', {
    x: MARGIN_X,
    y: 0.035,
    w: 4.2,
    h: 0.16,
    fontFace: 'Arial',
    fontSize: 9,
    color: '666666',
  });
  slide.addText(`${params.workstreamName} (${params.pageIndex}/${params.pageCount})`, {
    x: MARGIN_X,
    y: 0.458,
    w: 10.75,
    h: 0.417,
    fontFace: 'Arial',
    fontSize: 20,
    bold: true,
    color: '000000',
  });
  slide.addShape('rect', {
    x: MARGIN_X,
    y: TITLE_ACCENT_Y,
    w: TITLE_ACCENT_W,
    h: TITLE_ACCENT_H,
    fill: { color: ACCENT_RED },
    line: { type: 'none' },
  });
  slide.addText([{ text: 'Update as of ' }, { text: formatAsOfDate(params.asOfDate), options: {} }], {
    x: MARGIN_X,
    y: 1.114,
    w: 6,
    h: 0.167,
    fontFace: 'Arial',
    fontSize: 10,
    italic: true,
    color: '595959',
  });

  addStatusLegend(slide);
  addHeaderBand(slide);

  let y = BODY_TOP;
  params.chunks.forEach((chunk) => {
    const h = addInitiativeBlock(slide, chunk, y);
    y += h + INITIATIVE_GAP;
    if (y < BODY_BOTTOM) {
      slide.addShape('line', {
        x: MARGIN_X,
        y: y - INITIATIVE_GAP / 2,
        w: 12.156,
        h: 0,
        line: { color: LINE_GREY, width: 0.75 },
      });
    }
  });

  addFooter(slide, `${params.pageIndex} / ${params.pageCount}`);
}

// ─────────────────────────── Delivery heatmap slide ───────────────────────────
//
// The source deck's heatmap has two things that are genuinely a human's curated
// judgment call, not a formula over the deck's own numbers: the "Initiative
// progress" dot (Advanced/Monitor/Needs attention) and the "Read" one-liner
// ("Stalled – DSA pending", "Recovering debt", ...). Neither is derivable from
// what Pulse stores. Instead we compute both directly from the initiative's own
// `status` field — literally "according to the current status of the
// initiative" — and disclose that on the Exports page rather than pretend to
// match the original's editorial judgment.

const PROGRESS_DOT: Record<RagStatus, { fill: string; ring?: string }> = {
  Completed: { fill: '2E7934' }, // Advanced
  'In progress': { fill: 'FFFFFF', ring: 'D53127' }, // Monitor
  'Not started': { fill: 'FFFFFF', ring: 'D53127' }, // Monitor
  'Delayed/at risk': { fill: 'D53127' }, // Needs attention
};

const MILESTONE_BAR_COLOR = {
  completed: 'B7E4B0',
  inProgress: 'BFBFBF',
  delayed: 'D53127',
  track: 'EDEDED',
  trackBorder: 'E4E4E4',
};

const HM = {
  titleX: 0.45,
  titleY: 0.2,
  titleW: 10.6,
  titleH: 0.95,
  subtitleX: 9.7,
  subtitleY: 0.9,
  subtitleW: 3.15,
  subtitleH: 0.35,
  accentX: 0.45,
  accentY: 1.2,
  accentW: 0.55,
  accentH: 0.045,
  sectionLabelX: 0.45,
  sectionLabelY: 1.28,
  sectionLabelW: 4.0,
  sectionLabelH: 0.28,
  legendLabelY: 1.65,
  legendRowY: 1.99,
  headerY: 2.3,
  headerH: 0.229,
  dividerH: 0.018,
  rowStartY: 2.61,
  rowPitch: 0.183,
  dotSize: 0.13,
  colInitiative: { x: 0.45, w: 3.3 },
  colWorkstream: { x: 3.85, w: 1.6 },
  colBar: { x: 5.55, w: 3.75 },
  barH: 0.1,
  colDone: { x: 9.549, w: 0.7 },
  colDelayed: { x: 10.301, w: 1.0 },
  colRead: { x: 11.348, w: 1.6 },
  bodyBottom: 7.05,
};

export interface HeatmapRow {
  title: string;
  workstreamName: string;
  status: RagStatus;
  milestoneStatuses: RagStatus[];
}

function heatmapCounts(row: HeatmapRow): { completed: number; inProgress: number; delayed: number; total: number } {
  const total = row.milestoneStatuses.length;
  const completed = row.milestoneStatuses.filter((s) => s === 'Completed').length;
  const inProgress = row.milestoneStatuses.filter((s) => s === 'In progress').length;
  const delayed = row.milestoneStatuses.filter((s) => s === 'Delayed/at risk').length;
  return { completed, inProgress, delayed, total };
}

/** Packs heatmap rows into pages of `HM.rowPitch`-tall rows fitting between rowStartY and bodyBottom. */
function layoutHeatmapPages(rows: HeatmapRow[]): HeatmapRow[][] {
  const maxRowsPerPage = Math.max(1, Math.floor((HM.bodyBottom - HM.rowStartY) / HM.rowPitch));
  const pages: HeatmapRow[][] = [];
  for (let i = 0; i < rows.length; i += maxRowsPerPage) {
    pages.push(rows.slice(i, i + maxRowsPerPage));
  }
  return pages.length > 0 ? pages : [[]];
}

function addHeatmapLegend(slide: pptxgen.Slide): void {
  slide.addText('Initiative progress', {
    x: 0.45,
    y: HM.legendLabelY,
    w: 1.6,
    h: 0.25,
    fontFace: 'Arial',
    fontSize: 10.5,
    color: '1A1A1A',
  });
  const progressItems: { label: string; x: number; w: number; fill: string; ring?: string }[] = [
    { label: 'Advanced', x: 0.45, w: 1.0, fill: '2E7934' },
    { label: 'Monitor', x: 1.55, w: 1.0, fill: 'FFFFFF', ring: 'D53127' },
    { label: 'Needs attention', x: 2.55, w: 1.5, fill: 'D53127' },
  ];
  for (const item of progressItems) {
    slide.addShape('ellipse', {
      x: item.x,
      y: HM.legendRowY,
      w: HM.dotSize,
      h: HM.dotSize,
      fill: { color: item.fill },
      line: item.ring ? { color: item.ring, width: 1.3 } : { type: 'none' },
    });
    slide.addText(item.label, {
      x: item.x + 0.2,
      y: HM.legendRowY - 0.03,
      w: item.w,
      h: 0.2,
      fontFace: 'Arial',
      fontSize: 9.5,
      color: '1A1A1A',
      valign: 'middle',
      wrap: false,
    });
  }

  slide.addText('Milestone progress', {
    x: 3.85,
    y: HM.legendLabelY,
    w: 1.8,
    h: 0.25,
    fontFace: 'Arial',
    fontSize: 10.5,
    color: '1A1A1A',
  });
  const milestoneItems: { label: string; x: number; w: number; fill: string; border?: string }[] = [
    { label: 'Completed', x: 3.85, w: 1.1, fill: MILESTONE_BAR_COLOR.completed },
    { label: 'In progress', x: 4.85, w: 1.1, fill: MILESTONE_BAR_COLOR.inProgress },
    { label: 'Delayed at risk', x: 6.2, w: 1.4, fill: MILESTONE_BAR_COLOR.delayed },
    { label: 'Not started', x: 7.55, w: 1.3, fill: MILESTONE_BAR_COLOR.track, border: MILESTONE_BAR_COLOR.trackBorder },
  ];
  for (const item of milestoneItems) {
    slide.addShape('rect', {
      x: item.x,
      y: HM.legendRowY - 0.01,
      w: 0.14,
      h: 0.14,
      fill: { color: item.fill },
      line: item.border ? { color: item.border, width: 0.5 } : { type: 'none' },
    });
    slide.addText(item.label, {
      x: item.x + 0.19,
      y: HM.legendRowY - 0.04,
      w: item.w,
      h: 0.2,
      fontFace: 'Arial',
      fontSize: 9.5,
      color: '1A1A1A',
      valign: 'middle',
      wrap: false,
    });
  }
}

function addHeatmapHeaderRow(slide: pptxgen.Slide): void {
  const headers: { label: string; x: number; w: number; align?: 'left' | 'center' }[] = [
    { label: 'INITIATIVE', x: HM.colInitiative.x, w: HM.colInitiative.w },
    { label: 'WORKSTREAM', x: HM.colWorkstream.x, w: HM.colWorkstream.w },
    { label: 'MILESTONE DELIVERY', x: HM.colBar.x, w: HM.colBar.w },
    { label: 'DONE', x: HM.colDone.x, w: HM.colDone.w },
    { label: 'DELAYED', x: HM.colDelayed.x, w: HM.colDelayed.w },
    { label: 'READ', x: HM.colRead.x, w: HM.colRead.w },
  ];
  for (const h of headers) {
    slide.addText(h.label, {
      x: h.x,
      y: HM.headerY,
      w: h.w,
      h: HM.headerH,
      fontFace: 'Arial',
      fontSize: 9,
      bold: true,
      color: '757575',
      valign: 'middle',
    });
  }
  slide.addShape('rect', {
    x: 0.45,
    y: HM.headerY + HM.headerH + 0.03,
    w: 12.448,
    h: HM.dividerH,
    fill: { color: '1A1A1A' },
    line: { type: 'none' },
  });
}

function addHeatmapRow(slide: pptxgen.Slide, row: HeatmapRow, y: number): void {
  const { completed, inProgress, delayed, total } = heatmapCounts(row);
  const dot = PROGRESS_DOT[row.status];

  slide.addShape('ellipse', {
    x: HM.colInitiative.x,
    y: y + (HM.rowPitch - HM.dotSize) / 2,
    w: HM.dotSize,
    h: HM.dotSize,
    fill: { color: dot.fill },
    line: dot.ring ? { color: dot.ring, width: 1.3 } : { type: 'none' },
  });
  slide.addText(row.title, {
    x: HM.colInitiative.x + 0.22,
    y,
    w: HM.colInitiative.w - 0.22,
    h: HM.rowPitch,
    fontFace: 'Arial',
    fontSize: 9.5,
    bold: true,
    color: '1A1A1A',
    valign: 'middle',
    wrap: false,
  });
  slide.addText(row.workstreamName, {
    x: HM.colWorkstream.x,
    y,
    w: HM.colWorkstream.w,
    h: HM.rowPitch,
    fontFace: 'Arial',
    fontSize: 9,
    color: '757575',
    valign: 'middle',
    wrap: false,
  });

  // Milestone-delivery bar: a light "not started" track, with completed/in-progress/delayed
  // segments stacked left-to-right in that order, each proportional to its share of milestones.
  const barY = y + (HM.rowPitch - HM.barH) / 2;
  slide.addShape('rect', {
    x: HM.colBar.x,
    y: barY,
    w: HM.colBar.w,
    h: HM.barH,
    fill: { color: MILESTONE_BAR_COLOR.track },
    line: { color: MILESTONE_BAR_COLOR.trackBorder, width: 0.5 },
  });
  if (total > 0) {
    let segX = HM.colBar.x;
    const segments: [number, string][] = [
      [completed, MILESTONE_BAR_COLOR.completed],
      [inProgress, MILESTONE_BAR_COLOR.inProgress],
      [delayed, MILESTONE_BAR_COLOR.delayed],
    ];
    for (const [count, color] of segments) {
      if (count <= 0) continue;
      const segW = (HM.colBar.w * count) / total;
      slide.addShape('rect', { x: segX, y: barY, w: segW, h: HM.barH, fill: { color }, line: { type: 'none' } });
      segX += segW;
    }
  }

  slide.addText(`${completed}/${total}`, {
    x: HM.colDone.x,
    y,
    w: HM.colDone.w,
    h: HM.rowPitch,
    fontFace: 'Arial',
    fontSize: 9.5,
    bold: true,
    color: '1A1A1A',
    valign: 'middle',
    wrap: false,
  });
  slide.addText(delayed > 0 ? `${delayed} of ${total}` : '–', {
    x: HM.colDelayed.x,
    y,
    w: HM.colDelayed.w,
    h: HM.rowPitch,
    fontFace: 'Arial',
    fontSize: 9,
    bold: true,
    color: delayed > 0 ? MILESTONE_BAR_COLOR.delayed : '757575',
    valign: 'middle',
    wrap: false,
  });
  slide.addText(row.status, {
    x: HM.colRead.x,
    y,
    w: HM.colRead.w,
    h: HM.rowPitch,
    fontFace: 'Arial',
    fontSize: 9,
    bold: true,
    color: dot.fill === 'FFFFFF' ? '757575' : dot.fill,
    valign: 'middle',
    wrap: false,
  });
}

function addHeatmapSlide(
  pptx: pptxgen,
  params: { pageIndex: number; pageCount: number; asOfDate: string | null; rows: HeatmapRow[] },
): void {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  slide.addImage({ data: NRS_LOGO_JPEG, x: LOGO_X, y: LOGO_Y, w: LOGO_W, h: LOGO_H });

  const title = params.pageCount > 1 ? `Delivery heatmap (${params.pageIndex}/${params.pageCount})` : 'Delivery heatmap';
  slide.addText(title, {
    x: HM.titleX,
    y: HM.titleY,
    w: HM.titleW,
    h: HM.titleH,
    fontFace: 'Arial',
    fontSize: 21,
    bold: true,
    color: '1A1A1A',
    valign: 'middle',
  });
  slide.addText([{ text: 'Update as of ' }, { text: formatAsOfDate(params.asOfDate), options: {} }], {
    x: HM.subtitleX,
    y: HM.subtitleY,
    w: HM.subtitleW,
    h: HM.subtitleH,
    fontFace: 'Arial',
    fontSize: 10,
    italic: true,
    color: 'A1A7AB',
    align: 'right',
    valign: 'middle',
  });
  slide.addShape('rect', {
    x: HM.accentX,
    y: HM.accentY,
    w: HM.accentW,
    h: HM.accentH,
    fill: { color: ACCENT_RED },
    line: { type: 'none' },
  });
  slide.addText('DELIVERY HEATMAP', {
    x: HM.sectionLabelX,
    y: HM.sectionLabelY,
    w: HM.sectionLabelW,
    h: HM.sectionLabelH,
    fontFace: 'Arial',
    fontSize: 11,
    bold: true,
    color: '1A1A1A',
    charSpacing: 1.5,
  });

  addHeatmapLegend(slide);
  addHeatmapHeaderRow(slide);

  let y = HM.rowStartY;
  params.rows.forEach((row) => {
    addHeatmapRow(slide, row, y);
    y += HM.rowPitch;
  });

  addFooter(slide, `${params.pageIndex} / ${params.pageCount}`);
}

export function buildImpactDeck(pptx: pptxgen, groups: WorkstreamGroup[]): void {
  pptx.defineLayout({ name: 'NRS_TWG', width: SLIDE_W, height: SLIDE_H });
  pptx.layout = 'NRS_TWG';

  const heatmapRows: HeatmapRow[] = [];

  for (const group of groups) {
    if (group.initiatives.length === 0) continue;
    const pages = layoutPages(group.initiatives);
    pages.forEach((chunks, i) => {
      addImpactSlide(pptx, {
        workstreamName: group.workstreamName,
        pageIndex: i + 1,
        pageCount: pages.length,
        asOfDate: group.asOfDate,
        chunks,
      });
    });
    for (const init of group.initiatives) {
      heatmapRows.push({
        title: init.title,
        workstreamName: group.workstreamName,
        status: init.status,
        milestoneStatuses: init.milestones.map((m) => m.status),
      });
    }
  }

  if (heatmapRows.length === 0) return;
  const asOfDate = groups.map((g) => g.asOfDate).filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;
  const heatmapPages = layoutHeatmapPages(heatmapRows);
  heatmapPages.forEach((rows, i) => {
    addHeatmapSlide(pptx, { pageIndex: i + 1, pageCount: heatmapPages.length, asOfDate, rows });
  });
}
