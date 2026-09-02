import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { EXPENSE_CATEGORIES, expenseInfo } from "@/lib/constants";
import { fmtCurrency } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { C } from "@/lib/tokens";
import { inputCls, inputStyle } from "@/components/ui/primitives";

export function ExpenseReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const expensesQ = useExpenses(enabled);

  const farm = farmQ.data;
  const weekAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(todayISO());

  const expenses = expensesQ.data ?? [];

  // One combined table, sorted by category then date — as requested,
  // rather than a separate table per category.
  const rows = useMemo(() => {
    const inRange = expenses.filter((e) => e.date >= start && e.date <= end);
    inRange.sort((a, b) => a.category.localeCompare(b.category) || a.date.localeCompare(b.date));
    return inRange;
  }, [expenses, start, end]);

  const total = rows.reduce((s, e) => s + e.amountKhr, 0);
  const totalUnpaid = rows.filter((e) => !e.paid).reduce((s, e) => s + e.amountKhr, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of rows) map.set(e.category, (map.get(e.category) ?? 0) + e.amountKhr);
    return EXPENSE_CATEGORIES.map((c) => ({ ...c, total: map.get(c.key) ?? 0 })).filter((c) => c.total > 0);
  }, [rows]);

  const exportCSV = () => {
    downloadCSV(`expenses-${start}_${end}.csv`, [
      ["ថ្ងៃ", "ប្រភេទ", "ចំនួនទឹកប្រាក់", "រូបិយប័ណ្ណ", "សរុប (៛)", "ស្ថានភាព", "អ្នកលក់", "កំណត់ចំណាំ"],
      ...rows.map((e) => [
        e.date, expenseInfo(e.category).label, e.amount, e.currency, Math.round(e.amountKhr),
        e.paid ? "បង់រួច" : "ជំពាក់", e.vendor ?? "", e.note ?? "",
      ]),
      ["", "", "", "", "", "", "", ""],
      ["", "សរុប", "", "", Math.round(total), "", "", ""],
      ["", "នៅជំពាក់", "", "", Math.round(totalUnpaid), "", "", ""],
    ]);
  };

  const th = { border: `1px solid ${C.line}`, background: C.bgAlt } as const;
  const td = { border: `1px solid ${C.line}` } as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
      <div className="no-print sticky top-0 px-4 lg:px-8 py-3" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.greenMid }}><ArrowLeft size={15} /> ត្រឡប់ក្រោយ</button>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: C.bgAlt, color: C.green }}><Download size={13} /> CSV</button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: C.green, color: "#fff" }}><Printer size={13} /> បោះពុម្ព</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10.5px] mb-1" style={{ color: C.inkSoft }}>ពីថ្ងៃ</div>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-[10.5px] mb-1" style={{ color: C.inkSoft }}>ដល់ថ្ងៃ</div>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
        </div>
      </div>

      <div className="print-area p-5 lg:p-8 max-w-3xl mx-auto">
        <h1 className="text-lg font-bold mb-1" style={{ color: C.green }}>{farm?.farmName} — តារាងចំណាយ</h1>
        <div className="text-[11px] mb-1" style={{ color: C.inkSoft }}>{fmtDate(start)} – {fmtDate(end)}</div>
        <div className="text-[11px] mb-4" style={{ color: C.inkSoft }}>ចេញកាលបរិច្ឆេទ {fmtDate(todayISO())}</div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-xl p-2.5 text-center" style={{ border: `1px solid ${C.line}` }}><div className="text-sm font-bold" style={{ color: C.red }}>{fmtCurrency(total, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>ចំណាយសរុប</div></div>
          <div className="rounded-xl p-2.5 text-center" style={{ border: `1px solid ${C.line}` }}><div className="text-sm font-bold" style={{ color: C.goldDeep }}>{fmtCurrency(totalUnpaid, "KHR")}</div><div className="text-[10px]" style={{ color: C.inkSoft }}>នៅជំពាក់</div></div>
        </div>

        {rows.length === 0 ? (
          <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានទិន្នន័យក្នុងចន្លោះថ្ងៃនេះទេ</div>
        ) : (
          <>
            <table className="w-full text-[11px] mb-5" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["ថ្ងៃ", "ប្រភេទ", "ចំនួនទឹកប្រាក់", "ស្ថានភាព", "អ្នកលក់"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="p-1.5" style={td}>{fmtDate(e.date)}</td>
                    <td className="p-1.5" style={td}>{expenseInfo(e.category).label}</td>
                    <td className="p-1.5" style={td}>{fmtCurrency(e.amount, e.currency)}{e.currency === "USD" ? ` (≈${fmtCurrency(e.amountKhr, "KHR")})` : ""}</td>
                    <td className="p-1.5" style={td}>{e.paid ? "បង់រួច" : "ជំពាក់"}</td>
                    <td className="p-1.5" style={td}>{e.vendor ?? ""}</td>
                  </tr>
                ))}
                <tr>
                  <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={2}>សរុប</td>
                  <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={3}>{fmtCurrency(total, "KHR")}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-sm font-bold mb-2" style={{ color: C.green }}>សង្ខេបតាមប្រភេទ</h2>
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["ប្រភេទ", "សរុប (៛)"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {byCategory.map((c) => (
                  <tr key={c.key}>
                    <td className="p-1.5" style={td}>{c.label}</td>
                    <td className="p-1.5" style={td}>{fmtCurrency(c.total, "KHR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="grid grid-cols-2 gap-8 mt-10 text-[11px]" style={{ color: C.inkSoft }}>
          <div>
            <div className="mb-10">អ្នករៀបចំ</div>
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div>
          </div>
          <div>
            <div className="mb-10">អ្នកអនុម័ត</div>
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>ហត្ថលេខា និងឈ្មោះ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
