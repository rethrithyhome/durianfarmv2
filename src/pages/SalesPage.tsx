import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Store, Package, Truck, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useSales, useCreateSale, useUpdateSale, useDeleteSale } from "@/hooks/useSales";
import { useEvents } from "@/hooks/useYield";
import { can } from "@/lib/permissions";
import { SALE_TYPES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { fmtCurrency } from "@/lib/currency";
import { C } from "@/lib/tokens";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { SortMenu } from "@/components/ui/SortMenu";
import { LocationForm } from "@/components/sales/LocationForm";
import { CustomerForm } from "@/components/sales/CustomerForm";
import { SaleForm } from "@/components/sales/SaleForm";
import type { Customer, FarmSettings, Role, Sale, SaleLocation } from "@/types/domain";

type SortKey = "recent" | "amount";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [{ key: "recent", label: "កាលបរិច្ឆេទ" }, { key: "amount", label: "ចំនួនទឹកប្រាក់" }];

export function SalesPage({ role, farm }: { role: Role; farm: FarmSettings }) {
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const [sub, setSub] = useState<"locations" | "customers" | "revenue">("locations");

  const locationsQ = useLocations(enabled);
  const customersQ = useCustomers(enabled);
  const salesQ = useSales(enabled);
  const eventsQ = useEvents(enabled);

  const createLoc = useCreateLocation(); const updateLoc = useUpdateLocation(); const deleteLoc = useDeleteLocation();
  const createCust = useCreateCustomer(); const updateCust = useUpdateCustomer(); const deleteCust = useDeleteCustomer();
  const createSale = useCreateSale(); const updateSale = useUpdateSale(); const deleteSale = useDeleteSale();

  const [locModal, setLocModal] = useState<{ mode: "add" | "edit"; loc?: SaleLocation } | null>(null);
  const [custModal, setCustModal] = useState<{ mode: "add" | "edit"; cust?: Customer } | null>(null);
  const [saleModal, setSaleModal] = useState<{ mode: "add" | "edit"; sale?: Sale } | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");

  const locations = locationsQ.data ?? [];
  const customers = customersQ.data ?? [];
  const sales = salesQ.data ?? [];
  const events = eventsQ.data ?? [];
  const totalRevenue = sales.reduce((s, r) => s + r.totalRevenueKhr, 0);

  const sortedSales = useMemo(() => {
    const list = [...sales];
    if (sort === "recent") list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else list.sort((a, b) => b.totalRevenueKhr - a.totalRevenueKhr);
    return list;
  }, [sales, sort]);

  return (
    <div className="pt-1 pb-4">
      <div className="flex rounded-xl p-1 mb-3" style={{ background: C.bgAlt }}>
        <button onClick={() => setSub("locations")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "locations" ? C.card : "transparent", color: sub === "locations" ? C.green : C.inkSoft }}>ទីតាំង</button>
        <button onClick={() => setSub("customers")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "customers" ? C.card : "transparent", color: sub === "customers" ? C.green : C.inkSoft }}>អតិថិជន</button>
        <button onClick={() => setSub("revenue")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: sub === "revenue" ? C.card : "transparent", color: sub === "revenue" ? C.green : C.inkSoft }}>ចំណូល ({fmtCurrency(totalRevenue, "KHR")})</button>
      </div>

      {sub === "locations" && (
        <>
          <div className="flex justify-end mb-3">{can(role, "addLocation") && <button onClick={() => setLocModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Plus size={13} /> ទីតាំងថ្មី</button>}</div>
          {locations.length === 0 ? (
            <EmptyState icon={Store} title="មិនទាន់មានទីតាំងលក់" hint="បន្ថែមទីតាំងលក់ (ផ្សារ, ហាង ។ល។)" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {locations.map((l) => {
                const delivered = events.filter((e) => e.type === "harvested" && e.destination === l.id);
                const qty = delivered.reduce((s, e) => s + e.quantity, 0);
                const wt = delivered.reduce((s, e) => s + (e.weightKg || 0), 0);
                return (
                  <div key={l.id} className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><Store size={15} color={C.greenMid} /><div className="text-sm font-semibold" style={{ color: C.ink }}>{l.name}</div></div>
                      {can(role, "editLocation") && <div className="flex items-center gap-2"><button onClick={() => setLocModal({ mode: "edit", loc: l })}><Pencil size={13} color={C.inkSoft} /></button>{can(role, "deleteLocation") && <button onClick={() => deleteLoc.mutate(l.id)}><Trash2 size={13} color={C.red} /></button>}</div>}
                    </div>
                    {l.area && <div className="text-[11px] mb-1.5" style={{ color: C.inkSoft }}>{l.area}</div>}
                    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.inkSoft }}><Truck size={12} /> បានទទួល៖ {qty} ផ្លែ · {wt.toFixed(0)} kg</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {sub === "customers" && (
        <>
          <div className="flex justify-end mb-3">{can(role, "addCustomer") && <button onClick={() => setCustModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Plus size={13} /> អតិថិជនថ្មី</button>}</div>
          {customers.length === 0 ? (
            <EmptyState icon={User} title="មិនទាន់មានអតិថិជន" hint="កត់ត្រាអតិថិជនលក់រាយ និងលក់ដុំ ដើម្បីជាទិន្នន័យសម្រាប់ឆ្នាំក្រោយៗ" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {customers.map((cu) => {
                const purchases = sales.filter((s) => s.customerId === cu.id);
                const totalQty = purchases.reduce((s, p) => s + p.quantity, 0);
                const totalSpent = purchases.reduce((s, p) => s + p.totalRevenueKhr, 0);
                return (
                  <div key={cu.id} className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User size={15} color={C.greenMid} />
                        <div className="text-sm font-semibold" style={{ color: C.ink }}>{cu.name}</div>
                        <Badge label={SALE_TYPES.find((t) => t.key === cu.type)?.label} color={cu.type === "wholesale" ? C.blue : C.goldDeep} />
                      </div>
                      {can(role, "editCustomer") && <div className="flex items-center gap-2"><button onClick={() => setCustModal({ mode: "edit", cust: cu })}><Pencil size={13} color={C.inkSoft} /></button>{can(role, "deleteCustomer") && <button onClick={() => deleteCust.mutate(cu.id)}><Trash2 size={13} color={C.red} /></button>}</div>}
                    </div>
                    {(cu.phone || cu.address) && <div className="text-[11px] mb-1.5" style={{ color: C.inkSoft }}>{cu.phone}{cu.phone && cu.address ? " · " : ""}{cu.address}</div>}
                    <div className="text-[11px]" style={{ color: C.inkSoft }}>បានទិញ៖ {totalQty} ផ្លែ ក្នុង {purchases.length} ដង · សរុប <b style={{ color: C.greenMid }}>{fmtCurrency(totalSpent, "KHR")}</b></div>
                    {cu.notes && <div className="text-[11px] mt-1" style={{ color: C.ink }}>{cu.notes}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {sub === "revenue" && (
        <>
          <div className="flex items-center justify-between mb-3">
            {can(role, "addSale") && <button onClick={() => setSaleModal({ mode: "add" })} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Plus size={13} /> ការលក់ថ្មី</button>}
            <SortMenu value={sort} options={SORT_OPTIONS} onChange={setSort} />
          </div>
          {sortedSales.length === 0 ? (
            <EmptyState icon={Package} title="មិនទាន់មានកំណត់ត្រាលក់" hint="កត់ត្រាការលក់ដើម្បីតាមដានចំណូល" />
          ) : (
            <div className="space-y-2">
              {sortedSales.map((s) => {
                const loc = locations.find((l) => l.id === s.locationId);
                const cust = customers.find((c) => c.id === s.customerId);
                return (
                  <div key={s.id} className="rounded-2xl p-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-semibold" style={{ color: C.ink }}>{cust ? cust.name : (loc ? loc.name : "—")} <Badge label={SALE_TYPES.find((t) => t.key === s.saleType)?.label} color={s.saleType === "wholesale" ? C.blue : C.goldDeep} /></div>
                      <div className="flex items-center gap-2">{can(role, "editSale") && <button onClick={() => setSaleModal({ mode: "edit", sale: s })}><Pencil size={13} color={C.inkSoft} /></button>}{can(role, "deleteSale") && <button onClick={() => deleteSale.mutate(s.id)}><Trash2 size={13} color={C.red} /></button>}</div>
                    </div>
                    <div className="text-[11px]" style={{ color: C.inkSoft }}>{fmtDate(s.date)}{loc && cust ? ` · ${loc.name}` : ""} · {s.quantity} ផ្លែ · {s.weightKg || 0}kg · {fmtCurrency(s.unitPrice, s.currency)}/kg</div>
                    <div className="text-sm font-bold mt-1" style={{ color: C.greenMid }}>{fmtCurrency(s.totalRevenue, s.currency)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {locModal && (
        <LocationForm initial={locModal.loc} onClose={() => setLocModal(null)} onSubmit={async (l) => { locModal.mode === "add" ? await createLoc.mutateAsync(l) : await updateLoc.mutateAsync(l as SaleLocation); }} />
      )}
      {custModal && (
        <CustomerForm initial={custModal.cust} onClose={() => setCustModal(null)} onSubmit={async (c) => { custModal.mode === "add" ? await createCust.mutateAsync(c) : await updateCust.mutateAsync(c as Customer); }} />
      )}
      {saleModal && (
        <SaleForm
          initial={saleModal.sale}
          locations={locations}
          customers={customers}
          exchangeRate={farm.exchangeRate}
          onAddCustomer={async (c) => createCust.mutateAsync(c)}
          onClose={() => setSaleModal(null)}
          onSubmit={async (s) => { saleModal.mode === "add" ? await createSale.mutateAsync(s) : await updateSale.mutateAsync(s as Sale); }}
        />
      )}
    </div>
  );
}
