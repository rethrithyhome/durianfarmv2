export const uid = (): string => Math.random().toString(36).slice(2, 10);
export const thisYear = new Date().getFullYear();

const MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];

export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtMoney(n?: number | null): string {
  return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
