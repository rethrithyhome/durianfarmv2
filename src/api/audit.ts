import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export interface AuditEntry {
  id: string;
  actorName: string | null;
  tableName: string;
  recordId: string | null;
  action: AuditAction;
  summary: string | null;
  createdAt: string;
}

interface AuditRow {
  id: string; actor_name: string | null; table_name: string;
  record_id: string | null; action: AuditAction; summary: string | null; created_at: string;
}

export async function listAuditLogs(limit = 200, farmId: string = DEFAULT_FARM_ID): Promise<AuditEntry[]> {
  const rows = must(
    await supabase.from("audit_logs").select("*").eq("farm_id", farmId)
      .order("created_at", { ascending: false }).limit(limit)
  );
  return (rows as AuditRow[]).map((r) => ({
    id: r.id, actorName: r.actor_name, tableName: r.table_name,
    recordId: r.record_id, action: r.action, summary: r.summary, createdAt: r.created_at,
  }));
}

export const AUDIT_TABLE_LABELS: Record<string, string> = {
  workers: "កម្មករ",
  trees: "ដើមទុរេន",
  care_logs: "ការថែទាំ",
  yield_cycles: "ទិន្នផលប្រចាំឆ្នាំ",
  yield_events: "កំណត់ត្រាផ្លែ",
  expenses: "ចំណាយ",
  sale_locations: "ទីតាំងលក់",
  customers: "អតិថិជន",
  sales: "ការលក់",
  work_logs: "ម៉ោងធ្វើការ",
  payroll_payments: "ការបើកប្រាក់",
  profiles: "អ្នកប្រើប្រាស់",
  farms: "ការកំណត់ចម្ការ",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  INSERT: "បន្ថែម",
  UPDATE: "កែសម្រួល",
  DELETE: "លុប",
};
