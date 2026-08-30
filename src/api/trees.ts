import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Health, Tree } from "@/types/domain";

interface TreeRow {
  id: string; code: string; plot: string | null; variety: string | null; planted_date: string | null;
  health: Health; notes: string | null; photo_url: string | null;
}
const fromRow = (r: TreeRow): Tree => ({ id: r.id, code: r.code, plot: r.plot, variety: r.variety, plantedDate: r.planted_date, health: r.health, notes: r.notes, photo: r.photo_url });
const toRow = (t: Partial<Tree>, farmId: string) => ({
  farm_id: farmId, code: t.code, plot: t.plot || null, variety: t.variety || null,
  planted_date: t.plantedDate || null, health: t.health, notes: t.notes || null, photo_url: t.photo || null,
});

export async function listTrees(farmId: string = DEFAULT_FARM_ID): Promise<Tree[]> {
  const rows = must(await supabase.from("trees").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }));
  return (rows as TreeRow[]).map(fromRow);
}
export async function createTree(t: Partial<Tree>, farmId: string = DEFAULT_FARM_ID): Promise<Tree> {
  return fromRow(must(await supabase.from("trees").insert(toRow(t, farmId)).select().single<TreeRow>()));
}
export async function updateTree(t: Tree, farmId: string = DEFAULT_FARM_ID): Promise<Tree> {
  return fromRow(must(await supabase.from("trees").update(toRow(t, farmId)).eq("id", t.id).select().single<TreeRow>()));
}
export async function deleteTree(id: string): Promise<void> {
  must(await supabase.from("trees").delete().eq("id", id));
}
