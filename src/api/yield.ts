import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { CareLog, CareType, YieldCycle, YieldEvent, YieldEventType } from "@/types/domain";

/* ---------------- CARE LOGS ---------------- */
interface CareRow { id: string; tree_id: string; type: CareType; date: string; worker_id: string | null; note: string | null }
const careFromRow = (r: CareRow): CareLog => ({ id: r.id, treeId: r.tree_id, type: r.type, date: r.date, workerId: r.worker_id, note: r.note });
const careToRow = (c: Partial<CareLog>, farmId: string) => ({ farm_id: farmId, tree_id: c.treeId, type: c.type, date: c.date, worker_id: c.workerId || null, note: c.note || null });

export async function listCareLogs(farmId: string = DEFAULT_FARM_ID): Promise<CareLog[]> {
  const rows = must(await supabase.from("care_logs").select("*").eq("farm_id", farmId).order("date", { ascending: false }));
  return (rows as CareRow[]).map(careFromRow);
}
export async function createCareLog(c: Partial<CareLog>, farmId: string = DEFAULT_FARM_ID): Promise<CareLog> {
  return careFromRow(must(await supabase.from("care_logs").insert(careToRow(c, farmId)).select().single<CareRow>()));
}
export async function deleteCareLog(id: string): Promise<void> {
  must(await supabase.from("care_logs").delete().eq("id", id));
}

/* ---------------- YIELD CYCLES ---------------- */
interface CycleRow { id: string; tree_id: string; year: number; flower_date: string | null; initial_count: number; note: string | null }
const cycleFromRow = (r: CycleRow): YieldCycle => ({ id: r.id, treeId: r.tree_id, year: r.year, flowerDate: r.flower_date, initialCount: r.initial_count, note: r.note });
const cycleToRow = (cy: Partial<YieldCycle>, farmId: string) => ({ farm_id: farmId, tree_id: cy.treeId, year: cy.year, flower_date: cy.flowerDate || null, initial_count: cy.initialCount, note: cy.note || null });

export async function listCycles(farmId: string = DEFAULT_FARM_ID): Promise<YieldCycle[]> {
  const rows = must(await supabase.from("yield_cycles").select("*").eq("farm_id", farmId).order("year", { ascending: false }));
  return (rows as CycleRow[]).map(cycleFromRow);
}
export async function createCycle(cy: Partial<YieldCycle>, farmId: string = DEFAULT_FARM_ID): Promise<YieldCycle> {
  return cycleFromRow(must(await supabase.from("yield_cycles").insert(cycleToRow(cy, farmId)).select().single<CycleRow>()));
}
export async function deleteCycle(id: string): Promise<void> {
  must(await supabase.from("yield_cycles").delete().eq("id", id));
}

/* ---------------- YIELD EVENTS ---------------- */
interface EventRow {
  id: string; tree_id: string; cycle_id: string; type: YieldEventType; quantity: number; date: string;
  weight_kg: number | null; destination: string | null; worker_id: string | null; photo_url: string | null;
}
const eventFromRow = (r: EventRow): YieldEvent => ({ id: r.id, treeId: r.tree_id, cycleId: r.cycle_id, type: r.type, quantity: r.quantity, date: r.date, weightKg: r.weight_kg, destination: r.destination, workerId: r.worker_id, photo: r.photo_url });
const eventToRow = (ev: Partial<YieldEvent>, farmId: string) => ({
  farm_id: farmId, tree_id: ev.treeId, cycle_id: ev.cycleId, type: ev.type, quantity: ev.quantity, date: ev.date,
  weight_kg: ev.weightKg ?? null, destination: ev.destination || null, worker_id: ev.workerId || null, photo_url: ev.photo || null,
});

export async function listEvents(farmId: string = DEFAULT_FARM_ID): Promise<YieldEvent[]> {
  const rows = must(await supabase.from("yield_events").select("*").eq("farm_id", farmId).order("date", { ascending: false }));
  return (rows as EventRow[]).map(eventFromRow);
}
export async function createEvent(ev: Partial<YieldEvent>, farmId: string = DEFAULT_FARM_ID): Promise<YieldEvent> {
  return eventFromRow(must(await supabase.from("yield_events").insert(eventToRow(ev, farmId)).select().single<EventRow>()));
}
export async function deleteEvent(id: string): Promise<void> {
  must(await supabase.from("yield_events").delete().eq("id", id));
}
