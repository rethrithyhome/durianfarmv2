export interface PayrollCycle {
  start: string; // YYYY-MM-DD inclusive
  end: string;   // YYYY-MM-DD inclusive
  label: string;
}

const MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortLabel(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Builds the payroll cycle containing `ref`, given a cycle that starts on
 * `startDay` of each month. With startDay = 15, a date of 20 Sep falls in
 * the 15 Sep – 14 Oct cycle, while 3 Sep falls in 15 Aug – 14 Sep.
 * startDay = 1 gives ordinary calendar months.
 */
export function cycleFor(ref: Date, startDay: number): PayrollCycle {
  const day = Math.min(Math.max(Math.floor(startDay) || 1, 1), 28);
  const start = new Date(ref.getFullYear(), ref.getMonth(), day);
  if (ref.getDate() < day) start.setMonth(start.getMonth() - 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, day - 1);
  return {
    start: iso(start),
    end: iso(end),
    label: day === 1
      ? `${MONTHS[start.getMonth()]} ${start.getFullYear()}`
      : `${shortLabel(start)} – ${shortLabel(end)} ${end.getFullYear()}`,
  };
}

/** Steps a cycle backwards (offset -1) or forwards (offset +1). */
export function shiftCycle(cycle: PayrollCycle, startDay: number, offset: number): PayrollCycle {
  const start = new Date(cycle.start);
  start.setMonth(start.getMonth() + offset);
  return cycleFor(start, startDay);
}

/** Inclusive date-range check against a cycle. */
export function isInCycle(dateISO: string, cycle: PayrollCycle): boolean {
  return dateISO >= cycle.start && dateISO <= cycle.end;
}

function daysBetween(startISO: string, endISO: string): number {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  return Math.round(ms / 86400000) + 1; // inclusive of both ends
}

/**
 * The fraction of a cycle a salaried worker was actually employed for.
 * Someone who started mid-cycle gets a proportional share of that first
 * month rather than the full salary; everyone else gets 1.
 */
export function cycleWorkedFraction(cycle: PayrollCycle, startDate?: string | null): number {
  if (!startDate) return 1;
  if (startDate <= cycle.start) return 1;      // already employed before this cycle
  if (startDate > cycle.end) return 0;         // hadn't started yet
  const total = daysBetween(cycle.start, cycle.end);
  const worked = daysBetween(startDate, cycle.end);
  return total > 0 ? worked / total : 1;
}
