import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmSettings } from "@/hooks/useFarmSettings";
import { useWorkers } from "@/hooks/useWorkers";
import { useWorkLogs, usePayrollPayments } from "@/hooks/usePayroll";
import { cycleFor, shiftCycle, cycleWorkedFraction } from "@/lib/payroll";
import { fmtCurrency, toKhr } from "@/lib/currency";
import { fmtDate, todayISO } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { C } from "@/lib/tokens";
import { PrintHeader, PrintFooter } from "@/components/ui/PrintLayout";
import { inputCls, inputStyle } from "@/components/ui/primitives";

type Mode = "daily" | "salary";

export function PayrollReportPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const enabled = !!profile?.farmId;
  const farmQ = useFarmSettings(enabled);
  const workersQ = useWorkers(enabled);
  const logsQ = useWorkLogs(enabled);
  const paymentsQ = usePayrollPayments(enabled);

  const farm = farmQ.data;
  const [mode, setMode] = useState<Mode>("daily");
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(weekAgo);
  const [end, setEnd] = useState(todayISO());
  const [cycleRef, setCycleRef] = useState(new Date());

  const cycle = useMemo(
    () => cycleFor(cycleRef, farm?.payrollCycleStartDay ?? 1),
    [cycleRef, farm?.payrollCycleStartDay]
  );

  const workers = (workersQ.data ?? []).filter((w) => w.status === "active");
  const logs = logsQ.data ?? [];
  const payments = paymentsQ.data ?? [];
  const rate = farm?.exchangeRate ?? 4100;

  /* Pivot: one row per worker, one column per date worked. This reads
     like a real payroll sheet — pick a worker's row and scan across to
     see exactly what they earned each day, at a glance. */
  const dateList = useMemo(() => {
    const set = new Set<string>();
    for (const w of workers) {
      if (w.wageType !== "hourly") continue;
      const byDay = w.dailyRateMode === "daily";
      for (const l of logs) {
        if (l.workerId !== w.id || l.date < start || l.date > end) continue;
        if (byDay ? l.dayAmount != null : l.hours > 0) set.add(l.date);
      }
    }
    return Array.from(set).sort();
  }, [workers, logs, start, end]);

  type PivotCell = { amount: number; paid: boolean } | null;
  const pivotRows = useMemo(() => {
    return workers
      .filter((w) => w.wageType === "hourly")
      .map((w) => {
        const byDay = w.dailyRateMode === "daily";
        const cells: PivotCell[] = dateList.map((date) => {
          const log = logs.find((l) => l.workerId === w.id && l.date === date);
          if (!log) return null;
          const has = byDay ? log.dayAmount != null : log.hours > 0;
          if (!has) return null;
          const amount = byDay ? (log.dayAmount ?? 0) : log.hours * w.wageRate;
          return { amount, paid: !!log.paymentId };
        });
        const present = cells.filter((c): c is { amount: number; paid: boolean } => c !== null);
        const total = present.reduce((s, c) => s + c.amount, 0);
        const totalKhr = toKhr(total, w.wageCurrency, rate);
        const paidCount = present.filter((c) => c.paid).length;
        const status = present.length === 0 ? "—" : paidCount === present.length ? "បង់រួច" : paidCount === 0 ? "មិនទាន់បង់" : "បង់ខ្លះ";
        return { worker: w, cells, total, totalKhr, status };
      })
      .filter((r) => r.cells.some((c) => c !== null))
      .sort((a, b) => a.worker.name.localeCompare(b.worker.name, "km"));
  }, [workers, logs, dateList, rate]);

  const shortDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };

  /* Salaried workers for the chosen cycle */
  const salaryRows = useMemo(() => workers
    .filter((w) => w.wageType === "monthly")
    .map((w) => {
      const frac = cycleWorkedFraction(cycle, w.startDate);
      const amount = w.wageRate * frac;
      const paid = payments.some((p) => p.workerId === w.id && p.wageType === "monthly" && p.cycleStart === cycle.start);
      return { w, frac, amount, amountKhr: toKhr(amount, w.wageCurrency, rate), paid };
    })
    .filter((r) => r.amount > 0), [workers, payments, cycle, rate]);


  const dailyTotal = pivotRows.reduce((s, r) => s + r.totalKhr, 0);
  const salaryTotal = salaryRows.reduce((s, r) => s + r.amountKhr, 0);

  const exportCSV = () => {
    if (mode === "daily") {
      downloadCSV(`payroll-daily-${start}_${end}.csv`, [
        ["ឈ្មោះ", ...dateList.map(shortDate), "សរុប", "រូបិយប័ណ្ណ", "សរុប (៛)", "ស្ថានភាព"],
        ...pivotRows.map((r) => [
          r.worker.name, ...r.cells.map((c) => (c ? Math.round(c.amount) : "")),
          Math.round(r.total), r.worker.wageCurrency, Math.round(r.totalKhr), r.status,
        ]),
        ["", ...dateList.map(() => ""), "", "", "", ""],
        ["សរុប", ...dateList.map(() => ""), "", "", Math.round(dailyTotal), ""],
      ]);
    } else {
      downloadCSV(`payroll-salary-${cycle.start}_${cycle.end}.csv`, [
        ["ឈ្មោះ", "ភេទ", "ប្រាក់ខែ", "រូបិយប័ណ្ណ", "សមាមាត្រខួប", "ចំនួនត្រូវបង់", "សរុប (៛)", "ស្ថានភាព"],
        ...salaryRows.map((r) => [
          r.w.name, r.w.gender ?? "", r.w.wageRate, r.w.wageCurrency,
          `${Math.round(r.frac * 100)}%`, r.amount, Math.round(r.amountKhr), r.paid ? "បើករួច" : "មិនទាន់បើក",
        ]),
        ["", "", "", "", "", "សរុប", Math.round(salaryTotal), ""],
      ]);
    }
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

        <div className="flex rounded-xl p-1 mb-3" style={{ background: C.bgAlt }}>
          <button onClick={() => setMode("daily")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: mode === "daily" ? C.card : "transparent", color: mode === "daily" ? C.green : C.inkSoft }}>ប្រាក់ថ្ងៃ (តាមថ្ងៃ)</button>
          <button onClick={() => setMode("salary")} className="flex-1 rounded-lg py-2 text-[11px] font-semibold" style={{ background: mode === "salary" ? C.card : "transparent", color: mode === "salary" ? C.green : C.inkSoft }}>ប្រាក់ខែ (តាមខួប)</button>
        </div>

        {mode === "daily" ? (
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
        ) : (
          <div className="flex items-center justify-between rounded-xl px-2 py-2" style={{ background: C.bgAlt }}>
            <button onClick={() => setCycleRef(new Date(shiftCycle(cycle, farm?.payrollCycleStartDay ?? 1, -1).start))} className="px-3 py-1 text-xs font-semibold" style={{ color: C.green }}>← មុន</button>
            <div className="text-xs font-semibold" style={{ color: C.green }}>{cycle.label}</div>
            <button onClick={() => setCycleRef(new Date(shiftCycle(cycle, farm?.payrollCycleStartDay ?? 1, 1).start))} className="px-3 py-1 text-xs font-semibold" style={{ color: C.green }}>បន្ទាប់ →</button>
          </div>
        )}
      </div>

      <div className="print-area p-5 lg:p-8 max-w-3xl mx-auto">
        <PrintHeader farmName={farm?.farmName} farmLogo={farm?.logo} title="តារាងចំណាយប្រាក់ឈ្នួល" subtitle={mode === "daily" ? `ប្រាក់ថ្ងៃ · ${fmtDate(start)} – ${fmtDate(end)}` : `ប្រាក់ខែ · ${cycle.label}`} />

        {mode === "daily" ? (
          pivotRows.length === 0 ? (
            <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានទិន្នន័យក្នុងចន្លោះថ្ងៃនេះទេ</div>
          ) : (
            <>
              {dateList.length > 10 && (
                <div className="text-[10px] mb-2" style={{ color: C.goldDeep }}>ណែនាំបោះពុម្ព A4 ផ្ដេក (landscape) ព្រោះមានច្រើនថ្ងៃ</div>
              )}
              <div className="overflow-x-auto mb-2 no-print" style={{ border: `1px solid ${C.line}`, borderRadius: 8 }}>
                <table className="text-[11px]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th className="text-left p-1.5 sticky left-0" style={{ ...th, zIndex: 1 }}>ឈ្មោះ</th>
                      {dateList.map((d) => <th key={d} className="text-center p-1.5 whitespace-nowrap" style={th}>{shortDate(d)}</th>)}
                      <th className="text-right p-1.5 whitespace-nowrap" style={th}>សរុប</th>
                      <th className="text-left p-1.5 whitespace-nowrap" style={th}>ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivotRows.map((r) => (
                      <tr key={r.worker.id}>
                        <td className="p-1.5 font-medium sticky left-0 whitespace-nowrap" style={{ ...td, background: C.card }}>{r.worker.name}</td>
                        {r.cells.map((c, i) => (
                          <td key={i} className="text-center p-1.5 whitespace-nowrap" style={{ ...td, color: c ? (c.paid ? C.greenMid : C.goldDeep) : C.inkSoft }}>
                            {c ? c.amount.toLocaleString() : "–"}
                          </td>
                        ))}
                        <td className="text-right p-1.5 font-semibold whitespace-nowrap" style={td}>{fmtCurrency(r.total, r.worker.wageCurrency)}</td>
                        <td className="p-1.5 whitespace-nowrap" style={td}>{r.status}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="p-1.5 font-semibold sticky left-0" style={{ ...td, background: C.bgAlt }} colSpan={dateList.length + 1}>សរុបទាំងអស់</td>
                      <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={2}>{fmtCurrency(dailyTotal, "KHR")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Simplified print-only version — the sticky/scroll table above is for screen use */}
              <table className="hidden print:table w-full text-[10px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th className="text-left p-1" style={th}>ឈ្មោះ</th>
                    {dateList.map((d) => <th key={d} className="text-center p-1" style={th}>{shortDate(d)}</th>)}
                    <th className="text-right p-1" style={th}>សរុប</th>
                    <th className="text-left p-1" style={th}>ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotRows.map((r) => (
                    <tr key={r.worker.id}>
                      <td className="p-1 font-medium" style={td}>{r.worker.name}</td>
                      {r.cells.map((c, i) => <td key={i} className="text-center p-1" style={td}>{c ? c.amount.toLocaleString() : "–"}</td>)}
                      <td className="text-right p-1 font-semibold" style={td}>{fmtCurrency(r.total, r.worker.wageCurrency)}</td>
                      <td className="p-1" style={td}>{r.status}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-1 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={dateList.length + 1}>សរុបទាំងអស់</td>
                    <td className="p-1 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={2}>{fmtCurrency(dailyTotal, "KHR")}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )
        ) : (
          salaryRows.length === 0 ? (
            <div className="text-xs" style={{ color: C.inkSoft }}>គ្មានកម្មករប្រាក់ខែក្នុងខួបនេះទេ</div>
          ) : (
            <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
              <thead><tr>{["ឈ្មោះ", "ប្រាក់ខែ", "សមាមាត្រ", "ចំនួនត្រូវបង់", "ស្ថានភាព"].map((h) => <th key={h} className="text-left p-1.5" style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {salaryRows.map((r) => (
                  <tr key={r.w.id}>
                    <td className="p-1.5" style={td}>{r.w.name}</td>
                    <td className="p-1.5" style={td}>{fmtCurrency(r.w.wageRate, r.w.wageCurrency)}</td>
                    <td className="p-1.5" style={td}>{Math.round(r.frac * 100)}%</td>
                    <td className="p-1.5" style={td}>{fmtCurrency(r.amount, r.w.wageCurrency)}{r.w.wageCurrency === "USD" ? ` (≈${fmtCurrency(r.amountKhr, "KHR")})` : ""}</td>
                    <td className="p-1.5" style={td}>{r.paid ? "បើករួច" : "មិនទាន់បើក"}</td>
                  </tr>
                ))}
                <tr>
                  <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={3}>សរុប</td>
                  <td className="p-1.5 font-semibold" style={{ ...td, background: C.bgAlt }} colSpan={2}>{fmtCurrency(salaryTotal, "KHR")}</td>
                </tr>
              </tbody>
            </table>
          )
        )}

        <PrintFooter />
      </div>
    </div>
  );
}
