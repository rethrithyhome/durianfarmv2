import { supabase, DEFAULT_FARM_ID } from "@/lib/supabaseClient";
import { must } from "./_shared";
import type { Customer, Sale, SaleLocation, SaleType } from "@/types/domain";

/* ---------------- SALE LOCATIONS ---------------- */
interface LocationRow { id: string; name: string; type: SaleType; area: string | null; notes: string | null }
const locFromRow = (r: LocationRow): SaleLocation => ({ id: r.id, name: r.name, type: r.type, area: r.area, notes: r.notes });
const locToRow = (l: Partial<SaleLocation>, farmId: string) => ({ farm_id: farmId, name: l.name, type: l.type || "retail", area: l.area || null, notes: l.notes || null });

export async function listLocations(farmId: string = DEFAULT_FARM_ID): Promise<SaleLocation[]> {
  const rows = must(await supabase.from("sale_locations").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }));
  return (rows as LocationRow[]).map(locFromRow);
}
export async function createLocation(l: Partial<SaleLocation>, farmId: string = DEFAULT_FARM_ID): Promise<SaleLocation> {
  return locFromRow(must(await supabase.from("sale_locations").insert(locToRow(l, farmId)).select().single<LocationRow>()));
}
export async function updateLocation(l: SaleLocation, farmId: string = DEFAULT_FARM_ID): Promise<SaleLocation> {
  return locFromRow(must(await supabase.from("sale_locations").update(locToRow(l, farmId)).eq("id", l.id).select().single<LocationRow>()));
}
export async function deleteLocation(id: string): Promise<void> {
  must(await supabase.from("sale_locations").delete().eq("id", id));
}

/* ---------------- CUSTOMERS ---------------- */
interface CustomerRow { id: string; name: string; phone: string | null; type: SaleType; address: string | null; notes: string | null }
const custFromRow = (r: CustomerRow): Customer => ({ id: r.id, name: r.name, phone: r.phone, type: r.type, address: r.address, notes: r.notes });
const custToRow = (c: Partial<Customer>, farmId: string) => ({ farm_id: farmId, name: c.name, phone: c.phone || null, type: c.type || "retail", address: c.address || null, notes: c.notes || null });

export async function listCustomers(farmId: string = DEFAULT_FARM_ID): Promise<Customer[]> {
  const rows = must(await supabase.from("customers").select("*").eq("farm_id", farmId).order("created_at", { ascending: false }));
  return (rows as CustomerRow[]).map(custFromRow);
}
export async function createCustomer(c: Partial<Customer>, farmId: string = DEFAULT_FARM_ID): Promise<Customer> {
  return custFromRow(must(await supabase.from("customers").insert(custToRow(c, farmId)).select().single<CustomerRow>()));
}
export async function updateCustomer(c: Customer, farmId: string = DEFAULT_FARM_ID): Promise<Customer> {
  return custFromRow(must(await supabase.from("customers").update(custToRow(c, farmId)).eq("id", c.id).select().single<CustomerRow>()));
}
export async function deleteCustomer(id: string): Promise<void> {
  must(await supabase.from("customers").delete().eq("id", id));
}

/* ---------------- SALES ---------------- */
interface SaleRow {
  id: string; location_id: string | null; customer_id: string | null; sale_type: SaleType; date: string;
  quantity: number; weight_kg: number; unit_price: number; total_revenue: number; note: string | null;
}
const saleFromRow = (r: SaleRow): Sale => ({ id: r.id, locationId: r.location_id, customerId: r.customer_id, saleType: r.sale_type, date: r.date, quantity: r.quantity, weightKg: r.weight_kg, unitPrice: r.unit_price, totalRevenue: r.total_revenue, note: r.note });
const saleToRow = (s: Partial<Sale>, farmId: string) => ({
  farm_id: farmId, location_id: s.locationId || null, customer_id: s.customerId || null, sale_type: s.saleType, date: s.date,
  quantity: s.quantity, weight_kg: s.weightKg, unit_price: s.unitPrice, total_revenue: s.totalRevenue, note: s.note || null,
});

export async function listSales(farmId: string = DEFAULT_FARM_ID): Promise<Sale[]> {
  const rows = must(await supabase.from("sales").select("*").eq("farm_id", farmId).order("date", { ascending: false }));
  return (rows as SaleRow[]).map(saleFromRow);
}
export async function createSale(s: Partial<Sale>, farmId: string = DEFAULT_FARM_ID): Promise<Sale> {
  return saleFromRow(must(await supabase.from("sales").insert(saleToRow(s, farmId)).select().single<SaleRow>()));
}
export async function updateSale(s: Sale, farmId: string = DEFAULT_FARM_ID): Promise<Sale> {
  return saleFromRow(must(await supabase.from("sales").update(saleToRow(s, farmId)).eq("id", s.id).select().single<SaleRow>()));
}
export async function deleteSale(id: string): Promise<void> {
  must(await supabase.from("sales").delete().eq("id", id));
}
