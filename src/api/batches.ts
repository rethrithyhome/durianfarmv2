import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { HarvestBatch, TraceBatchResult } from "@/types/domain";

interface BatchRow { id: string; batch_code: string; packed_date: string; destination: string | null; notes: string | null }

export async function listBatches(farmId: string = DEFAULT_FARM_ID): Promise<HarvestBatch[]> {
  const rows = must(await supabase.from("harvest_batches").select("*").eq("farm_id", farmId).order("created_at", { ascending: false })) as BatchRow[];
  const batches: HarvestBatch[] = [];
  for (const r of rows) {
    const links = must(await supabase.from("batch_yield_events").select("yield_event_id").eq("batch_id", r.id)) as { yield_event_id: string }[];
    batches.push({ id: r.id, batchCode: r.batch_code, packedDate: r.packed_date, destination: r.destination, notes: r.notes, eventIds: links.map((l) => l.yield_event_id) });
  }
  return batches;
}

/** Generates a readable, farm-scoped batch code, e.g. PS-20260903-01. */
function nextBatchCode(farmName: string, existing: string[]): string {
  const prefix = (farmName || "FARM").replace(/[^A-Za-z\u1780-\u17FF]/g, "").slice(0, 2).toUpperCase() || "FM";
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const todays = existing.filter((c) => c.includes(datePart));
  const seq = String(todays.length + 1).padStart(2, "0");
  return `${prefix}-${datePart}-${seq}`;
}

export async function createBatch(
  input: { farmName: string; packedDate: string; destination?: string | null; notes?: string | null; eventIds: string[] },
  farmId: string = DEFAULT_FARM_ID
): Promise<HarvestBatch> {
  const existingRows = must(await supabase.from("harvest_batches").select("batch_code").eq("farm_id", farmId)) as { batch_code: string }[];
  const batchCode = nextBatchCode(input.farmName, existingRows.map((r) => r.batch_code));

  const batchRow = must(await supabase.from("harvest_batches").insert({
    farm_id: farmId, batch_code: batchCode, packed_date: input.packedDate,
    destination: input.destination || null, notes: input.notes || null,
  }).select().single<BatchRow>());

  if (input.eventIds.length > 0) {
    const links = input.eventIds.map((id) => ({ batch_id: batchRow.id, yield_event_id: id }));
    const res = await supabase.from("batch_yield_events").insert(links);
    if (res.error) throw res.error;
  }

  return { id: batchRow.id, batchCode: batchRow.batch_code, packedDate: batchRow.packed_date, destination: batchRow.destination, notes: batchRow.notes, eventIds: input.eventIds };
}

export async function deleteBatch(id: string): Promise<void> {
  must(await supabase.from("harvest_batches").delete().eq("id", id));
}

/** Builds the public, no-login URL encoded into a batch's QR code. */
export function traceUrl(batchCode: string): string {
  return `${window.location.origin}/trace/${encodeURIComponent(batchCode)}`;
}

/** Public lookup — calls the trace-batch Edge Function directly via
 * fetch (not supabase.functions.invoke) so it works with zero session,
 * for anyone who just scanned a QR code cold. */
export async function fetchTraceBatch(code: string): Promise<TraceBatchResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/trace-batch?code=${encodeURIComponent(code)}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "រកមិនឃើញព័ត៌មានទេ");
  return {
    farmName: data.farmName, farmLogo: data.farmLogo, batchCode: data.batchCode,
    packedDate: data.packedDate, destination: data.destination,
    trees: (data.trees ?? []).map((t: { treeCode: string; plot?: string; variety?: string; harvestDate: string; quantity: number; weightKg?: number; careLogs: { date: string; type: string; note?: string }[] }) => ({
      treeCode: t.treeCode, plot: t.plot, variety: t.variety, harvestDate: t.harvestDate,
      quantity: t.quantity, weightKg: t.weightKg, careLogs: t.careLogs ?? [],
    })),
  };
}
