import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Currency, PayrollPayment, WorkLog } from "@/types/domain";

/* ---------------- WORK LOGS ---------------- */
interface WorkLogRow { id: string; worker_id: string; date: string; hours: number; note: string | null }
const logFromRow = (r: WorkLogRow): WorkLog => ({ id: r.id, workerId: r.worker_id, date: r.date, hours: Number(r.hours), note: r.note });
const logToRow = (l: Partial<WorkLog>, farmId: string) => ({
  farm_id: farmId, worker_id: l.workerId, date: l.date, hours: l.hours ?? 0, note: l.note || null,
});

export async function listWorkLogs(farmId: string = DEFAULT_FARM_ID): Promise<WorkLog[]> {
  const rows = must(await supabase.from("work_logs").select("*").eq("farm_id", farmId).order("date", { ascending: false }));
  return (rows as WorkLogRow[]).map(logFromRow);
}
/** Upsert on (worker, date) — re-recording the same day overwrites the
 * previous hours instead of creating a duplicate entry. */
export async function saveWorkLog(l: Partial<WorkLog>, farmId: string = DEFAULT_FARM_ID): Promise<WorkLog> {
  const row = must(await supabase.from("work_logs").upsert(logToRow(l, farmId), { onConflict: "worker_id,date" }).select().single<WorkLogRow>());
  return logFromRow(row);
}
export async function deleteWorkLog(id: string): Promise<void> {
  must(await supabase.from("work_logs").delete().eq("id", id));
}

/* ---------------- PAYROLL PAYMENTS ---------------- */
interface PaymentRow {
  id: string; worker_id: string; cycle_start: string; cycle_end: string;
  amount: number; currency: Currency; amount_khr: number; exchange_rate: number;
  paid_date: string; expense_id: string | null; note: string | null;
}
const payFromRow = (r: PaymentRow): PayrollPayment => ({
  id: r.id, workerId: r.worker_id, cycleStart: r.cycle_start, cycleEnd: r.cycle_end,
  amount: Number(r.amount), currency: r.currency, amountKhr: Number(r.amount_khr),
  exchangeRate: Number(r.exchange_rate), paidDate: r.paid_date, expenseId: r.expense_id, note: r.note,
});
const payToRow = (p: Partial<PayrollPayment>, farmId: string) => ({
  farm_id: farmId, worker_id: p.workerId, cycle_start: p.cycleStart, cycle_end: p.cycleEnd,
  amount: p.amount ?? 0, currency: p.currency ?? "KHR", amount_khr: p.amountKhr ?? 0,
  exchange_rate: p.exchangeRate ?? 4100, paid_date: p.paidDate, expense_id: p.expenseId || null, note: p.note || null,
});

export async function listPayrollPayments(farmId: string = DEFAULT_FARM_ID): Promise<PayrollPayment[]> {
  const rows = must(await supabase.from("payroll_payments").select("*").eq("farm_id", farmId).order("paid_date", { ascending: false }));
  return (rows as PaymentRow[]).map(payFromRow);
}
export async function createPayrollPayment(p: Partial<PayrollPayment>, farmId: string = DEFAULT_FARM_ID): Promise<PayrollPayment> {
  return payFromRow(must(await supabase.from("payroll_payments").insert(payToRow(p, farmId)).select().single<PaymentRow>()));
}
export async function deletePayrollPayment(id: string): Promise<void> {
  must(await supabase.from("payroll_payments").delete().eq("id", id));
}
