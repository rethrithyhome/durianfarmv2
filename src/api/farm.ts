import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { FarmSettings } from "@/types/domain";
import { DEFAULT_THEME } from "@/lib/theme";
import { DEFAULT_EXCHANGE_RATE } from "@/lib/currency";
import { defaultVisibility } from "@/lib/permissions";

interface FarmRow {
  id: string; name: string; logo_url: string | null; owner_pin: string | null;
  theme: string | null; exchange_rate: number | null; payroll_cycle_start_day: number | null;
  visibility: FarmSettings["visibility"] | null;
}

export async function getFarm(farmId: string = DEFAULT_FARM_ID): Promise<FarmSettings> {
  const f = must(await supabase.from("farms").select("*").eq("id", farmId).single<FarmRow>());
  return {
    farmName: f.name,
    logo: f.logo_url,
    ownerPin: f.owner_pin ?? "",
    theme: f.theme ?? DEFAULT_THEME,
    exchangeRate: Number(f.exchange_rate ?? DEFAULT_EXCHANGE_RATE),
    payrollCycleStartDay: Number(f.payroll_cycle_start_day ?? 1),
    visibility: { ...defaultVisibility(), ...(f.visibility ?? {}) },
  };
}
export async function updateFarm(patch: Partial<FarmSettings>, farmId: string = DEFAULT_FARM_ID): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.farmName !== undefined) row.name = patch.farmName;
  if (patch.logo !== undefined) row.logo_url = patch.logo;
  if (patch.ownerPin !== undefined) row.owner_pin = patch.ownerPin;
  if (patch.theme !== undefined) row.theme = patch.theme;
  if (patch.exchangeRate !== undefined) row.exchange_rate = patch.exchangeRate;
  if (patch.payrollCycleStartDay !== undefined) row.payroll_cycle_start_day = patch.payrollCycleStartDay;
  if (patch.visibility !== undefined) row.visibility = patch.visibility;
  must(await supabase.from("farms").update(row).eq("id", farmId));
}

/**
 * Danger zone: deletes every operational record for this farm (workers,
 * trees — which cascades to care logs / yield cycles / yield events —
 * expenses, sale locations, customers, sales). The farm row itself and
 * user accounts are left untouched. Only ever call this after an
 * explicit, typed confirmation from the owner.
 */
export async function resetFarmData(farmId: string = DEFAULT_FARM_ID): Promise<void> {
  const tables = ["trees", "workers", "expenses", "sales", "customers", "sale_locations"];
  for (const table of tables) {
    const res = await supabase.from(table).delete().eq("farm_id", farmId);
    if (res.error) throw res.error;
  }
}
