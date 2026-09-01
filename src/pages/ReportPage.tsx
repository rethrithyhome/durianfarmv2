import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useTrees } from "@/hooks/useTrees";
import { useEvents } from "@/hooks/useYield";
import { useExpenses } from "@/hooks/useExpenses";
import { useLocations, useCustomers, useSales } from "@/hooks/useSales";
import { HEALTH_LEVELS, YIELD_EVENT_TYPES, EXPENSE_CATEGORIES, expenseInfo } from "@/lib/constants";
import { fmtDate, thisYear } from "@/lib/format";
import { fmtCurrency } from "@/lib/currency";
import { downloadCSV } from "@/lib/csv";
import { C } from "@/lib/tokens";
import { SALE_TYPES } from "@/lib/constants";

export function ReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const treesQ = useTrees(enabled);
  const eventsQ = useEvents(enabled);
  const expensesQ = useExpenses(enabled);
  const locationsQ = useLocations(enabled);
  const customersQ = useCustomers(enabled);
  const salesQ = useSales(enabled);

  const trees = treesQ.data ?? [];
  const events = eventsQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const locations = locationsQ.data ?? [];
  const customers = customersQ.data ?? [];
  const sales = salesQ.data ?? [];

  const yearEvents = events.filter((e) => new Date(e.date).getFullYear() === thisYear);
  const sums = yearEvents.reduce<Record<string, number>>((a, e) => { a[e.type] = (a[e.type] || 0) + e.quantity; return a; }, {});
  const totalWeight = yearEvents.filter((e) => e.type === "harvested").reduce((s, e) => s + (e.weightKg || 0), 0);
  const yearExpenses = expenses.filter((e) => new Date(e.date).getFullYear() === thisYear);
  const totalExpense = yearExpenses.reduce((s, e) => s + e.amountKhr, 0);
  const yearSales = sales.filter((s) => new Date(s.date).getFullYear() === thisYear);
  const totalRevenue = yearSales.reduce((s, r) => s + r.totalRevenueKhr, 0);
  const healthCounts = HEALTH_LEVELS.map((h) => ({ ...h, count: trees.filter((t) => t.health === h.key).length }));
  const expenseByCat = EXPENSE_CATEGORIES.map((c) => ({ ...c, total: yearExpenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amountKhr, 0) })).filter((c) => c.total > 0);
  const topCustomers = customers
    .map((cu) => {
      const purchases = yearSales.filter((s) => s.customerId === cu.id);
      return { ...cu, qty: purchases.reduce((s, p) => s + p.quantity, 0), revenue: purchases.reduce((s, p) => s + p.totalRevenueKhr, 0) };
    })
    .filter((cu) => cu.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
      <div className="no-print sticky top-0 flex items-center justify-between px-4 lg:px-8 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV(`customers-${thisYear}.csv`, [["អតិថិជន", "ប្រភេទ", "ចំនួនផ្លែ", "ចំណូល"], ...topCustomers.map((cu) => [cu.name, SALE_TYPES.find((t) => t.key === cu.type)?.label ?? "", cu.qty, cu.revenue])])} className="rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.green }}>CSV អតិថិជន</button>
          <button onClick={() => downloadCSV(`expenses-${thisYear}.csv`, [["កាលបរិច្ឆេទ", "ប្រភេទ", "ចំនួន", "កំណត់ចំណាំ"], ...yearExpenses.map((e) => [e.date, expenseInfo(e.category).label, e.amountKhr, e.note ?? ""])])} className="rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.green }}>CSV ចំណាយ</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Printer size={13} /> បោះពុម្ព</button>
        </div>
      </div>
      <div className="print-area p-5 lg:p-8 max-w-2xl mx-auto">
        <h1 className="text-lg font-bold mb-1" style={{ color: C.green }}>{farmQ.data?.farmName} — របាយការណ៍ឆ្នាំ {thisYear}</h1>
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ចេញកាលបរិច្ឆេទ {fmtDate(new Date().toISOString())}</div>

        <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>សង្ខេបហិរញ្ញវត្ថុ</h2>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-2.5 text-center" style={{ border: `1px solid ${C.line}` }}><div className="text-sm font-bold" style={{ color: C.greenMid }}>{fmtCurrency(totalRevenue, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណូល</div></div>
          <div className="rounded-xl p-2.5 text-center" style={{ border: `1px solid ${C.line}` }}><div className="text-sm font-bold" style={{ color: C.red }}>{fmtCurrency(totalExpense, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណាយ</div></div>
          <div className="rounded-xl p-2.5 text-center" style={{ border: `1px solid ${C.line}` }}><div className="text-sm font-bold" style={{ color: totalRevenue - totalExpense >= 0 ? C.greenMid : C.red }}>{fmtCurrency(totalRevenue - totalExpense, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណេញសុទ្ធ</div></div>
        </div>

        <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>ដើមទុរេន ({trees.length})</h2>
        <table className="w-full text-[11px] mb-4" style={{ borderCollapse: "collapse" }}>
          <thead><tr>{["សុខភាព", "ចំនួន"].map((h) => <th key={h} className="text-left p-1.5" style={{ border: `1px solid ${C.line}`, background: C.bgAlt }}>{h}</th>)}</tr></thead>
          <tbody>{healthCounts.map((h) => <tr key={h.key}><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{h.label}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{h.count}</td></tr>)}</tbody>
        </table>

        <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>ទិន្នផលឆ្នាំ {thisYear}</h2>
        <table className="w-full text-[11px] mb-4" style={{ borderCollapse: "collapse" }}>
          <thead><tr>{["ប្រភេទ", "ចំនួនផ្លែ"].map((h) => <th key={h} className="text-left p-1.5" style={{ border: `1px solid ${C.line}`, background: C.bgAlt }}>{h}</th>)}</tr></thead>
          <tbody>
            {YIELD_EVENT_TYPES.map((y) => <tr key={y.key}><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{y.label}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{sums[y.key] || 0}</td></tr>)}
            <tr><td className="p-1.5 font-semibold" style={{ border: `1px solid ${C.line}` }}>ទម្ងន់សរុប</td><td className="p-1.5 font-semibold" style={{ border: `1px solid ${C.line}` }}>{totalWeight.toFixed(1)} kg</td></tr>
          </tbody>
        </table>

        {expenseByCat.length > 0 && (
          <>
            <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>ចំណាយតាមប្រភេទ</h2>
            <table className="w-full text-[11px] mb-4" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["ប្រភេទ", "ចំនួន"].map((h) => <th key={h} className="text-left p-1.5" style={{ border: `1px solid ${C.line}`, background: C.bgAlt }}>{h}</th>)}</tr></thead>
              <tbody>{expenseByCat.map((c) => <tr key={c.key}><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{c.label}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{fmtCurrency(c.total, "KHR")}</td></tr>)}</tbody>
            </table>
          </>
        )}

        <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>ទីតាំងលក់ ({locations.length})</h2>
        <table className="w-full text-[11px] mb-4" style={{ borderCollapse: "collapse" }}>
          <thead><tr>{["ទីតាំង", "ចំណូល"].map((h) => <th key={h} className="text-left p-1.5" style={{ border: `1px solid ${C.line}`, background: C.bgAlt }}>{h}</th>)}</tr></thead>
          <tbody>{locations.map((l) => <tr key={l.id}><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{l.name}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{fmtCurrency(yearSales.filter((s) => s.locationId === l.id).reduce((s, r) => s + r.totalRevenueKhr, 0), "KHR")}</td></tr>)}</tbody>
        </table>

        {topCustomers.length > 0 && (
          <>
            <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>អតិថិជនកំពូល ឆ្នាំ {thisYear}</h2>
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["អតិថិជន", "ប្រភេទ", "ចំនួនផ្លែ", "ចំណូល"].map((h) => <th key={h} className="text-left p-1.5" style={{ border: `1px solid ${C.line}`, background: C.bgAlt }}>{h}</th>)}</tr></thead>
              <tbody>{topCustomers.map((cu) => <tr key={cu.id}><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{cu.name}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{SALE_TYPES.find((t) => t.key === cu.type)?.label}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{cu.qty}</td><td className="p-1.5" style={{ border: `1px solid ${C.line}` }}>{fmtCurrency(cu.revenue, "KHR")}</td></tr>)}</tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
