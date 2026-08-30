import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Expense, ExpenseCategory } from "@/types/domain";

interface ExpenseRow { id: string; category: ExpenseCategory; amount: number; date: string; tree_id: string | null; note: string | null }
const fromRow = (r: ExpenseRow): Expense => ({ id: r.id, category: r.category, amount: r.amount, date: r.date, treeId: r.tree_id, note: r.note });
const toRow = (e: Partial<Expense>, farmId: string) => ({ farm_id: farmId, category: e.category, amount: e.amount, date: e.date, tree_id: e.treeId || null, note: e.note || null });

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
