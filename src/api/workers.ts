import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Status, Worker } from "@/types/domain";

interface WorkerRow {
  id: string; name: string; phone: string | null; position: string | null; specialty: string | null;
  plot: string | null; status: Status; photo_url: string | null; notes: string | null;
}
const fromRow = (r: WorkerRow): Worker => ({ id: r.id, name: r.name, phone: r.phone, position: r.position, specialty: r.specialty, plot: r.plot, status: r.status, photo: r.photo_url, notes: r.notes });
const toRow = (w: Partial<Worker>, farmId: string) => ({
  farm_id: farmId, name: w.name, phone: w.phone || null, position: w.position || null,
  specialty: w.specialty || null, plot: w.plot || null, status: w.status, photo_url: w.photo || null, notes: w.notes || null,
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
