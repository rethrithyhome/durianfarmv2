import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Currency, Gender, Status, WageType, Worker } from "@/types/domain";

interface WorkerRow {
  id: string; name: string; phone: string | null; position: string | null; specialty: string | null;
  plot: string | null; status: Status; photo_url: string | null; notes: string | null;
  wage_type: WageType; wage_rate: number; wage_currency: Currency; start_date: string | null;
  gender: Gender | null; birth_date: string | null; id_doc_url: string | null; id_doc_name: string | null;
}
const fromRow = (r: WorkerRow): Worker => ({
  id: r.id, name: r.name, phone: r.phone, position: r.position, specialty: r.specialty,
  plot: r.plot, status: r.status, photo: r.photo_url, notes: r.notes,
  wageType: r.wage_type ?? "hourly", wageRate: Number(r.wage_rate ?? 0), wageCurrency: r.wage_currency ?? "KHR",
  startDate: r.start_date,
  gender: r.gender, birthDate: r.birth_date, idDocUrl: r.id_doc_url, idDocName: r.id_doc_name,
});
const toRow = (w: Partial<Worker>, farmId: string) => ({
  farm_id: farmId, name: w.name, phone: w.phone || null, position: w.position || null,
  specialty: w.specialty || null, plot: w.plot || null, status: w.status, photo_url: w.photo || null, notes: w.notes || null,
  wage_type: w.wageType ?? "hourly", wage_rate: w.wageRate ?? 0, wage_currency: w.wageCurrency ?? "KHR",
  start_date: w.startDate || null,
  gender: w.gender || null, birth_date: w.birthDate || null,
  id_doc_url: w.idDocUrl || null, id_doc_name: w.idDocName || null,
});

export async function listWorkers(farmId: string = DEFAULT_FARM_ID): Promise<Worker[]> {
  const rows = must(await supabase.from("workers").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }));
  return (rows as WorkerRow[]).map(fromRow);
}
export async function createWorker(w: Partial<Worker>, farmId: string = DEFAULT_FARM_ID): Promise<Worker> {
  return fromRow(must(await supabase.from("workers").insert(toRow(w, farmId)).select().single<WorkerRow>()));
}
export async function updateWorker(w: Worker, farmId: string = DEFAULT_FARM_ID): Promise<Worker> {
  return fromRow(must(await supabase.from("workers").update(toRow(w, farmId)).eq("id", w.id).select().single<WorkerRow>()));
}
export async function deleteWorker(id: string): Promise<void> {
  must(await supabase.from("workers").delete().eq("id", id));
}
