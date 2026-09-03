import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Currency, Expense, ExpenseCategory } from "@/types/domain";

interface ExpenseRow {
  id: string; category: ExpenseCategory; amount: number; currency: Currency;
  amount_khr: number; exchange_rate: number; date: string;
  paid: boolean; paid_date: string | null; vendor: string | null;
  receipt_url: string | null; receipt_name: string | null;
  tree_id: string | null; note: string | null;
}
const fromRow = (r: ExpenseRow): Expense => ({
  id: r.id, category: r.category, amount: Number(r.amount), currency: r.currency ?? "KHR",
  amountKhr: Number(r.amount_khr ?? r.amount), exchangeRate: Number(r.exchange_rate ?? 4100),
  date: r.date, paid: r.paid ?? true, paidDate: r.paid_date, vendor: r.vendor,
  receiptUrl: r.receipt_url, receiptName: r.receipt_name,
  treeId: r.tree_id, note: r.note,
});
const toRow = (e: Partial<Expense>, farmId: string) => ({
  farm_id: farmId, category: e.category, amount: e.amount, currency: e.currency ?? "KHR",
  amount_khr: e.amountKhr ?? e.amount, exchange_rate: e.exchangeRate ?? 4100,
  date: e.date, paid: e.paid ?? true, paid_date: e.paidDate ?? null, vendor: e.vendor || null,
  receipt_url: e.receiptUrl || null, receipt_name: e.receiptName || null,
  tree_id: e.treeId || null, note: e.note || null,
});

export async function listExpenses(farmId: string = DEFAULT_FARM_ID): Promise<Expense[]> {
  const rows = must(await supabase.from("expenses").select("*").eq("farm_id", farmId).order("date", { ascending: false }));
  return (rows as ExpenseRow[]).map(fromRow);
}
export async function createExpense(e: Partial<Expense>, farmId: string = DEFAULT_FARM_ID): Promise<Expense> {
  return fromRow(must(await supabase.from("expenses").insert(toRow(e, farmId)).select().single<ExpenseRow>()));
}
export async function updateExpense(e: Expense, farmId: string = DEFAULT_FARM_ID): Promise<Expense> {
  return fromRow(must(await supabase.from("expenses").update(toRow(e, farmId)).eq("id", e.id).select().single<ExpenseRow>()));
}
export async function deleteExpense(id: string): Promise<void> {
  must(await supabase.from("expenses").delete().eq("id", id));
}

/** Marks a batch of credit-purchase expenses as settled in one go — the
 * same "select several, pay together" pattern used for daily wages. */
export async function settleExpenses(ids: string[], paidDate: string): Promise<Expense[]> {
  const rows = must(await supabase.from("expenses").update({ paid: true, paid_date: paidDate }).in("id", ids).select());
  return (rows as ExpenseRow[]).map(fromRow);
}
