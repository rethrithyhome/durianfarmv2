import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Role, Status, UserProfile } from "@/types/domain";

export interface ProfileRow {
  id: string; farm_id: string | null; name: string; phone: string | null;
  role: Role; plots: string[]; status: Status; photo_url: string | null; notes: string | null;
}
export function profileFromRow(r: ProfileRow): UserProfile {
  return { id: r.id, farmId: r.farm_id, name: r.name, phone: r.phone, role: r.role, plots: r.plots ?? [], status: r.status, photo: r.photo_url, notes: r.notes };
}

export async function listProfiles(farmId: string = DEFAULT_FARM_ID): Promise<UserProfile[]> {
  const rows = must(await supabase.from("profiles").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }));
  return (rows as ProfileRow[]).map(profileFromRow);
}
export async function updateProfile(userId: string, patch: Partial<UserProfile>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.plots !== undefined) row.plots = patch.plots;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.photo !== undefined) row.photo_url = patch.photo;
  if (patch.notes !== undefined) row.notes = patch.notes;
  must(await supabase.from("profiles").update(row).eq("id", userId));
}
export async function removeUserFromFarm(userId: string): Promise<void> {
  must(await supabase.from("profiles").update({ farm_id: null, status: "inactive" }).eq("id", userId));
}

export interface AdminCreateUserInput {
  email: string; password: string; name: string; role: Role; plots: string[];
}
export interface AdminCreateUserResult {
  ok: true; id: string; email: string; name: string; role: Role; plots: string[];
}
export async function adminCreateUser(input: AdminCreateUserInput): Promise<AdminCreateUserResult> {
  const { data, error } = await supabase.functions.invoke("create-user", { body: input });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as AdminCreateUserResult;
}
