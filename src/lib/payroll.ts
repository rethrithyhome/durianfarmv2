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
