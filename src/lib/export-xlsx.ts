/**
 * IronTrack Schedule Simulator — XLSX Export
 * Uses SheetJS (xlsx package, already installed).
 *
 * Output:
 *   Sheet 1 "Schedule" — full activity table with color coding
 *   Sheet 2 "Summary"  — phase + trade breakdown
 */

import * as XLSX from 'xlsx';
import { GeneratedSchedule, ScheduleActivity } from './schedule-engine';

// SheetJS cell style type (not exported by the package, defined here)
interface CellStyle {
  fill?: {
    fgColor?: { rgb: string };
    patternType?: string;
  };
  font?: {
    bold?: boolean;
    color?: { rgb: string };
    sz?: number;
  };
  alignment?: {
    horizontal?: string;
    vertical?: string;
    wrapText?: boolean;
  };
  border?: {
    bottom?: { style: string; color: { rgb: string } };
  };
}

type StyledCell = XLSX.CellObject & { s?: CellStyle };

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = {
  criticalBg: 'FFCCCC',    // light red — critical path rows
  phaseBg: 'D9D9D9',       // gray — phase header rows
  headerBg: '1F1F25',      // dark — column headers (won't render in all apps)
  headerFg: 'F97316',      // orange accent
  criticalFg: 'CC0000',    // dark red text
  phaseFg: '333333',
  white: 'FFFFFF',
};

function cell(
  value: string | number | boolean | null,
  style?: CellStyle
): StyledCell {
  const c: StyledCell = { v: value ?? '', t: typeof value === 'number' ? 'n' : 's' };
  if (style) c.s = style;
  return c;
}

function headerCell(value: string): StyledCell {
  return cell(value, {
    font: { bold: true, sz: 11, color: { rgb: COLORS.headerFg } },
    fill: { fgColor: { rgb: COLORS.headerBg }, patternType: 'solid' },
    alignment: { horizontal: 'center', vertical: 'center' },
  });
}

function phaseCell(value: string | number): StyledCell {
  return cell(value, {
    font: { bold: true, sz: 10, color: { rgb: COLORS.phaseFg } },
    fill: { fgColor: { rgb: COLORS.phaseBg }, patternType: 'solid' },
  });
}

function criticalCell(value: string | number): StyledCell {
  return cell(value, {
    font: { sz: 10, color: { rgb: COLORS.criticalFg } },
    fill: { fgColor: { rgb: COLORS.criticalBg }, patternType: 'solid' },
  });
}

function normalCell(value: string | number): StyledCell {
  return cell(value, {
    font: { sz: 10 },
    fill: { fgColor: { rgb: COLORS.white }, patternType: 'solid' },
  });
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function generateXLSX(schedule: GeneratedSchedule): Buffer {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Schedule ──────────────────────────────────────────────────────
  const headers = [
    'ID',
    'Activity ID',
    'Activity Name',
    'Trade',
    'Phase',
    'Duration (Days)',
    'Early Start',
    'Early Finish',
    'Late Start',
    'Late Finish',
    'Float (Days)',
    'Predecessors',
    'Critical Path',
  ];

  const wsData: StyledCell[][] = [];

  // Header row
  wsData.push(headers.map(headerCell));

  // Group activities by phase
  const phaseOrder = [
    'Phase 1: Pre-Construction & Mobilization',
    'Phase 2: Site Work & Earthwork',
    'Phase 3: Foundations',
    'Phase 4: Structure',
    'Phase 5: Building Envelope',
    'Phase 6: Rough-Ins (MEP)',
    'Phase 7: Interior Finishes',
    'Phase 8: Final MEP & Specialties',
    'Phase 9: Closeout & Punchlist',
  ];

  const grouped = new Map<string, ScheduleActivity[]>();
  schedule.activities.forEach((a) => {
    const list = grouped.get(a.phase) ?? [];
    list.push(a);
    grouped.set(a.phase, list);
  });

  const phasesPresent = phaseOrder.filter((ph) => grouped.has(ph));
  // Also catch any phase not in the order
  schedule.activities.forEach((a) => {
    if (!phasesPresent.includes(a.phase)) phasesPresent.push(a.phase);
  });

  phasesPresent.forEach((phase) => {
    const acts = grouped.get(phase) ?? [];
    if (acts.length === 0) return;

    // Phase header row
    const phRow: StyledCell[] = [
      phaseCell(''),
      phaseCell(''),
      phaseCell(phase),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
      phaseCell(''),
    ];
    wsData.push(phRow);

    // Activity rows
    acts.forEach((a) => {
      const isCrit = a.isCritical ?? false;
      const mkCell = isCrit ? criticalCell : normalCell;

      wsData.push([
        mkCell(a.id),
        mkCell(a.activityId),
        mkCell(a.name),
        mkCell(a.trade),
        mkCell(a.phase),
        mkCell(a.duration),
        mkCell(a.earlyStart ?? ''),
        mkCell(a.earlyFinish ?? ''),
        mkCell(a.lateStart ?? ''),
        mkCell(a.lateFinish ?? ''),
        mkCell(a.totalFloat ?? 0),
        mkCell(a.predecessors.join(', ')),
        mkCell(isCrit ? 'YES' : 'no'),
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-column widths
  const colWidths = headers.map((h, ci) => {
    let max = h.length;
    wsData.slice(1).forEach((row) => {
      const v = String(row[ci]?.v ?? '');
      if (v.length > max) max = v.length;
    });
    return { wch: Math.min(max + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');

  // ── Sheet 2: Summary ───────────────────────────────────────────────────────
  const sumData: (string | number)[][] = [
    ['IronTrack Schedule Simulator — Project Summary'],
    [],
    ['Project', schedule.projectName],
    ['Start Date', schedule.startDate],
    ['End Date', schedule.endDate],
    ['Total Calendar Duration', `${schedule.totalDuration} calendar days`],
    ['Total Working Days', `${schedule.summary.totalDuration} working days`],
    ['Total Activities', schedule.summary.totalActivities],
    ['Critical Path Activities', schedule.criticalPath.length],
    [],
    ['─── Phase Summary ───'],
    ['Phase', 'Duration (Working Days)'],
    ...schedule.summary.phases.map((p) => [p.name, p.duration]),
    [],
    ['─── Trade Breakdown ───'],
    ['Trade', 'Activities', 'Total Days'],
    ...schedule.summary.tradeBreakdown.map((t) => [t.trade, t.activities, t.days]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(sumData);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Write to buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return buf;
}
